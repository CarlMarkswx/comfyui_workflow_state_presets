import { app } from "/scripts/app.js";

const EXTENSION_NAME = "comfyui.preset_group_editor";
const TARGET_NODE_NAME = "PresetGroupEditor";

const MODE_ENABLE = LiteGraph.ALWAYS;
const MODE_BYPASS = 4;
const MODE_DISABLE = LiteGraph.NEVER;

const PROPERTY_MATCH_COLORS = "matchColors";
const PROPERTY_MATCH_TITLE = "matchTitle";
const PROPERTY_SHOW_NAV = "showNav";
const PROPERTY_SHOW_ALL_GRAPHS = "showAllGraphs";
const PROPERTY_SORT = "sort";
const PROPERTY_SORT_CUSTOM_ALPHA = "customSortAlphabet";
const PROPERTY_RESTRICTION = "toggleRestriction";

function normalizeHexColor(color) {
  if (!color) return "";
  let c = String(color).trim().toLowerCase();
  if (LGraphCanvas.node_colors?.[c]?.groupcolor) {
    c = LGraphCanvas.node_colors[c].groupcolor;
  }
  c = c.replace("#", "");
  if (c.length === 3) c = c.replace(/(.)(.)(.)/, "$1$1$2$2$3$3");
  return c ? `#${c}` : "";
}

function getGroupNodes(group) {
  if (!group) return [];
  if (typeof group.recomputeInsideNodes === "function") {
    try {
      group.recomputeInsideNodes();
    } catch (_) {}
  }
  if (group._children instanceof Set) {
    return Array.from(group._children).filter((n) => n instanceof LGraphNode);
  }
  return (group.nodes || []).filter((n) => n instanceof LGraphNode);
}

function getNodeModeState(nodes) {
  if (!nodes.length) return "disable";
  const allEnable = nodes.every((n) => n.mode === MODE_ENABLE);
  const allBypass = nodes.every((n) => n.mode === MODE_BYPASS);
  const allDisable = nodes.every((n) => n.mode === MODE_DISABLE);
  if (allEnable) return "enable";
  if (allBypass) return "bypass";
  if (allDisable) return "disable";
  return "mixed";
}

function getGraphs(showAllGraphs) {
  const current = app.canvas?.getCurrentGraph?.() || app.graph;
  if (!current) return [];
  if (!showAllGraphs) return [current];
  const graphs = [current];
  const subgraphs = current.subgraphs?.values?.();
  if (subgraphs) {
    let g;
    while ((g = subgraphs.next().value)) graphs.push(g);
  }
  return graphs;
}

function getGroupsFromNode(node) {
  const props = node.properties || {};
  const sort = props[PROPERTY_SORT] || "position";
  let groups = [];
  const graphs = getGraphs(props[PROPERTY_SHOW_ALL_GRAPHS] !== false);
  for (const graph of graphs) {
    groups.push(...(graph?._groups || []));
  }

  const matchColors = String(props[PROPERTY_MATCH_COLORS] || "")
    .split(",")
    .map((s) => normalizeHexColor(s))
    .filter(Boolean);

  const matchTitle = String(props[PROPERTY_MATCH_TITLE] || "").trim();
  let titleRegex = null;
  if (matchTitle) {
    try {
      titleRegex = new RegExp(matchTitle, "i");
    } catch (e) {
      titleRegex = null;
    }
  }

  groups = groups.filter((group) => {
    if (matchColors.length) {
      const gc = normalizeHexColor(group?.color || "");
      if (!gc || !matchColors.includes(gc)) return false;
    }
    if (titleRegex && !titleRegex.test(group?.title || "")) return false;
    return true;
  });

  if (sort === "alphanumeric") {
    groups.sort((a, b) => String(a?.title || "").localeCompare(String(b?.title || "")));
  } else if (sort === "custom alphabet") {
    const customAlphaStr = String(props[PROPERTY_SORT_CUSTOM_ALPHA] || "").replace(/\n/g, "").trim();
    const customAlphabet = customAlphaStr
      ? (customAlphaStr.includes(",")
          ? customAlphaStr.toLowerCase().split(",")
          : customAlphaStr.toLowerCase().split(""))
      : null;
    if (!customAlphabet?.length) {
      groups.sort((a, b) => String(a?.title || "").localeCompare(String(b?.title || "")));
    } else {
      groups.sort((a, b) => {
        const at = String(a?.title || "").toLowerCase();
        const bt = String(b?.title || "").toLowerCase();
        let aIndex = -1;
        let bIndex = -1;
        for (const [i, alpha] of customAlphabet.entries()) {
          if (aIndex < 0 && at.startsWith(alpha)) aIndex = i;
          if (bIndex < 0 && bt.startsWith(alpha)) bIndex = i;
          if (aIndex > -1 && bIndex > -1) break;
        }
        if (aIndex > -1 && bIndex > -1) {
          if (aIndex === bIndex) return at.localeCompare(bt);
          return aIndex - bIndex;
        }
        if (aIndex > -1) return -1;
        if (bIndex > -1) return 1;
        return at.localeCompare(bt);
      });
    }
  } else {
    groups.sort((a, b) => {
      const ay = Math.floor((a?._pos?.[1] || 0) / 30);
      const by = Math.floor((b?._pos?.[1] || 0) / 30);
      if (ay !== by) return ay - by;
      const ax = Math.floor((a?._pos?.[0] || 0) / 30);
      const bx = Math.floor((b?._pos?.[0] || 0) / 30);
      return ax - bx;
    });
  }

  return groups;
}

