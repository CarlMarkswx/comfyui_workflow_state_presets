class PresetSwitch:
    """
    Phase 1 骨架节点：提供 preset_index 输入。
    后续由前端扩展监听该值变化并应用 preset。
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "preset_index": (
                    "INT",
                    {
                        "default": 0,
                        "min": 0,
                        "max": 999999,
                        "step": 1,
                    },
                )
            }
        }

    RETURN_TYPES = ("INT",)
    RETURN_NAMES = ("preset_index",)
    FUNCTION = "run"
    CATEGORY = "workflow/preset"

    def run(self, preset_index):
        return (int(preset_index),)


class PresetGroupEditor:
    """
    Preset Group Editor:
    统一管理工作流分组（Group）节点状态，提供三态切换：
    - 启用（ALWAYS）
    - 跳过（BYPASS / mode=4）
    - 禁用（NEVER）

    该节点主要由前端扩展提供交互能力，后端仅作为节点定义入口。
    """

    @classmethod
    def INPUT_TYPES(cls):
        return {"required": {}}

    RETURN_TYPES = ()
    RETURN_NAMES = ()
    FUNCTION = "run"
    CATEGORY = "workflow/preset"

    def run(self):
        return tuple()


NODE_CLASS_MAPPINGS = {
    "PresetSwitch": PresetSwitch,
    "PresetGroupEditor": PresetGroupEditor,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "PresetSwitch": "Preset Switch",
    "PresetGroupEditor": "Preset Group Editor",
}
