/**
 * 编辑工具类型
 */
export var EditToolType;
(function (EditToolType) {
    /** 无工具 */
    EditToolType["NONE"] = "none";
    /** 点绘制 */
    EditToolType["DRAW_POINT"] = "draw_point";
    /** 线绘制 */
    EditToolType["DRAW_LINE"] = "draw_line";
    /** 面绘制 */
    EditToolType["DRAW_POLYGON"] = "draw_polygon";
    /** 选择工具 */
    EditToolType["SELECT"] = "select";
    /** 移动工具 */
    EditToolType["MOVE"] = "move";
    /** 顶点编辑 */
    EditToolType["EDIT_VERTEX"] = "edit_vertex";
})(EditToolType || (EditToolType = {}));
/**
 * 编辑状态
 */
export var EditState;
(function (EditState) {
    /** 空闲 */
    EditState["IDLE"] = "idle";
    /** 绘制中 */
    EditState["DRAWING"] = "drawing";
    /** 选择中 */
    EditState["SELECTING"] = "selecting";
    /** 移动中 */
    EditState["MOVING"] = "moving";
    /** 编辑顶点中 */
    EditState["EDITING_VERTEX"] = "editing_vertex";
})(EditState || (EditState = {}));
/**
 * 编辑事件类型
 */
export var EditEventType;
(function (EditEventType) {
    /** 工具改变 */
    EditEventType["TOOL_CHANGE"] = "tool_change";
    /** 状态改变 */
    EditEventType["STATE_CHANGE"] = "state_change";
    /** 要素添加 */
    EditEventType["FEATURE_ADD"] = "feature_add";
    /** 要素修改 */
    EditEventType["FEATURE_MODIFY"] = "feature_modify";
    /** 要素删除 */
    EditEventType["FEATURE_DELETE"] = "feature_delete";
    /** 撤销 */
    EditEventType["UNDO"] = "undo";
    /** 重做 */
    EditEventType["REDO"] = "redo";
    /** 操作执行 */
    EditEventType["COMMAND_EXECUTE"] = "command_execute";
})(EditEventType || (EditEventType = {}));
//# sourceMappingURL=types.js.map