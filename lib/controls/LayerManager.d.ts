import { ILayerItem, ControlEventType } from './types.js';
import { PerformanceMonitor } from './PerformanceMonitor.js';
import type { Layer } from '../renderer/Layer.js';
/**
 * 图层管理器
 */
export declare class LayerManager {
    private layers;
    private eventBus;
    private performanceMonitor;
    private nextZIndex;
    constructor();
    /**
     * 添加图层
     */
    addLayer(layer: Layer, name?: string, zIndex?: number): string;
    /**
     * 移除图层
     */
    removeLayer(layerId: string): boolean;
    /**
     * 根据图层对象移除
     */
    removeLayerByObject(layer: Layer): boolean;
    /**
     * 获取图层
     */
    getLayer(layerId: string): ILayerItem | undefined;
    /**
     * 获取所有图层
     */
    getAllLayers(): ILayerItem[];
    /**
     * 获取可见图层
     */
    getVisibleLayers(): ILayerItem[];
    /**
     * 设置图层可见性
     */
    setLayerVisibility(layerId: string, visible: boolean): boolean;
    /**
     * 切换图层可见性
     */
    toggleLayerVisibility(layerId: string): boolean;
    /**
     * 设置图层顺序
     */
    setLayerOrder(layerId: string, zIndex: number): boolean;
    /**
     * 上移图层
     */
    moveLayerUp(layerId: string): boolean;
    /**
     * 下移图层
     */
    moveLayerDown(layerId: string): boolean;
    /**
     * 将图层移至顶部
     */
    moveLayerToTop(layerId: string): boolean;
    /**
     * 将图层移至底部
     */
    moveLayerToBottom(layerId: string): boolean;
    /**
     * 重命名图层
     */
    renameLayer(oldName: string, newName: string): boolean;
    /**
     * 清空所有图层
     */
    clear(): void;
    /**
     * 获取图层数量
     */
    getLayerCount(): number;
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
     * 销毁管理器
     */
    dispose(): void;
}
//# sourceMappingURL=LayerManager.d.ts.map