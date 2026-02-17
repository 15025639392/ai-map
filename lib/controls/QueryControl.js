import { ControlEventType, } from './types.js';
import { EventBus } from './EventBus.js';
import { PerformanceMonitor } from './PerformanceMonitor.js';
/**
 * 查询控件
 */
export class QueryControl {
    layers = [];
    eventBus;
    performanceMonitor;
    activeQueryType = null;
    selectionBox = null;
    constructor() {
        this.eventBus = new EventBus();
        this.performanceMonitor = new PerformanceMonitor();
    }
    /**
     * 添加图层
     */
    addLayer(layer) {
        if (!this.layers.includes(layer)) {
            this.layers.push(layer);
        }
    }
    /**
     * 移除图层
     */
    removeLayer(layer) {
        const index = this.layers.indexOf(layer);
        if (index > -1) {
            this.layers.splice(index, 1);
        }
    }
    /**
     * 清空所有图层
     */
    clearLayers() {
        this.layers = [];
    }
    /**
     * 点击拾取
     */
    async pick(screenPosition) {
        return this.performanceMonitor.measure('query:pick', async () => {
            const features = [];
            // 遍历所有图层进行拾取
            for (const layer of this.layers) {
                if (layer.isVisible() && 'pick' in layer) {
                    const vectorLayer = layer;
                    const pickResults = vectorLayer.pick(screenPosition);
                    features.push(...pickResults.map((r) => r.feature));
                }
            }
            const result = {
                features,
            };
            this.eventBus.emit(ControlEventType.QUERY_RESULT, result);
            return result;
        });
    }
    /**
     * 框选查询
     */
    async boxQuery(box) {
        return this.performanceMonitor.measure('query:box', async () => {
            const features = [];
            const [min, max] = box;
            // 遍历所有图层进行框选查询
            for (const layer of this.layers) {
                if (layer.isVisible() && 'getFeatures' in layer) {
                    const vectorLayer = layer;
                    const allFeatures = vectorLayer.getFeatures();
                    // 简单边界框过滤
                    for (const feature of allFeatures) {
                        if (this.isFeatureInBox(feature, min, max)) {
                            features.push(feature);
                        }
                    }
                }
            }
            const result = {
                features,
                bounds: box,
            };
            this.eventBus.emit(ControlEventType.QUERY_RESULT, result);
            return result;
        });
    }
    /**
     * 判断要素是否在框选范围内
     */
    isFeatureInBox(feature, min, max) {
        // 简化实现：检查要素的中心点是否在框内
        const geometry = feature.geometry;
        const coords = geometry.coordinates;
        if (!coords)
            return false;
        // 获取第一个坐标点作为代表
        let point;
        if (Array.isArray(coords[0])) {
            point = coords[0][0] || coords[0];
        }
        else {
            point = coords;
        }
        return (point[0] >= min[0] &&
            point[0] <= max[0] &&
            point[1] >= min[1] &&
            point[1] <= max[1]);
    }
    /**
     * 根据ID查询要素
     */
    async queryById(id) {
        return this.performanceMonitor.measure('query:byId', async () => {
            const features = [];
            for (const layer of this.layers) {
                if (layer.isVisible() && 'getFeatureById' in layer) {
                    const vectorLayer = layer;
                    const feature = vectorLayer.getFeatureById(id);
                    if (feature) {
                        features.push(feature);
                    }
                }
            }
            const result = {
                features,
            };
            this.eventBus.emit(ControlEventType.QUERY_RESULT, result);
            return result;
        });
    }
    /**
     * 属性查询
     */
    async queryByProperty(propertyName, propertyValue) {
        return this.performanceMonitor.measure('query:byProperty', async () => {
            const features = [];
            for (const layer of this.layers) {
                if (layer.isVisible() && 'getFeatures' in layer) {
                    const vectorLayer = layer;
                    const allFeatures = vectorLayer.getFeatures();
                    for (const feature of allFeatures) {
                        if (feature.properties && feature.properties[propertyName] === propertyValue) {
                            features.push(feature);
                        }
                    }
                }
            }
            const result = {
                features,
            };
            this.eventBus.emit(ControlEventType.QUERY_RESULT, result);
            return result;
        });
    }
    /**
     * 设置激活的查询类型
     */
    setActiveQueryType(type) {
        this.activeQueryType = type;
    }
    /**
     * 获取激活的查询类型
     */
    getActiveQueryType() {
        return this.activeQueryType;
    }
    /**
     * 设置选择框
     */
    setSelectionBox(box) {
        this.selectionBox = box;
    }
    /**
     * 获取选择框
     */
    getSelectionBox() {
        return this.selectionBox;
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
     * 销毁控件
     */
    dispose() {
        this.layers = [];
        this.activeQueryType = null;
        this.selectionBox = null;
        this.eventBus.clear();
        this.performanceMonitor.clear();
    }
}
//# sourceMappingURL=QueryControl.js.map