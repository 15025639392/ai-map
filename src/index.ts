/**
 * OpenGlobus Engine - WebGL2 地图渲染引擎
 * 渲染内核与图层框架
 */

// 导出核心渲染器
export { Renderer } from './renderer/Renderer.js';
export type { IRenderNode, IRendererConfig, IRenderStats } from './renderer/types.js';

// 导出 WebGL2 处理器
export { Handler } from './webgl/Handler.js';

// 导出资源管理器
export { ResourceManager } from './renderer/ResourceManager.js';

// 导出渲染管线
export { RenderPipeline, RenderPhase } from './renderer/RenderPipeline.js';

// 导出图层基类
export { Layer } from './renderer/Layer.js';
export type { ILayerOptions, ILifecycleHooks } from './renderer/types.js';
export { LayerState } from './renderer/types.js';

// 导出矢量图层
export { VectorLayer } from './vectors/VectorLayer.js';
export type { IVectorLayerOptions } from './vectors/VectorLayer.js';

// 导出栅格图层
export { RasterLayer } from './rasters/RasterLayer.js';
export type { IRasterLayerOptions } from './rasters/RasterLayer.js';

// 导出控件系统
export { EventBus } from './controls/EventBus.js';
export { PerformanceMonitor } from './controls/PerformanceMonitor.js';
export { NavigationControl } from './controls/NavigationControl.js';
export { QueryControl } from './controls/QueryControl.js';
export { LayerManager } from './controls/LayerManager.js';
export type {
  INavigationState,
  INavigationOptions,
  IFlyToTarget,
  IQueryResult,
  QueryType,
  ILayerItem,
  ControlEventType,
  IControlEvent,
  EventListener
} from './controls/types.js';

// 导出编辑功能
export { EditController } from './edit/EditController.js';
export { UndoRedoManager } from './edit/UndoRedoManager.js';
export type {
  EditToolType,
  EditState,
  EditEventType,
  IDrawOptions,
  IEditOperation,
  ICommand,
  IVertexInfo,
  ISelectionInfo,
  IEditResult,
  IEditConfig
} from './edit/types.js';

// 导出瓦片管理
export { TileQueue } from './tiles/TileQueue.js';
export { TileRequestManager } from './tiles/TileRequestManager.js';
export { TileStats } from './tiles/TileStats.js';
export type {
  ITileCoord,
  TileState,
  ITile,
  TileLoadFunction,
  ITileRequestConfig,
  ITileQueueConfig,
  ITileStats,
  TileQueueEvent,
  TileQueueEventListener
} from './tiles/types.js';

// 导出所有矢量类型
export * from './vectortypes.js';
