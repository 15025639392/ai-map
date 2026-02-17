import {
  IQueryResult,
  QueryType,
  ControlEventType,
} from './types.js';
import { EventBus } from './EventBus.js';
import { PerformanceMonitor } from './PerformanceMonitor.js';
import type { VectorLayer } from '../vectors/VectorLayer.js';
import type { Coordinate, IPickResult } from '../vectortypes.js';
import type { Layer } from '../renderer/Layer.js';

/**
 * 查询控件
 */
export class QueryControl {
  private layers: Layer[] = [];
  private eventBus: EventBus;
  private performanceMonitor: PerformanceMonitor;
  private activeQueryType: QueryType | null = null;
  private selectionBox: [Coordinate, Coordinate] | null = null;

  constructor() {
    this.eventBus = new EventBus();
    this.performanceMonitor = new PerformanceMonitor();
  }

  /**
   * 添加图层
   */
  addLayer(layer: Layer): void {
    if (!this.layers.includes(layer)) {
      this.layers.push(layer);
    }
  }

  /**
   * 移除图层
   */
  removeLayer(layer: Layer): void {
    const index = this.layers.indexOf(layer);
    if (index > -1) {
      this.layers.splice(index, 1);
    }
  }

  /**
   * 清空所有图层
   */
  clearLayers(): void {
    this.layers = [];
  }

  /**
   * 点击拾取
   */
  async pick(screenPosition: Coordinate): Promise<IQueryResult> {
    return this.performanceMonitor.measure('query:pick', async () => {
      const features: any[] = [];

      // 遍历所有图层进行拾取
      for (const layer of this.layers) {
        if (layer.isVisible() && 'pick' in layer) {
          const vectorLayer = layer as VectorLayer;
          const pickResults: IPickResult[] = vectorLayer.pick(screenPosition);
          features.push(...pickResults.map((r) => r.feature));
        }
      }

      const result: IQueryResult = {
        features,
      };

      this.eventBus.emit(ControlEventType.QUERY_RESULT, result);
      return result;
    });
  }

  /**
   * 框选查询
   */
  async boxQuery(box: [Coordinate, Coordinate]): Promise<IQueryResult> {
    return this.performanceMonitor.measure('query:box', async () => {
      const features: any[] = [];
      const [min, max] = box;

      // 遍历所有图层进行框选查询
      for (const layer of this.layers) {
        if (layer.isVisible() && 'getFeatures' in layer) {
          const vectorLayer = layer as VectorLayer;
          const allFeatures = vectorLayer.getFeatures();

          // 简单边界框过滤
          for (const feature of allFeatures) {
            if (this.isFeatureInBox(feature, min, max)) {
              features.push(feature);
            }
          }
        }
      }

      const result: IQueryResult = {
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
  private isFeatureInBox(feature: any, min: Coordinate, max: Coordinate): boolean {
    // 简化实现：检查要素的中心点是否在框内
    const geometry = feature.geometry;
    const coords = geometry.coordinates;

    if (!coords) return false;

    // 获取第一个坐标点作为代表
    let point: Coordinate;
    if (Array.isArray(coords[0])) {
      point = coords[0][0] || coords[0];
    } else {
      point = coords;
    }

    return (
      point[0] >= min[0] &&
      point[0] <= max[0] &&
      point[1] >= min[1] &&
      point[1] <= max[1]
    );
  }

  /**
   * 根据ID查询要素
   */
  async queryById(id: string | number): Promise<IQueryResult> {
    return this.performanceMonitor.measure('query:byId', async () => {
      const features: any[] = [];

      for (const layer of this.layers) {
        if (layer.isVisible() && 'getFeatureById' in layer) {
          const vectorLayer = layer as VectorLayer;
          const feature = vectorLayer.getFeatureById(id);
          if (feature) {
            features.push(feature);
          }
        }
      }

      const result: IQueryResult = {
        features,
      };

      this.eventBus.emit(ControlEventType.QUERY_RESULT, result);
      return result;
    });
  }

  /**
   * 属性查询
   */
  async queryByProperty(propertyName: string, propertyValue: any): Promise<IQueryResult> {
    return this.performanceMonitor.measure('query:byProperty', async () => {
      const features: any[] = [];

      for (const layer of this.layers) {
        if (layer.isVisible() && 'getFeatures' in layer) {
          const vectorLayer = layer as VectorLayer;
          const allFeatures = vectorLayer.getFeatures();

          for (const feature of allFeatures) {
            if (feature.properties && feature.properties[propertyName] === propertyValue) {
              features.push(feature);
            }
          }
        }
      }

      const result: IQueryResult = {
        features,
      };

      this.eventBus.emit(ControlEventType.QUERY_RESULT, result);
      return result;
    });
  }

  /**
   * 设置激活的查询类型
   */
  setActiveQueryType(type: QueryType | null): void {
    this.activeQueryType = type;
  }

  /**
   * 获取激活的查询类型
   */
  getActiveQueryType(): QueryType | null {
    return this.activeQueryType;
  }

  /**
   * 设置选择框
   */
  setSelectionBox(box: [Coordinate, Coordinate] | null): void {
    this.selectionBox = box;
  }

  /**
   * 获取选择框
   */
  getSelectionBox(): [Coordinate, Coordinate] | null {
    return this.selectionBox;
  }

  /**
   * 订阅事件
   */
  on(eventType: ControlEventType, listener: any): () => void {
    return this.eventBus.on(eventType, listener);
  }

  /**
   * 取消订阅
   */
  off(eventType: ControlEventType, listener: any): void {
    this.eventBus.off(eventType, listener);
  }

  /**
   * 获取性能监控器
   */
  getPerformanceMonitor(): PerformanceMonitor {
    return this.performanceMonitor;
  }

  /**
   * 销毁控件
   */
  dispose(): void {
    this.layers = [];
    this.activeQueryType = null;
    this.selectionBox = null;
    this.eventBus.clear();
    this.performanceMonitor.clear();
  }
}
