/**
 * 图层状态
 */
export var LayerState;
(function (LayerState) {
    /** 已初始化但未添加 */
    LayerState["INITIALIZED"] = "initialized";
    /** 已添加到渲染器 */
    LayerState["ADDED"] = "added";
    /** 已显示 */
    LayerState["SHOWN"] = "shown";
    /** 已隐藏 */
    LayerState["HIDDEN"] = "hidden";
    /** 已移除 */
    LayerState["REMOVED"] = "removed";
    /** 已销毁 */
    LayerState["DISPOSED"] = "disposed";
})(LayerState || (LayerState = {}));
//# sourceMappingURL=types.js.map