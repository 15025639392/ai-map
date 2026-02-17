/**
 * 渲染器接口
 */
export interface IRenderer {
  /** 资源管理器 */
  resourceManager: any;

  /** WebGL2 上下文 */
  gl: WebGL2RenderingContext;

  /** 渲染管线 */
  pipeline: any;
}

/**
 * 渲染节点接口
 */
export interface IRenderNode {
  /** 节点唯一标识 */
  readonly id: string;

  /** 渲染优先级（值越大越先渲染） */
  readonly priority: number;

  /** 是否可见 */
  visible: boolean;

  /** 执行渲染 */
  render(renderer: IRenderer): void;
}

/**
 * WebGL 资源引用
 */
export interface IResourceRef {
  /** 资源类型 */
  readonly type: 'texture' | 'program' | 'buffer' | 'framebuffer';

  /** 资源对象 */
  readonly resource: WebGLTexture | WebGLProgram | WebGLBuffer | WebGLFramebuffer;

  /** 引用计数 */
  refCount: number;

  /** 释放资源 */
  dispose(): void;
}

/**
 * 渲染器配置
 */
export interface IRendererConfig {
  /** 目标帧率（默认 60fps） */
  targetFPS?: number;

  /** 是否启用 FBO */
  enableFBO?: boolean;

  /** 是否启用性能监控 */
  enableProfiling?: boolean;
}

/**
 * 上下文信息
 */
export interface IContextInfo {
  /** WebGL2 上下文 */
  gl: WebGL2RenderingContext;

  /** 是否支持某些扩展 */
  extensions: {
    floatTextures: boolean;
    standardDerivatives: boolean;
    drawBuffers: boolean;
  };

  /** 画布尺寸 */
  canvasSize: { width: number; height: number };

  /** 像素比 */
  pixelRatio: number;
}

/**
 * 渲染统计信息
 */
export interface IRenderStats {
  /** 当前帧率 */
  fps: number;

  /** 帧时间（ms） */
  frameTime: number;

  /** 渲染节点数量 */
  nodeCount: number;

  /** 渲染的资源数量 */
  resourceCount: number;
}

/**
 * 图层生命周期钩子
 */
export interface ILifecycleHooks {
  /** 添加到渲染器时调用 */
  onAdd?: () => void | Promise<void>;

  /** 从渲染器移除时调用 */
  onRemove?: () => void | Promise<void>;

  /** 显示时调用 */
  onShow?: () => void | Promise<void>;

  /** 隐藏时调用 */
  onHide?: () => void | Promise<void>;
}

/**
 * 图层配置选项
 */
export interface ILayerOptions {
  /** 图层 ID（可选，自动生成） */
  id?: string;

  /** 渲染优先级（值越大越先渲染） */
  priority?: number;

  /** 初始可见性 */
  visible?: boolean;

  /** 生命周期钩子 */
  hooks?: ILifecycleHooks;

  /** 图层名称 */
  name?: string;
}

/**
 * 图层状态
 */
export enum LayerState {
  /** 已初始化但未添加 */
  INITIALIZED = 'initialized',

  /** 已添加到渲染器 */
  ADDED = 'added',

  /** 已显示 */
  SHOWN = 'shown',

  /** 已隐藏 */
  HIDDEN = 'hidden',

  /** 已移除 */
  REMOVED = 'removed',

  /** 已销毁 */
  DISPOSED = 'disposed',
}
