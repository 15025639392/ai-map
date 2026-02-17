import { IQueryResult, QueryType, ControlEventType } from './types.js';
import { PerformanceMonitor } from './PerformanceMonitor.js';
import type { Coordinate } from '../vectortypes.js';
import type { Layer } from '../renderer/Layer.js';
/**
 * 查询控件
 */
export declare class QueryControl {
    private layers;
    private eventBus;
    private performanceMonitor;
    private activeQueryType;
    private selectionBox;
    constructor();
    /**
     * 添加图层
     */
    addLayer(layer: Layer): void;
    /**
     * 移除图层
     */
    removeLayer(layer: Layer): void;
    /**
     * 清空所有图层
     */
    clearLayers(): void;
    /**
     * 点击拾取
     */
    pick(screenPosition: Coordinate): Promise<IQueryResult>;
    /**
     * 框选查询
     */
    boxQuery(box: [Coordinate, Coordinate]): Promise<IQueryResult>;
    /**
     * 判断要素是否在框选范围内
     */
    private isFeatureInBox;
    /**
     * 根据ID查询要素
     */
    queryById(id: string | number): Promise<IQueryResult>;
    /**
     * 属性查询
     */
    queryByProperty(propertyName: string, propertyValue: any): Promise<IQueryResult>;
    /**
     * 设置激活的查询类型
     */
    setActiveQueryType(type: QueryType | null): void;
    /**
     * 获取激活的查询类型
     */
    getActiveQueryType(): QueryType | null;
    /**
     * 设置选择框
     */
    setSelectionBox(box: [Coordinate, Coordinate] | null): void;
    /**
     * 获取选择框
     */
    getSelectionBox(): [Coordinate, Coordinate] | null;
    /**
     * 订阅事件
     */
    on(eventType: ControlEventType, listener: any): () => void;
    /**
     * 取消订阅
     */
    off(eventType: ControlEventType, listener: any): void;
    /**
     * 获取性能监控器
     */
    getPerformanceMonitor(): PerformanceMonitor;
    /**
     * 销毁控件
     */
    dispose(): void;
}
//# sourceMappingURL=QueryControl.d.ts.map