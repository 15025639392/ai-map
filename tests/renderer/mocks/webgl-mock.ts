/**
 * WebGL2 上下文 Mock
 * 用于测试环境中模拟 WebGL2 API
 */
export class WebGL2RenderingContextMock implements Partial<WebGL2RenderingContext> {
  private _canvas: HTMLCanvasElement;
  private _extensions: Set<string> = new Set();

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
  }

  getContextAttributes(): WebGLContextAttributes | null {
    return {
      alpha: true,
      antialias: true,
      depth: true,
      desynchronized: false,
      failIfMajorPerformanceCaveat: false,
      powerPreference: 'default',
      preserveDrawingBuffer: false,
      stencil: false,
    };
  }

  isContextLost(): boolean {
    return false;
  }

  getExtension(name: string): any {
    if (this._extensions.has(name)) {
      return {};
    }
    return null;
  }

  addMockExtension(name: string): void {
    this._extensions.add(name);
  }

  clearColor(r: number, g: number, b: number, a: number): void {}
  clear(mask: number): void {}
  viewport(x: number, y: number, width: number, height: number): void {}

  createProgram(): WebGLProgram | null {
    return {} as WebGLProgram;
  }

  deleteProgram(program: WebGLProgram): void {}

  createShader(type: number): WebGLShader | null {
    return {} as WebGLShader;
  }

  deleteShader(shader: WebGLShader): void {}

  createTexture(): WebGLTexture | null {
    return {} as WebGLTexture;
  }

  deleteTexture(texture: WebGLTexture): void {}

  createBuffer(): WebGLBuffer | null {
    return {} as WebGLBuffer;
  }

  deleteBuffer(buffer: WebGLBuffer): void {}

  createFramebuffer(): WebGLFramebuffer | null {
    return {} as WebGLFramebuffer;
  }

  deleteFramebuffer(framebuffer: WebGLFramebuffer): void {}

  // 其他必需的方法...

  get canvas(): HTMLCanvasElement {
    return this._canvas;
  }

  get drawingBufferWidth(): number {
    return this._canvas.width;
  }

  get drawingBufferHeight(): number {
    return this._canvas.height;
  }

  // WebGL2 常量
  readonly COLOR_BUFFER_BIT = 0x00004000;
  readonly DEPTH_BUFFER_BIT = 0x00000100;
  readonly VERTEX_SHADER = 0x8b31;
  readonly FRAGMENT_SHADER = 0x8b30;
}

/**
 * 创建 Mock Canvas
 */
export function createMockCanvas(width = 800, height = 600): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * 创建 Mock WebGL2 上下文
 */
export function createMockWebGL2Context(canvas: HTMLCanvasElement): WebGL2RenderingContextMock {
  return new WebGL2RenderingContextMock(canvas);
}
