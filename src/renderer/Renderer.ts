import { Handler } from '../webgl/Handler.js';
import { ResourceManager } from './ResourceManager.js';
import { RenderPipeline } from './RenderPipeline.js';
import type {
  IRenderNode,
  IRendererConfig,
  IRenderStats,
  IContextInfo,
} from './types.js';

/**
 * WebGL2 渲染主循环
 * 负责帧循环管理、渲染队列调度、性能监控
 */
export class Renderer {
  private _handler: Handler;
  private _resourceManager: ResourceManager;
  private _pipeline: RenderPipeline | null = null;
  private _canvas: HTMLCanvasElement | null = null;
  private _config: Required<IRendererConfig>;
  private _animationFrameId: number | null = null;
  private _isRunning = false;
  private _isPaused = false;
  private _lastTime = 0;
  private _targetFrameTime: number;
  private _contextInfo: IContextInfo | null = null;

  constructor(config?: IRendererConfig) {
    this._handler = new Handler();
    this._resourceManager = new ResourceManager();
    this._config = {
      targetFPS: config?.targetFPS ?? 60,
      enableFBO: config?.enableFBO ?? false,
      enableProfiling: config?.enableProfiling ?? false,
    };
    this._targetFrameTime = 1000 / this._config.targetFPS;
  }

  /**
   * 附加到画布
   */
  attachTo(canvas: HTMLCanvasElement, options?: WebGLContextAttributes): void {
    if (this._canvas) {
      throw new Error('Renderer already attached to a canvas');
    }

    this._canvas = canvas;
    this._contextInfo = this._handler.initialize(canvas, options);
    this._pipeline = new RenderPipeline(this._contextInfo);

    // 注册上下文恢复回调
    this._handler.onRestore(() => {
      console.log('[Renderer] Context restored, re-initializing...');
      if (this._contextInfo) {
        this._pipeline = new RenderPipeline(this._contextInfo);
      }
    });
  }

  /**
   * 获取 WebGL2 上下文
   */
  get gl(): WebGL2RenderingContext {
    return this._handler.gl;
  }

  /**
   * 获取上下文信息
   */
  get contextInfo(): IContextInfo {
    if (!this._contextInfo) {
      throw new Error('Renderer not attached to canvas');
    }
    return this._contextInfo;
  }

  /**
   * 获取处理器
   */
  get handler(): Handler {
    return this._handler;
  }

  /**
   * 获取资源管理器
   */
  get resourceManager(): ResourceManager {
    return this._resourceManager;
  }

  /**
   * 获取渲染管线
   */
  get pipeline(): RenderPipeline {
    if (!this._pipeline) {
      throw new Error('Renderer not attached to canvas');
    }
    return this._pipeline;
  }

  /**
   * 开始渲染循环
   */
  start(): void {
    if (this._isRunning) {
      console.warn('[Renderer] Already running');
      return;
    }

    if (!this._canvas) {
      throw new Error('Renderer not attached to canvas');
    }

    this._isRunning = true;
    this._isPaused = false;
    this._lastTime = performance.now();
    this._renderLoop();
  }

  /**
   * 停止渲染循环
   */
  stop(): void {
    if (!this._isRunning) {
      return;
    }

    this._isRunning = false;
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
  }

  /**
   * 暂停渲染
   */
  pause(): void {
    this._isPaused = true;
  }

  /**
   * 恢复渲染
   */
  resume(): void {
    this._isPaused = false;
    this._lastTime = performance.now();
  }

  /**
   * 渲染一帧
   */
  renderFrame(): void {
    const now = performance.now();
    const deltaTime = now - this._lastTime;
    this._lastTime = now;

    if (this._pipeline && !this._isPaused) {
      this._pipeline.execute(deltaTime);
    }
  }

  /**
   * 渲染主循环
   */
  private _renderLoop(): void {
    if (!this._isRunning) {
      return;
    }

    this._animationFrameId = requestAnimationFrame(() => {
      this._renderLoop();
    });

    this.renderFrame();
  }

  /**
   * 添加渲染节点
   */
  addNode(node: IRenderNode): void {
    if (!this._pipeline) {
      throw new Error('Renderer not attached to canvas');
    }
    this._pipeline.addNode(node);
  }

  /**
   * 移除渲染节点
   */
  removeNode(id: string): void {
    if (!this._pipeline) {
      throw new Error('Renderer not attached to canvas');
    }
    this._pipeline.removeNode(id);
  }

  /**
   * 获取渲染节点
   */
  getNode(id: string): IRenderNode | undefined {
    return this._pipeline?.getNode(id);
  }

  /**
   * 获取统计信息
   */
  getStats(): IRenderStats | null {
    if (!this._pipeline) {
      return null;
    }
    const stats = this._pipeline.getStats();
    stats.resourceCount = this._resourceManager.getResourceCount();
    return stats;
  }

  /**
   * 调整画布尺寸
   */
  resize(width: number, height: number): void {
    if (!this._canvas) {
      return;
    }

    this._canvas.width = width;
    this._canvas.height = height;

    const gl = this._handler.gl;
    gl.viewport(0, 0, width, height);

    // 更新上下文信息
    if (this._contextInfo) {
      this._contextInfo.canvasSize = { width, height };
    }
  }

  /**
   * 检查是否正在运行
   */
  get isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * 检查是否暂停
   */
  get isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * 销毁渲染器
   */
  dispose(): void {
    this.stop();

    if (this._pipeline) {
      this._pipeline.dispose();
      this._pipeline = null;
    }

    this._resourceManager.dispose();
    this._handler.dispose();

    this._canvas = null;
    this._contextInfo = null;
  }
}
