import type { IContextInfo } from '../renderer/types.js';

/**
 * WebGL2 上下文管理器
 * 负责初始化 WebGL2 上下文、检测扩展支持、处理上下文丢失与恢复
 */
export class Handler {
  private _gl: WebGL2RenderingContext | null = null;
  private _canvas: HTMLCanvasElement | null = null;
  private _extensions: IContextInfo['extensions'];
  private _contextLost = false;
  private _restoreCallbacks: Array<() => void> = [];

  constructor() {
    this._extensions = {
      floatTextures: false,
      standardDerivatives: false,
      drawBuffers: false,
    };
  }

  /**
   * 初始化 WebGL2 上下文
   */
  initialize(canvas: HTMLCanvasElement, options?: WebGLContextAttributes): IContextInfo {
    this._canvas = canvas;

    const gl = canvas.getContext('webgl2', options) as WebGL2RenderingContext | null;
    if (!gl) {
      throw new Error('Failed to create WebGL2 context. Your browser may not support WebGL2.');
    }

    this._gl = gl;
    this._detectExtensions();
    this._setupContextEvents();

    return this.getContextInfo();
  }

  /**
   * 获取 WebGL2 上下文
   */
  get gl(): WebGL2RenderingContext {
    if (!this._gl || this._contextLost) {
      throw new Error('WebGL2 context is not available or lost');
    }
    return this._gl;
  }

  /**
   * 检查上下文是否有效
   */
  isContextValid(): boolean {
    return this._gl !== null && !this._contextLost;
  }

  /**
   * 获取上下文信息
   */
  getContextInfo(): IContextInfo {
    if (!this._gl || !this._canvas) {
      throw new Error('Handler not initialized');
    }

    return {
      gl: this._gl,
      extensions: this._extensions,
      canvasSize: {
        width: this._canvas.width,
        height: this._canvas.height,
      },
      pixelRatio: window.devicePixelRatio || 1,
    };
  }

  /**
   * 注册上下文恢复回调
   */
  onRestore(callback: () => void): void {
    this._restoreCallbacks.push(callback);
  }

  /**
   * 检测 WebGL2 扩展
   */
  private _detectExtensions(): void {
    if (!this._gl) return;

    const gl = this._gl;
    this._extensions.floatTextures =
      gl.getExtension('EXT_color_buffer_float') !== null ||
      gl.getExtension('OES_texture_float') !== null;
    this._extensions.standardDerivatives = gl.getExtension('OES_standard_derivatives') !== null;
    this._extensions.drawBuffers = gl.getExtension('WEBGL_draw_buffers') !== null;
  }

  /**
   * 设置上下文事件监听
   */
  private _setupContextEvents(): void {
    if (!this._canvas) return;

    this._canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this._contextLost = true;
      console.warn('[Handler] WebGL2 context lost');
    });

    this._canvas.addEventListener('webglcontextrestored', () => {
      this._contextLost = false;
      this._detectExtensions();
      console.warn('[Handler] WebGL2 context restored');

      // 调用所有恢复回调
      this._restoreCallbacks.forEach((callback) => callback());
    });
  }

  /**
   * 销毁处理器
   */
  dispose(): void {
    if (this._canvas) {
      this._canvas.removeEventListener('webglcontextlost', () => {});
      this._canvas.removeEventListener('webglcontextrestored', () => {});
    }
    this._gl = null;
    this._canvas = null;
    this._restoreCallbacks = [];
    this._contextLost = false;
  }
}
