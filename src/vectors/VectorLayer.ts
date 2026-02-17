import { Layer } from '../renderer/Layer.js';
import type { IRenderer, ILayerOptions } from '../renderer/types.js';
import { GeoJSONParser } from './GeoJSONParser.js';
import { MVTParser } from './MVTParser.js';
import { GeometryRenderer } from './GeometryRenderer.js';
import { PickingManager } from './PickingManager.js';
import {
  GeoJSONData,
  MVTData,
  IFeature,
  IVectorStyle,
  IPickResult,
  IRenderStats,
  Coordinate,
} from '../vectortypes.js';
// 使用全局的WebGL2RenderingContext类型
type WebGL2RenderingContext = any;

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
export class VectorLayer extends Layer {
  private _features: IFeature[] = [];
  private _geometryRenderer: GeometryRenderer | null = null;
  private _pickingManager: PickingManager | null = null;
  private _style: IVectorStyle;
  private _zoom: number;
  private _dataSourceType: 'geojson' | 'mvt';

  constructor(options: IVectorLayerOptions = {}) {
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
    } else if (options.mvtData) {
      this.loadMVT(options.mvtData, options.mvtLayerName);
    }
  }

  /**
   * 加载 GeoJSON 数据
   */
  loadGeoJSON(geojson: GeoJSONData): void {
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
  loadMVT(mvtData: MVTData, layerName?: string): void {
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
  setStyle(style: IVectorStyle): void {
    this._style = { ...this._style, ...style };
    this._triggerUpdate();
  }

  /**
   * 获取样式
   */
  getStyle(): IVectorStyle {
    return { ...this._style };
  }

  /**
   * 设置缩放级别
   */
  setZoom(zoom: number): void {
    this._zoom = zoom;
    this._triggerUpdate();
  }

  /**
   * 获取缩放级别
   */
  getZoom(): number {
    return this._zoom;
  }

  /**
   * 获取要素
   */
  getFeatures(): IFeature[] {
    return [...this._features];
  }

  /**
   * 根据ID获取要素
   */
  getFeatureById(id: string | number): IFeature | undefined {
    return this._features.find((f) => f.id === id);
  }

  /**
   * 拾取要素
   */
  pick(screenPosition: Coordinate, projection?: (coord: Coordinate) => Coordinate): IPickResult[] {
    if (!this._pickingManager) {
      return [];
    }
    return this._pickingManager.pick(screenPosition, projection);
  }

  /**
   * 获取渲染统计
   */
  getRenderStats(): IRenderStats {
    return {
      featuresRendered: this._features.length,
      pointsRendered: this._features.filter((f) =>
        f.geometry.type === 'point' || f.geometry.type === 'multi_point'
      ).length,
      linesRendered: this._features.filter((f) =>
        f.geometry.type === 'line' || f.geometry.type === 'multi_line'
      ).length,
      polygonsRendered: this._features.filter((f) =>
        f.geometry.type === 'polygon' || f.geometry.type === 'multi_polygon'
      ).length,
    };
  }

  /**
   * 触发更新
   */
  private _triggerUpdate(): void {
    // 这里可以触发事件通知渲染器重绘
    // 实际实现中应该使用事件发射器
  }

  /**
   * 渲染图层
   */
  render(renderer: IRenderer): void {
    if (!this.visible || this.isDisposed()) {
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
  protected _onAdd(renderer: IRenderer): void {
    super.add(renderer);

    // 初始化几何渲染器
    const gl = renderer.gl as WebGL2RenderingContext;
    if (gl) {
      this._geometryRenderer = new GeometryRenderer(gl);
    }
  }

  /**
   * 从渲染器移除时清理
   */
  protected _onRemove(): void {
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
  dispose(): void {
    if (this.isDisposed()) {
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

    // 调用父类dispose
    super.dispose();
  }

  /**
   * 获取数据源类型
   */
  getDataSourceType(): 'geojson' | 'mvt' {
    return this._dataSourceType;
  }

  /**
   * 获取拾取管理器
   */
  getPickingManager(): PickingManager | null {
    return this._pickingManager;
  }

  /**
   * 测试拾取准确率
   */
  testAccuracy(testCases: Array<{ feature: IFeature; point: Coordinate; expectedPick: boolean }>): {
    total: number;
    correct: number;
    accuracy: number;
  } {
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