function setNodesMode(nodes, mode) {
  for (const node of nodes) {
    node.mode = mode;
  }
}

function getRows(node) {
  return (node.widgets || []).filter((w) => w?.__fgmGroupRow);
}

function applyState(node, targetRow, state) {
  const restriction = String(node?.properties?.[PROPERTY_RESTRICTION] || "default");
  const rows = getRows(node);
  const enableRows = rows.filter((r) => r.value === "enable");

  if (state === "enable" && restriction.includes("one")) {
    for (const row of rows) {
      if (row !== targetRow) {
        setNodesMode(getGroupNodes(row.__group), MODE_DISABLE);
        row.value = "disable";
      }
    }
  }

  if (state !== "enable" && restriction === "always one") {
    const onlyOneEnable = enableRows.length <= 1 && targetRow.value === "enable";
    if (onlyOneEnable) return;
  }

  const mode =
    state === "enable" ? MODE_ENABLE : state === "bypass" ? MODE_BYPASS : MODE_DISABLE;
  setNodesMode(getGroupNodes(targetRow.__group), mode);
  targetRow.value = state;
  targetRow.__state = state;

  app.graph?.setDirtyCanvas(true, true);
}

function drawCircle(ctx, x, y, r, color, active) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = active ? color : "#2a2a2a";
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.fill();
  ctx.stroke();
}

function fitLabel(ctx, label, maxWidth) {
  if (ctx.measureText(label).width <= maxWidth) return label;
  let s = label;
  while (s.length > 1 && ctx.measureText(`${s}…`).width > maxWidth) {
    s = s.slice(0, -1);
  }
  return `${s}…`;
}

function createGroupRowWidget(node, group) {
  const row = {
    type: "fgm_group_row",
    name: `Group ${group?.title || ""}`,
    options: { serialize: false },
    value: "mixed",
    __fgmGroupRow: true,
    __group: group,
    __state: "mixed",
    __hitAreas: null,
    computeSize(width) {
      return [Math.max(240, width - 20), 24];
    },
    draw(ctx, _node, width, y, h) {
      const margin = 10;
      const centerY = y + h * 0.5;
      const r = 5;
      const spacing = 18;
      let x = width - 26;

      const showNav = node?.properties?.[PROPERTY_SHOW_NAV] !== false;
      const navHit = showNav ? { x: x - 8, y: centerY - 6, w: 12, h: 12 } : null;

      if (showNav) {
        ctx.fillStyle = "#8aa2cc";
        ctx.beginPath();
        ctx.moveTo(x - 6, centerY - 5);
        ctx.lineTo(x + 2, centerY);
        ctx.lineTo(x - 6, centerY + 5);
        ctx.closePath();
        ctx.fill();
        x -= 18;
      }

      const disableX = x;
      const bypassX = x - spacing;
      const enableX = x - spacing * 2;
      drawCircle(ctx, enableX, centerY, r, "#53d26a", row.__state === "enable");
      drawCircle(ctx, bypassX, centerY, r, "#f1c24d", row.__state === "bypass");
      drawCircle(ctx, disableX, centerY, r, "#cf5e5e", row.__state === "disable");

      const label = String(group?.title || "(untitled group)");
      const maxWidth = Math.max(50, enableX - margin - 8);
      ctx.fillStyle = "#ddd";
      ctx.font = "12px Arial";
      ctx.textAlign = "left";
      ctx.fillText(fitLabel(ctx, label, maxWidth), margin, y + h * 0.68);

      row.__hitAreas = {
        enable: { x: enableX - r - 2, y: centerY - r - 2, w: r * 2 + 4, h: r * 2 + 4 },
        bypass: { x: bypassX - r - 2, y: centerY - r - 2, w: r * 2 + 4, h: r * 2 + 4 },
        disable: { x: disableX - r - 2, y: centerY - r - 2, w: r * 2 + 4, h: r * 2 + 4 },
        nav: navHit,
      };
    },
    mouse(event, pos) {
      if (event.type !== "pointerdown" && event.type !== "mousedown") return false;
      const hit = row.__hitAreas;
      if (!hit) return false;

      const inside = (rect) =>
        !!rect && pos[0] >= rect.x && pos[0] <= rect.x + rect.w && pos[1] >= rect.y && pos[1] <= rect.y + rect.h;

      if (inside(hit.enable)) {
        applyState(node, row, "enable");
        return true;
      }
      if (inside(hit.bypass)) {
        applyState(node, row, "bypass");
        return true;
      }
      if (inside(hit.disable)) {
        applyState(node, row, "disable");
        return true;
      }
      if (inside(hit.nav) && node?.properties?.[PROPERTY_SHOW_NAV] !== false) {
        const canvas = app.canvas;
        if (canvas && row.__group) {
          canvas.centerOnNode(row.__group);
          canvas.setDirty(true, true);
        }
        return true;
      }
      return false;
    },
  };

  return row;
}

