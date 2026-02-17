import { ControlEventType } from './types.js';
import { EventBus } from './EventBus.js';
import { PerformanceMonitor } from './PerformanceMonitor.js';
/**
 * 图层管理器
 */
export class LayerManager {
    layers = new Map();
    eventBus;
    performanceMonitor;
    nextZIndex = 0;
    constructor() {
        this.eventBus = new EventBus();
        this.performanceMonitor = new PerformanceMonitor();
    }
    /**
     * 添加图层
     */
    addLayer(layer, name, zIndex) {
        const startTime = performance.now();
        const layerId = name || layer.id;
        const item = {
            layer,
            name: layerId,
            visible: layer.isVisible(),
            zIndex: zIndex ?? this.nextZIndex++,
        };
        this.layers.set(layerId, item);
        this.eventBus.emit(ControlEventType.LAYER_CHANGE, {
            action: 'add',
            layerId,
            item,
        });
        const endTime = performance.now();
        this.performanceMonitor.record('layer:add', endTime - startTime);
        return layerId;
    }
    /**
     * 移除图层
     */
    removeLayer(layerId) {
        const startTime = performance.now();
        const item = this.layers.get(layerId);
        if (!item) {
            return false;
        }
        this.layers.delete(layerId);
        this.eventBus.emit(ControlEventType.LAYER_CHANGE, {
            action: 'remove',
            layerId,
            item,
        });
        const endTime = performance.now();
        this.performanceMonitor.record('layer:remove', endTime - startTime);
        return true;
    }
    /**
     * 根据图层对象移除
     */
    removeLayerByObject(layer) {
        for (const [id, item] of this.layers.entries()) {
            if (item.layer === layer) {
                return this.removeLayer(id);
            }
        }
        return false;
    }
    /**
     * 获取图层
     */
    getLayer(layerId) {
        return this.layers.get(layerId);
    }
    /**
     * 获取所有图层
     */
    getAllLayers() {
        return Array.from(this.layers.values()).sort((a, b) => a.zIndex - b.zIndex);
    }
    /**
     * 获取可见图层
     */
    getVisibleLayers() {
        return this.getAllLayers().filter((item) => item.visible);
    }
    /**
     * 设置图层可见性
     */
    setLayerVisibility(layerId, visible) {
        const startTime = performance.now();
        const item = this.layers.get(layerId);
        if (!item) {
            return false;
        }
        if (item.visible === visible) {
            return true;
        }
        item.visible = visible;
        // 更新图层可见性
        if (visible) {
            item.layer.show();
        }
        else {
            item.layer.hide();
        }
        this.eventBus.emit(ControlEventType.LAYER_VISIBILITY_CHANGE, {
            layerId,
            visible,
        });
        const endTime = performance.now();
        this.performanceMonitor.record('layer:setVisibility', endTime - startTime);
        return true;
    }
    /**
     * 切换图层可见性
     */
    toggleLayerVisibility(layerId) {
        const item = this.layers.get(layerId);
        if (!item) {
            return false;
        }
        return this.setLayerVisibility(layerId, !item.visible);
    }
    /**
     * 设置图层顺序
     */
    setLayerOrder(layerId, zIndex) {
        const startTime = performance.now();
        const item = this.layers.get(layerId);
        if (!item) {
            return false;
        }
        if (item.zIndex === zIndex) {
            return true;
        }
        const oldZIndex = item.zIndex;
        item.zIndex = zIndex;
        // 更新图层优先级
        item.layer.setPriority(zIndex);
        this.eventBus.emit(ControlEventType.LAYER_ORDER_CHANGE, {
            layerId,
            oldZIndex,
            newZIndex: zIndex,
        });
        const endTime = performance.now();
        this.performanceMonitor.record('layer:setOrder', endTime - startTime);
        return true;
    }
    /**
     * 上移图层
     */
    moveLayerUp(layerId) {
        const item = this.layers.get(layerId);
        if (!item) {
            return false;
        }
        // 找到当前图层的上方图层
        const layers = this.getAllLayers();
        const currentIndex = layers.findIndex((l) => l.name === layerId);
        if (currentIndex >= layers.length - 1) {
            return false; // 已经是最上层
        }
        const aboveLayer = layers[currentIndex + 1];
        return this.setLayerOrder(layerId, aboveLayer.zIndex + 1);
    }
    /**
     * 下移图层
     */
    moveLayerDown(layerId) {
        const item = this.layers.get(layerId);
        if (!item) {
            return false;
        }
        // 找到当前图层的下方图层
        const layers = this.getAllLayers();
        const currentIndex = layers.findIndex((l) => l.name === layerId);
        if (currentIndex <= 0) {
            return false; // 已经是最下层
        }
        const belowLayer = layers[currentIndex - 1];
        return this.setLayerOrder(layerId, belowLayer.zIndex - 1);
    }
    /**
     * 将图层移至顶部
     */
    moveLayerToTop(layerId) {
        const layers = this.getAllLayers();
        if (layers.length === 0) {
            return false;
        }
        const maxZIndex = Math.max(...layers.map((l) => l.zIndex));
        return this.setLayerOrder(layerId, maxZIndex + 1);
    }
    /**
     * 将图层移至底部
     */
    moveLayerToBottom(layerId) {
        const layers = this.getAllLayers();
        if (layers.length === 0) {
            return false;
        }
        const minZIndex = Math.min(...layers.map((l) => l.zIndex));
        return this.setLayerOrder(layerId, minZIndex - 1);
    }
    /**
     * 重命名图层
     */
    renameLayer(oldName, newName) {
        const startTime = performance.now();
        const item = this.layers.get(oldName);
        if (!item) {
            return false;
        }
        if (this.layers.has(newName)) {
            return false; // 新名称已存在
        }
        this.layers.delete(oldName);
        item.name = newName;
        this.layers.set(newName, item);
        this.eventBus.emit(ControlEventType.LAYER_CHANGE, {
            action: 'rename',
            oldName,
            newName,
        });
        const endTime = performance.now();
        this.performanceMonitor.record('layer:rename', endTime - startTime);
        return true;
    }
    /**
     * 清空所有图层
     */
    clear() {
        const startTime = performance.now();
        const layerIds = Array.from(this.layers.keys());
        this.layers.clear();
        this.eventBus.emit(ControlEventType.LAYER_CHANGE, {
            action: 'clear',
            layerIds,
        });
        const endTime = performance.now();
        this.performanceMonitor.record('layer:clear', endTime - startTime);
    }
    /**
     * 获取图层数量
     */
    getLayerCount() {
        return this.layers.size;
    }
    /**
     * 订阅事件
     */
    on(eventType, listener) {
        return this.eventBus.on(eventType, listener);
    }
    /**
     * 取消订阅
     */
    off(eventType, listener) {
        this.eventBus.off(eventType, listener);
    }
    /**
     * 获取性能监控器
     */
    getPerformanceMonitor() {
        return this.performanceMonitor;
    }
    /**
     * 销毁管理器
     */
    dispose() {
        this.layers.clear();
        this.eventBus.clear();
        this.performanceMonitor.clear();
    }
}
//# sourceMappingURL=LayerManager.js.map