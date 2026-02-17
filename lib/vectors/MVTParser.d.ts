import { MVTData, IFeature } from '../vectortypes.js';
/**
 * MVT 解析器
 */
export declare class MVTParser {
    /**
     * 解析 MVT 瓦片数据
     * 注意：这是简化版实现，实际应用中应使用完整的协议缓冲区解析
     */
    static parse(mvtData: MVTData, layerName?: string): IFeature[];
    /**
     * 解析 MVT 几何数据
     */
    private static parseGeometry;
    /**
     * 解析点几何
     */
    private static parsePointGeometry;
    /**
     * 解析线几何
     */
    private static parseLineGeometry;
    /**
     * 解析面几何
     */
    private static parsePolygonGeometry;
    /**
     * Zigzag 解码
     */
    private static zigzagDecode;
}
//# sourceMappingURL=MVTParser.d.ts.map