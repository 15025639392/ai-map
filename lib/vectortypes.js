/**
 * 几何类型枚举
 */
export var GeometryType;
(function (GeometryType) {
    /** 点 */
    GeometryType["POINT"] = "point";
    /** 线 */
    GeometryType["LINE"] = "line";
    /** 面 */
    GeometryType["POLYGON"] = "polygon";
    /** 多点 */
    GeometryType["MULTI_POINT"] = "multi_point";
    /** 多线 */
    GeometryType["MULTI_LINE"] = "multi_line";
    /** 多面 */
    GeometryType["MULTI_POLYGON"] = "multi_polygon";
})(GeometryType || (GeometryType = {}));
//# sourceMappingURL=vectortypes.js.map