# Changelog

All notable changes to this project will be documented in this file.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-02-26

### Added
- Initial release of `Preset Switch` node.
- Phase 1 preset workflow:
  - Record current node bypass/mode states into indexed presets.
  - Apply preset by `preset_index`.
  - `Prev Preset` / `Next Preset` cycling.
  - Auto-apply when `preset_index` changes.
- Preset persistence in workflow metadata:
  - `workflow.graph.extra.comfyui_workflow_state_presets`
- Bilingual documentation setup:
  - `README.zh-CN.md`
  - `README.en.md`
  - Root `README.md` as language switch entry.
- Repository publication essentials:
  - `LICENSE` (GPL-3.0)
  - `.gitignore`

## [0.2.0] - 2026-02-27

### Changed
- Unified plugin naming to **ComfyUI Workflow State Presets**.
- Fully renamed node type identifiers:
  - `WorkflowPresetSwitch` -> `PresetSwitch`
  - `FastGroupManager` -> `PresetGroupEditor`
- Fully renamed frontend files:
  - `web/workflow_preset_switch.js` -> `web/preset_switch.js`
  - `web/fast_group_manager.js` -> `web/preset_group_editor.js`
- Renamed frontend extension identifiers:
  - `comfyui.workflow_preset_switch` -> `comfyui.preset_switch`
  - `comfyui.fast_group_manager` -> `comfyui.preset_group_editor`
