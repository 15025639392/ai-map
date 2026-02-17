import { GeoJSONData, IFeature, IGeometry, Coordinate } from '../vectortypes.js';
/**
 * GeoJSON 解析器
 */
export declare class GeoJSONParser {
    /**
     * 解析 GeoJSON 数据
     */
    static parse(geojson: GeoJSONData): IFeature[];
    /**
     * 解析 Feature
     */
    private static parseFeature;
    /**
     * 解析 Geometry
     */
    private static parseGeometry;
    /**
     * 解析坐标
     */
    private static parseCoordinates;
    /**
     * 解析坐标数组
     */
    private static parseCoordinatesArray;
    /**
     * 解析线坐标
     */
    private static parseLineCoordinates;
    /**
     * 解析线坐标数组
     */
    private static parseLineCoordinatesArray;
    /**
     * 解析面坐标
     */
    private static parsePolygonCoordinates;
    /**
     * 解析面坐标数组
     */
    private static parsePolygonCoordinatesArray;
    /**
     * 计算 geometry 的边界框
     */
    static getBounds(geometry: IGeometry): [Coordinate, Coordinate];
    /**
     * 计算要素的边界框
     */
    static getFeatureBounds(feature: IFeature): [Coordinate, Coordinate];
}
//# sourceMappingURL=GeoJSONParser.d.ts.map