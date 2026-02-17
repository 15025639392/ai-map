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
