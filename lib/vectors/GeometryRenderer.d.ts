type WebGL2RenderingContext = any;
import { IGeometry, IVectorStyle, IRenderStats } from '../vectortypes.js';
/**
 * 几何渲染器
 */
export declare class GeometryRenderer {
    private gl;
    private pointProgram;
    private lineProgram;
    private polygonProgram;
    private resolution;
    constructor(gl: WebGL2RenderingContext);
    /**
     * 初始化着色器程序
     */
    private initPrograms;
    /**
     * 创建着色器程序
     */
    private createProgram;
    /**
     * 渲染几何
     */
    render(geometries: IGeometry[], style: IVectorStyle, zoom?: number): IRenderStats;
    /**
     * 渲染点
     */
    private renderPoint;
    /**
     * 渲染线
     */
    private renderLine;
    /**
     * 渲染面
     */
    private renderPolygon;
    /**
     * 提取点坐标
     */
    private extractPointCoordinates;
    /**
     * 提取线坐标
     */
    private extractLineCoordinates;
    /**
     * 提取面坐标
     */
    private extractPolygonCoordinates;
    /**
     * 三角化多边形（简化版）
     */
    private triangulate;
    /**
     * 获取颜色
     */
    private getColor;
    /**
     * 设置分辨率
     */
    setResolution(width: number, height: number): void;
    /**
     * 销毁
     */
    dispose(): void;
}
export {};
//# sourceMappingURL=GeometryRenderer.d.ts.map