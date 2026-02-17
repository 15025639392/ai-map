/**
 * 瓦片生成相关类型定义
 */

/**
 * 瓦片生成格式
 */
export enum TileGeneratorFormat {
  /** MVT (Mapbox Vector Tiles) */
  MVT = 'mvt',
  /** PNG 图片 */
  PNG = 'png',
  /** JPEG 图片 */
  JPEG = 'jpeg',
  /** GeoTIFF */
  GEOTIFF = 'geotiff',
}

/**
 * 瓦片坐标系
 */
export enum TileGeneratorProjection {
  /** Web Mercator (EPSG:3857) */
  WEB_MERCATOR = 'web_mercator',
  /** WGS84 (EPSG:4326) */
  WGS84 = 'wgs84',
}

/**
 * 瓦片压缩级别
 */
export enum CompressionLevel {
  /** 无压缩 */
  NONE = 'none',
  /** 低压缩 */
  LOW = 'low',
  /** 中压缩 */
  MEDIUM = 'medium',
  /** 高压缩 */
  HIGH = 'high',
}

/**
 * 瓦片生成配置
 */
export interface ITileGeneratorConfig {
  /** 生成格式 */
  format: TileGeneratorFormat;

  /** 坐标系 */
  projection: TileGeneratorProjection;

  /** 最大缩放级别 */
  maxZoom: number;

  /** 最小缩放级别 */
  minZoom?: number;

  /** 瓦片大小（像素） */
  tileSize: number;

  /** 是否启用 GZIP 压缩 (仅MVT) */
  enableGzip?: boolean;

  /** 图片压缩级别 (仅栅格瓦片) */
  compression?: CompressionLevel;

  /** 图片质量 0-100 (仅JPEG) */
  quality?: number;

  /** 背景颜色 (HEX, 仅PNG) */
  backgroundColor?: string;

  /** 是否透明背景 */
  transparent?: boolean;
}

/**
 * MVT 瓦片生成配置
 */
export interface IMVTGeneratorConfig extends ITileGeneratorConfig {
  format: TileGeneratorFormat.MVT;

  /** 图层列表 */
  layers: string[];

  /** 每图层最大要素数 */
  maxFeaturesPerLayer?: number;

  /** 是否简化几何图形 */
  simplifyGeometry?: boolean;

  /** 简化容差 */
  simplifyTolerance?: number;
}

/**
 * 栅格瓦片生成配置
 */
export interface IRasterGeneratorConfig extends ITileGeneratorConfig {
  format: TileGeneratorFormat.PNG | TileGeneratorFormat.JPEG;

  /** 背景图层 URL */
  backgroundLayer?: string;

  /** 叠加图层 URLs */
  overlayLayers?: string[];

  /** 数据源 URL 或数据 */
  dataSource: string | any;

  /** 重采样方法 */
  resamplingMethod?: 'nearest' | 'bilinear' | 'cubic';

  /** 缓冲区大小（像素） */
  bufferSize?: number;
}

/**
 * 地形瓦片生成配置
 */
export interface ITerrainGeneratorConfig extends ITileGeneratorConfig {
  format: TileGeneratorFormat.GEOTIFF | TileGeneratorFormat.PNG | TileGeneratorFormat.JPEG;

  /** 高程数据源 */
  elevationSource: string | Float32Array | Int16Array;

  /** 高度范围 */
  elevationRange?: {
    min: number;
    max: number;
  };

  /** 是否生成坡度图 */
  generateSlope?: boolean;

  /** 是否生成坡向图 */
  generateAspect?: boolean;

  /** 颜色渐变 (低-高) */
  colorGradient?: {
    low: string;
    high: string;
  };
}

/**
 * 瓦片生成结果
 */
export interface ITileGeneratorResult {
  /** 生成成功 */
  success: boolean;

  /** 瓦片数据 (ArrayBuffer或字符串) */
  data: ArrayBuffer | string;

  /** 瓦片格式 */
  format: TileGeneratorFormat;

  /** 瓦片大小（字节） */
  size: number;

  /** 生成时间（毫秒） */
  duration: number;

  /** 错误信息 */
  error?: string;

  /** 瓦片元数据 */
  metadata?: ITileMetadata;
}

/**
 * 瓦片元数据
 */
export interface ITileMetadata {
  /** 生成时间戳 */
  timestamp: number;

  /** 要素数量 (MVT) */
  featureCount?: number;

  /** 图层数量 (MVT) */
  layerCount?: number;

  /** 数据源 */
  dataSource?: string;

  /** 版本标识 */
  version?: string;

  /** 缩放级别 */
  zoom: number;

  /** X 坐标 */
  x: number;

  /** Y 坐标 */
  y: number;
}

/**
 * 瓦片版本信息
 */
export interface ITileVersion {
  /** 版本号 */
  version: string;

  /** 创建时间戳 */
  timestamp: number;

  /** 数据源哈希 */
  sourceHash: string;

  /** 瓦片数量 */
  tileCount: number;

  /** 版本描述 */
  description?: string;

  /** 是否过期 */
  expired?: boolean;
}

/**
 * 瓦片缓存信息
 */
export interface ITileCacheInfo {
  /** 瓦片坐标 */
  coord: {
    x: number;
    y: number;
    z: number;
  };

  /** 缓存键 */
  key: string;

  /** 文件路径或URL */
  path: string;

  /** 文件大小（字节） */
  size: number;

  /** 最后访问时间 */
  lastAccess: number;

  /** 版本 */
  version: string;

  /** 命中率 */
  hitCount: number;
}

/**
 * 生成统计数据
 */
export interface IGenerationStats {
  /** 总瓦片数 */
  totalTiles: number;

  /** 成功瓦片数 */
  successTiles: number;

  /** 失败瓦片数 */
  failedTiles: number;

  /** 完整率 */
  completionRate: number;

  /** 总生成时间（毫秒） */
  totalTime: number;

  /** 平均生成时间（毫秒） */
  averageTime: number;

  /** 总数据大小（字节） */
  totalSize: number;

  /** 平均瓦片大小（字节） */
  averageSize: number;

  /** 当前批次索引 */
  currentBatchIndex?: number;

  /** 总批次数 */
  totalBatches?: number;
}

/**
 * 批量生成配置
 */
export interface IBatchGeneratorConfig extends ITileGeneratorConfig {
  /** 并发数 */
  concurrency?: number;

  /** 批次大小 */
  batchSize?: number;

  /** 进度回调 */
  onProgress?: (progress: IBatchProgress) => void;

  /** 完成回调 */
  onComplete?: (result: IGenerationStats) => void;

  /** 错误回调 */
  onError?: (error: Error, tile?: { x: number; y: number; z: number }) => void;
}

/**
 * 批次进度
 */
export interface IBatchProgress {
  /** 当前瓦片索引 */
  tileIndex: number;

  /** 总瓦片数 */
  totalTiles: number;

  /** 已完成数 */
  completed: number;

  /** 失败数 */
  failed: number;

  /** 当前进度 (0-1) */
  progress: number;

  /** 当前批次索引 */
  batchIndex: number;

  /** 总批次数 */
  totalBatches: number;
}
