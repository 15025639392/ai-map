import { IFeature, IPickResult, Coordinate } from '../vectortypes.js';
/**
 * 拾取配置
 */
export interface IPickingConfig {
    /** 点拾取半径（像素） */
    pointRadius?: number;
    /** 线拾取半径（像素） */
    lineRadius?: number;
    /** 面拾取半径（像素） */
    polygonRadius?: number;
}
/**
 * 拾取管理器
 */
export declare class PickingManager {
    private features;
    private spatialIndex;
    private config;
    constructor(config?: IPickingConfig);
    /**
     * 添加要素
     */
    addFeatures(features: IFeature[]): void;
    /**
     * 清空要素
     */
    clear(): void;
    /**
     * 构建空间索引（使用R-Tree的简化版本）
     */
    private buildSpatialIndex;
    /**
     * 构建网格索引
     */
    private buildGridIndex;
    /**
     * 获取要素边界
     */
    private getFeatureBounds;
    /**
     * 获取几何边界
     */
    private getGeometryBounds;
    /**
     * 查询节点
     */
    private queryNode;
    /**
     * 拾取要素
     */
    pick(screenPosition: Coordinate, projection?: (coord: Coordinate) => Coordinate): IPickResult[];
    /**
     * 计算距离
     */
    private calculateDistance;
    /**
     * 获取拾取半径
     */
    private getPickRadius;
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
        totalFeatures: number;
        spatialIndexBuilt: boolean;
    };
    /**
     * 销毁
     */
    dispose(): void;
}
//# sourceMappingURL=PickingManager.d.ts.map