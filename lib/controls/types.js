/**
 * 查询类型
 */
export var QueryType;
(function (QueryType) {
    /** 点击拾取 */
    QueryType["CLICK"] = "click";
    /** 框选查询 */
    QueryType["BOX"] = "box";
})(QueryType || (QueryType = {}));
/**
 * 控件事件类型
 */
export var ControlEventType;
(function (ControlEventType) {
    /** 导航改变 */
    ControlEventType["NAVIGATION_CHANGE"] = "navigation_change";
    /** 查询结果 */
    ControlEventType["QUERY_RESULT"] = "query_result";
    /** 图层变更 */
    ControlEventType["LAYER_CHANGE"] = "layer_change";
    /** 图层可见性改变 */
    ControlEventType["LAYER_VISIBILITY_CHANGE"] = "layer_visibility_change";
    /** 图层顺序改变 */
    ControlEventType["LAYER_ORDER_CHANGE"] = "layer_order_change";
})(ControlEventType || (ControlEventType = {}));
//# sourceMappingURL=types.js.map