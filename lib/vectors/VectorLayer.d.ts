import { Layer } from '../renderer/Layer.js';
import type { IRenderer, ILayerOptions } from '../renderer/types.js';
import { PickingManager } from './PickingManager.js';
import { GeoJSONData, MVTData, IFeature, IVectorStyle, IPickResult, IRenderStats, Coordinate } from '../vectortypes.js';
/**
 * 矢量图层选项
 */
export interface IVectorLayerOptions extends ILayerOptions {
    /** 数据源类型 */
    dataSourceType?: 'geojson' | 'mvt';
    /** GeoJSON数据 */
    geojsonData?: GeoJSONData;
    /** MVT数据 */
    mvtData?: MVTData;
    /** MVT图层名称 */
    mvtLayerName?: string;
    /** 渲染样式 */
    style?: IVectorStyle;
    /** 拾取配置 */
    pickingConfig?: {
        pointRadius?: number;
        lineRadius?: number;
        polygonRadius?: number;
    };
    /** 缩放级别 */
    zoom?: number;
}
/**
 * 矢量图层类
 */
export declare class VectorLayer extends Layer {
    private _features;
    private _geometryRenderer;
    private _pickingManager;
    private _style;
    private _zoom;
    private _dataSourceType;
    constructor(options?: IVectorLayerOptions);
    /**
     * 加载 GeoJSON 数据
     */
    loadGeoJSON(geojson: GeoJSONData): void;
    /**
     * 加载 MVT 数据
     */
    loadMVT(mvtData: MVTData, layerName?: string): void;
    /**
     * 设置样式
     */
    setStyle(style: IVectorStyle): void;
    /**
     * 获取样式
     */
    getStyle(): IVectorStyle;
    /**
     * 设置缩放级别
     */
    setZoom(zoom: number): void;
    /**
     * 获取缩放级别
     */
    getZoom(): number;
    /**
     * 获取要素
     */
    getFeatures(): IFeature[];
    /**
     * 根据ID获取要素
     */
    getFeatureById(id: string | number): IFeature | undefined;
    /**
     * 拾取要素
     */
    pick(screenPosition: Coordinate, projection?: (coord: Coordinate) => Coordinate): IPickResult[];
    /**
     * 获取渲染统计
     */
    getRenderStats(): IRenderStats;
    /**
     * 触发更新
     */
    private _triggerUpdate;
    /**
     * 渲染图层
     */
    render(renderer: IRenderer): void;
    /**
     * 添加到渲染器时初始化
     */
    protected _onAdd(renderer: IRenderer): void;
    /**
     * 从渲染器移除时清理
     */
    protected _onRemove(): void;
    /**
     * 销毁图层
     */
    dispose(): void;
    /**
     * 获取数据源类型
     */
    getDataSourceType(): 'geojson' | 'mvt';
    /**
     * 获取拾取管理器
     */
    getPickingManager(): PickingManager | null;
    /**
     * 测试拾取准确率
     */
    testAccuracy(testCases: Array<{
        feature: IFeature;
        point: Coordinate;
        expectedPick: boolean;
    }>): {
        total: number;
        correct: number;
        accuracy: number;
    };
    /**
     * 获取统计信息
     */
    getStats(): {
        dataSourceType: "geojson" | "mvt";
        zoom: number;
        pickingManager: {
            totalFeatures: number;
            spatialIndexBuilt: boolean;
        } | null;
        featuresRendered: number;
        pointsRendered: number;
        linesRendered: number;
        polygonsRendered: number;
    };
}
//# sourceMappingURL=VectorLayer.d.ts.map