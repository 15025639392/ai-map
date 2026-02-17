import type { Coordinate, IFeature } from '../vectortypes.js';
import type { Layer } from '../renderer/Layer.js';

/**
 * 导航状态
 */
export interface INavigationState {
  /** 中心点坐标 */
  center: Coordinate;
  /** 缩放级别 */
  zoom: number;
  /** 旋转角度（弧度） */
  rotation: number;
  /** 倾斜角度（弧度） */
  tilt: number;
}

/**
 * 导航选项
 */
export interface INavigationOptions {
  /** 动画时长（毫秒） */
  duration?: number;
  /** 缓动函数 */
  easing?: (t: number) => number;
}

/**
 * 飞行定位目标
 */
export interface IFlyToTarget {
  /** 目标中心点 */
  center: Coordinate;
  /** 目标缩放级别 */
  zoom?: number;
  /** 目标旋转角度 */
  rotation?: number;
  /** 目标倾斜角度 */
  tilt?: number;
}

/**
 * 查询结果
 */
export interface IQueryResult {
  /** 选中的要素 */
  features: IFeature[];
  /** 查询框范围 */
  bounds?: [Coordinate, Coordinate];
}

/**
 * 查询类型
 */
export enum QueryType {
  /** 点击拾取 */
  CLICK = 'click',
  /** 框选查询 */
  BOX = 'box',
}

/**
 * 图层项
 */
export interface ILayerItem {
  /** 图层对象 */
  layer: Layer;
  /** 显示名称 */
  name: string;
  /** 是否可见 */
  visible: boolean;
  /** 图层顺序 */
  zIndex: number;
}

/**
 * 控件事件类型
 */
export enum ControlEventType {
  /** 导航改变 */
  NAVIGATION_CHANGE = 'navigation_change',
  /** 查询结果 */
  QUERY_RESULT = 'query_result',
  /** 图层变更 */
  LAYER_CHANGE = 'layer_change',
  /** 图层可见性改变 */
  LAYER_VISIBILITY_CHANGE = 'layer_visibility_change',
  /** 图层顺序改变 */
  LAYER_ORDER_CHANGE = 'layer_order_change',
}

/**
 * 控件事件
 */
export interface IControlEvent {
  /** 事件类型 */
  type: ControlEventType;
  /** 事件数据 */
  data?: any;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 事件监听器
 */
export type EventListener = (event: IControlEvent) => void;
