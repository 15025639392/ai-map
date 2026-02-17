/**
 * 瓦片加载状态
 */
export var TileState;
(function (TileState) {
    /** 等待中 */
    TileState["PENDING"] = "pending";
    /** 加载中 */
    TileState["LOADING"] = "loading";
    /** 已加载 */
    TileState["LOADED"] = "loaded";
    /** 加载失败 */
    TileState["FAILED"] = "failed";
    /** 已取消 */
    TileState["CANCELLED"] = "cancelled";
})(TileState || (TileState = {}));
//# sourceMappingURL=types.js.map