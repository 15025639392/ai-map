import { Layer } from '../renderer/Layer.js';
import { GeoJSONParser } from './GeoJSONParser.js';
import { MVTParser } from './MVTParser.js';
import { GeometryRenderer } from './GeometryRenderer.js';
import { PickingManager } from './PickingManager.js';
/**
 * 矢量图层类
 */
export class VectorLayer extends Layer {
    _features = [];
    _geometryRenderer = null;
    _pickingManager = null;
    _style;
    _zoom;
    _dataSourceType;
    constructor(options = {}) {
        super({
            ...options,
            name: options.name || 'VectorLayer',
        });
        this._dataSourceType = options.dataSourceType || 'geojson';
        this._style = options.style || {};
        this._zoom = options.zoom || 1.0;
        // 初始化拾取管理器
        this._pickingManager = new PickingManager(options.pickingConfig);
        // 加载数据
        if (options.geojsonData) {
            this.loadGeoJSON(options.geojsonData);
        }
        else if (options.mvtData) {
            this.loadMVT(options.mvtData, options.mvtLayerName);
        }
    }
    /**
     * 加载 GeoJSON 数据
     */
    loadGeoJSON(geojson) {
        this._features = GeoJSONParser.parse(geojson);
        this._dataSourceType = 'geojson';
        // 更新拾取管理器
        if (this._pickingManager) {
            this._pickingManager.clear();
            this._pickingManager.addFeatures(this._features);
        }
        // 触发更新
        this._triggerUpdate();
    }
    /**
     * 加载 MVT 数据
     */
    loadMVT(mvtData, layerName) {
        this._features = MVTParser.parse(mvtData, layerName);
        this._dataSourceType = 'mvt';
        // 更新拾取管理器
        if (this._pickingManager) {
            this._pickingManager.clear();
            this._pickingManager.addFeatures(this._features);
        }
        // 触发更新
        this._triggerUpdate();
    }
    /**
     * 设置样式
     */
    setStyle(style) {
        this._style = { ...this._style, ...style };
        this._triggerUpdate();
    }
    /**
     * 获取样式
     */
    getStyle() {
        return { ...this._style };
    }
    /**
     * 设置缩放级别
     */
    setZoom(zoom) {
        this._zoom = zoom;
        this._triggerUpdate();
    }
    /**
     * 获取缩放级别
     */
    getZoom() {
        return this._zoom;
    }
    /**
     * 获取要素
     */
    getFeatures() {
        return [...this._features];
    }
    /**
     * 根据ID获取要素
     */
    getFeatureById(id) {
        return this._features.find((f) => f.id === id);
    }
    /**
     * 拾取要素
     */
    pick(screenPosition, projection) {
        if (!this._pickingManager) {
            return [];
        }
        return this._pickingManager.pick(screenPosition, projection);
    }
    /**
     * 获取渲染统计
     */
    getRenderStats() {
        return {
            featuresRendered: this._features.length,
            pointsRendered: this._features.filter((f) => f.geometry.type === 'point' || f.geometry.type === 'multi_point').length,
            linesRendered: this._features.filter((f) => f.geometry.type === 'line' || f.geometry.type === 'multi_line').length,
            polygonsRendered: this._features.filter((f) => f.geometry.type === 'polygon' || f.geometry.type === 'multi_polygon').length,
        };
    }
    /**
     * 触发更新
     */
    _triggerUpdate() {
        // 这里可以触发事件通知渲染器重绘
        // 实际实现中应该使用事件发射器
    }
    /**
     * 渲染图层
     */
    render(renderer) {
        if (!this.visible || this._disposed) {
            return;
        }
        if (this._geometryRenderer) {
            const geometries = this._features.map((f) => f.geometry);
            this._geometryRenderer.render(geometries, this._style, this._zoom);
        }
    }
    /**
     * 添加到渲染器时初始化
     */
    _onAdd(renderer) {
        super.add(renderer);
        // 初始化几何渲染器
        const gl = renderer.gl;
        if (gl) {
            this._geometryRenderer = new GeometryRenderer(gl);
        }
    }
    /**
     * 从渲染器移除时清理
     */
    _onRemove() {
        // 清理几何渲染器
        if (this._geometryRenderer) {
            this._geometryRenderer.dispose();
            this._geometryRenderer = null;
        }
        super.remove();
    }
    /**
     * 销毁图层
     */
    dispose() {
        // @ts-ignore - 访问父类私有属性
        if (this._disposed) {
            return;
        }
        // 清理渲染器
        if (this._geometryRenderer) {
            this._geometryRenderer.dispose();
            this._geometryRenderer = null;
        }
        // 清理拾取管理器
        if (this._pickingManager) {
            this._pickingManager.dispose();
            this._pickingManager = null;
        }
        // 清空要素
        this._features = [];
        // @ts-ignore - 访问父类私有属性
        this._disposed = true;
    }
    /**
     * 获取数据源类型
     */
    getDataSourceType() {
        return this._dataSourceType;
    }
    /**
     * 获取拾取管理器
     */
    getPickingManager() {
        return this._pickingManager;
    }
    /**
     * 测试拾取准确率
     */
    testAccuracy(testCases) {
        if (!this._pickingManager) {
            return { total: testCases.length, correct: 0, accuracy: 0 };
        }
        return this._pickingManager.testAccuracy(testCases);
    }
    /**
     * 获取统计信息
     */
    getStats() {
        return {
            ...this.getRenderStats(),
            dataSourceType: this._dataSourceType,
            zoom: this._zoom,
            pickingManager: this._pickingManager ? this._pickingManager.getStats() : null,
        };
    }
}
//# sourceMappingURL=VectorLayer.js.map