function ensureProperties(node) {
  node.properties = node.properties || {};
  const defaults = {
    [PROPERTY_MATCH_COLORS]: "",
    [PROPERTY_MATCH_TITLE]: "",
    [PROPERTY_SHOW_NAV]: true,
    [PROPERTY_SHOW_ALL_GRAPHS]: true,
    [PROPERTY_SORT]: "position",
    [PROPERTY_SORT_CUSTOM_ALPHA]: "",
    [PROPERTY_RESTRICTION]: "default",
  };
  for (const [k, v] of Object.entries(defaults)) {
    if (node.properties[k] == null) node.properties[k] = v;
  }

  if (!node.__fgmPropertiesAdded && typeof node.addProperty === "function") {
    node.__fgmPropertiesAdded = true;
    try {
      node.addProperty(PROPERTY_MATCH_COLORS, node.properties[PROPERTY_MATCH_COLORS], "string");
      node.addProperty(PROPERTY_MATCH_TITLE, node.properties[PROPERTY_MATCH_TITLE], "string");
      node.addProperty(PROPERTY_SHOW_NAV, node.properties[PROPERTY_SHOW_NAV], "boolean");
      node.addProperty(PROPERTY_SHOW_ALL_GRAPHS, node.properties[PROPERTY_SHOW_ALL_GRAPHS], "boolean");
      node.addProperty(PROPERTY_SORT, node.properties[PROPERTY_SORT], "string");
      node.addProperty(
        PROPERTY_SORT_CUSTOM_ALPHA,
        node.properties[PROPERTY_SORT_CUSTOM_ALPHA],
        "string",
      );
      node.addProperty(PROPERTY_RESTRICTION, node.properties[PROPERTY_RESTRICTION], "string");
    } catch (_) {}
  }
}

function setBatchState(node, state) {
  const rows = getRows(node);
  if (!rows.length) return;
  if (state === "enable") {
    const restriction = String(node?.properties?.[PROPERTY_RESTRICTION] || "default");
    if (restriction.includes("one")) {
      applyState(node, rows[0], "enable");
      return;
    }
  }
  for (const row of rows) applyState(node, row, state);
}

function refreshGroupWidgets(node) {
  if (!node || node.type !== TARGET_NODE_NAME) return;
  ensureProperties(node);

  const groups = getGroupsFromNode(node);
  const currentRows = getRows(node);
  const existingMap = new Map(currentRows.map((w) => [w.__group, w]));

  // 移除不再存在的行
  for (let i = node.widgets.length - 1; i >= 0; i--) {
    const w = node.widgets[i];
    if (w?.__fgmGroupRow && !groups.includes(w.__group)) {
      node.widgets.splice(i, 1);
    }
  }

  // 追加/重排
  const fixedWidgets = (node.widgets || []).filter((w) => !w?.__fgmGroupRow);
  const groupWidgets = [];
  for (const group of groups) {
    let row = existingMap.get(group);
    if (!row) {
      row = createGroupRowWidget(node, group);
    }
    row.value = getNodeModeState(getGroupNodes(group));
    row.__state = row.value;
    groupWidgets.push(row);
  }
  node.widgets = [...fixedWidgets, ...groupWidgets];
  node.setDirtyCanvas?.(true, true);
}

function injectNodeUI(node) {
  if (!node || node.__fgmInjected) return;
  node.__fgmInjected = true;
  ensureProperties(node);

  if (!Array.isArray(node.outputs) || !node.outputs.length) {
    node.addOutput?.("OPT_CONNECTION", "*");
  }

  node.addWidget?.("button", "Enable All", null, () => setBatchState(node, "enable"));
  node.addWidget?.("button", "Bypass All", null, () => setBatchState(node, "bypass"));
  node.addWidget?.("button", "Disable All", null, () => setBatchState(node, "disable"));
  node.addWidget?.("button", "Refresh Groups", null, () => refreshGroupWidgets(node));

  refreshGroupWidgets(node);
}

function autoRefreshManagers() {
  const graph = app.graph;
  if (!graph?._nodes?.length) return;
  for (const node of graph._nodes) {
    if (node?.type !== TARGET_NODE_NAME) continue;
    injectNodeUI(node);
    refreshGroupWidgets(node);
  }
}

app.registerExtension({
  name: EXTENSION_NAME,
  async beforeRegisterNodeDef(nodeType, nodeData) {
    if (nodeData?.name !== TARGET_NODE_NAME) return;
    const onNodeCreated = nodeType.prototype.onNodeCreated;
    nodeType.prototype.onNodeCreated = function onNodeCreatedPatched(...args) {
      const result = onNodeCreated?.apply(this, args);
      try {
        injectNodeUI(this);
      } catch (error) {
        console.error(`[${EXTENSION_NAME}] inject ui failed`, error);
      }
      return result;
    };
  },
  async setup() {
    setInterval(autoRefreshManagers, 500);
    console.log(`[${EXTENSION_NAME}] loaded`);
  },
});
