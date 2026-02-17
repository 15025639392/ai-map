/**
 * 服务层模块
 * 提供坐标转换、几何修复、瓦片生成、样式管理、鉴权和限流功能
 */

export {
  // 坐标转换服务
  CoordinateTransformService,
} from './CoordinateTransformService.js';

export {
  // 几何修复服务
  GeometryRepairService,
} from './GeometryRepairService.js';

export {
  // 瓦片生成服务
  TileGeneratorService,
} from './TileGeneratorService.js';

export {
  // 栅格瓦片生成服务
  RasterTileGenerator,
} from './RasterTileGenerator.js';

export {
  // 地形瓦片生成服务
  TerrainTileGenerator,
} from './TerrainTileGenerator.js';

export {
  // 瓦片版本管理服务
  TileVersionManager,
} from './TileVersionManager.js';

export {
  // 样式管理服务
  StyleService,
} from './StyleService.js';

export {
  // 鉴权服务
  AuthenticationService,
} from './AuthenticationService.js';

export {
  // 限流服务
  RateLimiterService,
} from './RateLimiterService.js';

export {
  // API 中间件
  APIMiddleware,
  APIResponse,
  createAPIHandler,
  batchHandleRequests,
} from './APIMiddleware.js';

export {
  // 类型定义 - 坐标和几何修复
  CoordinateSystem,
  Point,
  TransformationResult,
  CoordinateValidationResult,
  RepairType,
  GeometryRepairResult,
  GeometryValidationResult,
  GeometryIssue,
} from './types.js';

export {
  // 类型定义 - 瓦片生成
  TileGeneratorFormat,
  TileGeneratorProjection,
  CompressionLevel,
  ITileGeneratorConfig,
  IMVTGeneratorConfig,
  IRasterGeneratorConfig,
  ITerrainGeneratorConfig,
  ITileGeneratorResult,
  ITileMetadata,
  ITileVersion,
  ITileCacheInfo,
  IGenerationStats,
  IBatchGeneratorConfig,
  IBatchProgress,
} from './tile-generator-types.js';

export {
  // 类型定义 - 样式、鉴权、限流
  StyleType,
  IStyleConfig,
  ICreateStyleConfig,
  IUpdateStyleConfig,
  IStyleQuery,
  IStyleQueryResult,
  IApplyStyleConfig,
  IApplyStyleResult,
  AuthType,
  IAPIKey,
  ICreateAPIKeyConfig,
  IJWTConfig,
  IJWTPayload,
  IAuthResult,
  IPermissionCheck,
  RateLimitAlgorithm,
  IRateLimitConfig,
  IRateLimitResult,
  IRateLimitStats,
  IAPIContext,
  IAPIMiddlewareConfig,
  IAPIResponse,
  APIError,
  AuthError,
  RateLimitError,
  PermissionError,
} from './style-types.js';
