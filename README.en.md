# ComfyUI Workflow State Presets

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](./LICENSE)

A plugin for **fast workflow switching in ComfyUI**.  
The goal is to quickly switch between different workflow presets in a single workflow using an `int` index. It prioritizes node **bypass (enable/ignore)** state switching first, and can be gradually extended to parameter snapshots and link switching.

## 🌐 Language

- [中文](./README.zh-CN.md)
- [English](./README.en.md)

## Project Status

- Current stage: **Phase 1 implemented** (record/apply bypass presets + auto-apply by index)

## Features

1. New node: `Preset Switch`
   - Input: `preset_index: INT`
   - Output: `preset_index: INT` (pass-through)

2. Node buttons (on `Preset Switch`)
   - `Record Current`: Record all nodes’ bypass/mode state to current index
   - `Apply Current`: Apply preset at current index
   - `Prev Preset` / `Next Preset`: Cycle through recorded preset indexes and apply

3. Auto switching
   - Preset is automatically applied when `preset_index` changes

4. Persistence
   - Presets are stored in `workflow.graph.extra.comfyui_workflow_state_presets` and saved with the workflow

## Installation

1. Clone/copy this repository into ComfyUI `custom_nodes` directory:

   ```bash
   cd /path/to/ComfyUI/custom_nodes
   git clone <your-repo-url> comfyui_workflow_state_presets
   ```

2. Restart ComfyUI.
3. Search and add nodes: `Preset Switch` / `Preset Group Editor`.

> Windows example: `ComfyUI\\custom_nodes\\comfyui_workflow_state_presets`

## Quick Start

1. Add `Preset Switch` node to your workflow.
2. Manually set bypass states for workflow nodes.
3. Set `preset_index` (e.g. `0`) and click `Record Current`.
4. Change node states for another setup, set `preset_index=1`, click `Record Current` again.
5. During runtime, change `preset_index` to switch presets quickly.

## Repository Structure

```text
comfyui_workflow_state_presets/
├─ README.md
├─ README.zh-CN.md
├─ README.en.md
├─ LICENSE
├─ CHANGELOG.md
├─ __init__.py
├─ nodes.py
├─ docs/
│  ├─ 开发文档.md
│  └─ 需求简述.ini
└─ web/
   ├─ preset_switch.js
   ├─ preset_group_editor.js
   └─ style.css
```

## Compatibility

- Depends on ComfyUI frontend extension API (`/scripts/app.js`).
- A recent ComfyUI version is recommended. If API changes break compatibility, please include your ComfyUI version in issues.

## Known Limitations

- Current version only switches bypass/mode.
- Presets are restored by node id; missing nodes are skipped with console warnings.

## License

Licensed under **GNU General Public License v3.0** (GPL-3.0). See [LICENSE](./LICENSE).
