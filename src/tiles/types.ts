/**
 * 瓦片坐标
 */
export interface ITileCoord {
  /** X 坐标 */
  readonly x: number;

  /** Y 坐标 */
  readonly y: number;

  /** 缩放级别 */
  readonly z: number;
}

/**
 * 瓦片加载状态
 */
export enum TileState {
  /** 等待中 */
  PENDING = 'pending',

  /** 加载中 */
  LOADING = 'loading',

  /** 已加载 */
  LOADED = 'loaded',

  /** 加载失败 */
  FAILED = 'failed',

  /** 已取消 */
  CANCELLED = 'cancelled',
}

/**
 * 瓦片接口
 */
export interface ITile {
  /** 瓦片坐标 */
  readonly coord: ITileCoord;

  /** 瓦片 URL */
  readonly url: string;

  /** 加载状态 */
  state: TileState;

  /** 加载优先级（值越大优先级越高） */
  priority: number;

  /** 加载时间（毫秒） */
  loadTime?: number;

  /** 重试次数 */
  retryCount: number;

  /** 最后错误 */
  lastError?: Error;

  /** 瓦片数据 */
  data?: any;

  /** 请求 ID */
  requestId: string;
}

/**
 * 瓦片加载函数
 */
export type TileLoadFunction = (tile: ITile) => Promise<any>;

/**
 * 瓦片请求配置
 */
export interface ITileRequestConfig {
  /** 最大并发请求数 */
  maxConcurrent?: number;

  /** 最大重试次数 */
  maxRetries?: number;

  /** 重试延迟基数（毫秒） */
  retryDelayBase?: number;

  /** 重试延迟最大值（毫秒） */
  retryDelayMax?: number;

  /** 请求超时时间（毫秒） */
  requestTimeout?: number;

  /** 加载函数 */
  loadFn: TileLoadFunction;
}

/**
 * 瓦片队列配置
 */
export interface ITileQueueConfig extends ITileRequestConfig {
  /** 最大缓存数量 */
  maxCacheSize?: number;

  /** 是否启用 LRU 缓存 */
  enableLRU?: boolean;

  /** 是否启用优先级队列 */
  enablePriority?: boolean;
}

/**
 * 瓦片统计信息
 */
export interface ITileStats {
  /** 总请求数 */
  totalRequests: number;

  /** 成功请求数 */
  successRequests: number;

  /** 失败请求数 */
  failedRequests: number;

  /** 取消请求数 */
  cancelledRequests: number;

  /** 平均加载时间（毫秒） */
  averageLoadTime: number;

  /** P50 加载时间（毫秒） */
  p50: number;

  /** P95 加载时间（毫秒） */
  p95: number;

  /** P99 加载时间（毫秒） */
  p99: number;

  /** 当前队列长度 */
  queueLength: number;

  /** 当前加载中的数量 */
  loadingCount: number;
}

/**
 * 瓦片队列事件
 */
export type TileQueueEvent =
  | 'tileRequested'
  | 'tileLoaded'
  | 'tileFailed'
  | 'tileCancelled'
  | 'tileRetried';

/**
 * 瓦片队列事件监听器
 */
export type TileQueueEventListener = (event: TileQueueEvent, tile: ITile) => void;
