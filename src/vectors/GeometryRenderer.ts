// 使用全局的WebGL2RenderingContext类型
type WebGL2RenderingContext = any;
import {
  IGeometry,
  GeometryType,
  Coordinates,
  LineCoordinates,
  PolygonCoordinates,
  IVectorStyle,
  IRenderStats,
} from '../vectortypes.js';
import {
  POINT_VERTEX_SHADER,
  POINT_FRAGMENT_SHADER,
  LINE_VERTEX_SHADER,
  LINE_FRAGMENT_SHADER,
  POLYGON_VERTEX_SHADER,
  POLYGON_FRAGMENT_SHADER,
  ColorUtils,
} from './ShaderPrograms.js';

/**
 * 几何渲染器
 */
export class GeometryRenderer {
  private gl: WebGL2RenderingContext;
  private pointProgram: WebGLProgram | null = null;
  private lineProgram: WebGLProgram | null = null;
  private polygonProgram: WebGLProgram | null = null;
  private resolution = [4096, 4096];

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.initPrograms();
  }

  /**
   * 初始化着色器程序
   */
  private initPrograms(): void {
    this.pointProgram = this.createProgram(POINT_VERTEX_SHADER, POINT_FRAGMENT_SHADER);
    this.lineProgram = this.createProgram(LINE_VERTEX_SHADER, LINE_FRAGMENT_SHADER);
    this.polygonProgram = this.createProgram(POLYGON_VERTEX_SHADER, POLYGON_FRAGMENT_SHADER);
  }

  /**
   * 创建着色器程序
   */
  private createProgram(vertexShaderSource: string, fragmentShaderSource: string): WebGLProgram {
    const gl = this.gl;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) {
      throw new Error('Failed to create vertex shader');
    }
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) {
      throw new Error('Failed to create fragment shader');
    }
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();
    if (!program) {
      throw new Error('Failed to create program');
    }
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const error = gl.getProgramInfoLog(program);
      throw new Error(`Failed to link program: ${error}`);
    }

    return program;
  }

  /**
   * 渲染几何
   */
  render(geometries: IGeometry[], style: IVectorStyle, zoom: number = 1.0): IRenderStats {
    const stats: IRenderStats = {
      featuresRendered: geometries.length,
      pointsRendered: 0,
      linesRendered: 0,
      polygonsRendered: 0,
    };

    const gl = this.gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    for (const geometry of geometries) {
      switch (geometry.type) {
        case GeometryType.POINT:
        case GeometryType.MULTI_POINT:
          this.renderPoint(geometry, style, zoom);
          stats.pointsRendered++;
          break;
        case GeometryType.LINE:
        case GeometryType.MULTI_LINE:
          this.renderLine(geometry, style);
          stats.linesRendered++;
          break;
        case GeometryType.POLYGON:
        case GeometryType.MULTI_POLYGON:
          this.renderPolygon(geometry, style);
          stats.polygonsRendered++;
          break;
      }
    }

    return stats;
  }

  /**
   * 渲染点
   */
  private renderPoint(geometry: IGeometry, style: IVectorStyle, zoom: number): void {
    const gl = this.gl;
    const program = this.pointProgram;
    if (!program) return;

    gl.useProgram(program);

    // 获取属性和uniform位置
    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const sizeLoc = gl.getAttribLocation(program, 'a_size');
    const colorLoc = gl.getAttribLocation(program, 'a_color');
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    const zoomLoc = gl.getUniformLocation(program, 'u_zoom');

    // 设置uniform
    gl.uniform2f(resolutionLoc, this.resolution[0], this.resolution[1]);
    gl.uniform1f(zoomLoc, zoom);

    // 准备顶点数据
    const coordinates = this.extractPointCoordinates(geometry);
    const vertices: number[] = [];
    const colors = this.getColor(style, 'point');

    for (const coord of coordinates) {
      // @ts-ignore - 类型断言
      vertices.push(coord[0], coord[1]);
    }

    // 创建缓冲区
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // 设置大小
    const size = style.pointRadius || 5.0;
    gl.vertexAttrib1f(sizeLoc, size);

    // 设置颜色
    gl.vertexAttrib4f(colorLoc, colors[0], colors[1], colors[2], colors[3]);

    // 绘制
    gl.drawArrays(gl.POINTS, 0, vertices.length / 2);

    // 清理
    gl.deleteBuffer(positionBuffer);
  }

  /**
   * 渲染线
   */
  private renderLine(geometry: IGeometry, style: IVectorStyle): void {
    const gl = this.gl;
    const program = this.lineProgram;
    if (!program) return;

    gl.useProgram(program);

    // 获取属性和uniform位置
    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const colorLoc = gl.getAttribLocation(program, 'a_color');
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');

    // 设置uniform
    gl.uniform2f(resolutionLoc, this.resolution[0], this.resolution[1]);

    // 准备顶点数据
    const lines = this.extractLineCoordinates(geometry);
    const colors = this.getColor(style, 'stroke');
    const vertices: number[] = [];

    for (const line of lines) {
      for (const coord of line) {
        vertices.push(coord[0], coord[1]);
      }
    }

    // 创建缓冲区
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // 设置颜色
    gl.vertexAttrib4f(colorLoc, colors[0], colors[1], colors[2], colors[3]);

    // 设置线宽
    gl.lineWidth(style.strokeWidth || 1.0);

    // 绘制
    let offset = 0;
    // @ts-ignore - 类型断言
    let vertexOffset = 0;
    for (const line of lines) {
      gl.drawArrays(gl.LINE_STRIP, vertexOffset, line.length);
      vertexOffset += line.length;
    }

    // 清理
    gl.deleteBuffer(positionBuffer);
  }

  /**
   * 渲染面
   */
  private renderPolygon(geometry: IGeometry, style: IVectorStyle): void {
    const gl = this.gl;
    const program = this.polygonProgram;
    if (!program) return;

    gl.useProgram(program);

    // 获取属性和uniform位置
    const positionLoc = gl.getAttribLocation(program, 'a_position');
    const colorLoc = gl.getAttribLocation(program, 'a_color');
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');

    // 设置uniform
    gl.uniform2f(resolutionLoc, this.resolution[0], this.resolution[1]);

    // 准备顶点数据
    const polygons = this.extractPolygonCoordinates(geometry);
    const colors = this.getColor(style, 'fill');
    const vertices: number[] = [];

    for (const polygon of polygons) {
      // 使用三角扇绘制多边形
      const triangles = this.triangulate(polygon);
      for (let i = 0; i < triangles.length; i++) {
        vertices.push(triangles[i]);
      }
    }

    // 创建缓冲区
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // 设置颜色
    gl.vertexAttrib4f(colorLoc, colors[0], colors[1], colors[2], colors[3]);

    // 绘制
    let offset = 0;
    for (const polygon of polygons) {
      const triangles = this.triangulate(polygon);
      // @ts-ignore - 类型断言
      gl.drawArrays(gl.TRIANGLES, offset, triangles.length / 3);
      offset += triangles.length;
    }

    // 清理
    gl.deleteBuffer(positionBuffer);
  }

  /**
   * 提取点坐标
   */
  private extractPointCoordinates(geometry: IGeometry): Coordinates[] {
    if (geometry.type === GeometryType.POINT) {
      return [geometry.coordinates as Coordinates];
    } else {
      return geometry.coordinates as Coordinates[];
    }
  }

  /**
   * 提取线坐标
   */
  private extractLineCoordinates(geometry: IGeometry): LineCoordinates {
    if (geometry.type === GeometryType.LINE) {
      return [geometry.coordinates as Coordinates];
    } else {
      return geometry.coordinates as LineCoordinates;
    }
  }

  /**
   * 提取面坐标
   */
  private extractPolygonCoordinates(geometry: IGeometry): PolygonCoordinates {
    if (geometry.type === GeometryType.POLYGON) {
      return [geometry.coordinates as Coordinates[]];
    } else {
      return geometry.coordinates as PolygonCoordinates;
    }
  }

  /**
   * 三角化多边形（简化版）
   */
  private triangulate(ring: Coordinates[]): number[] {
    // 简化的三角化：将多边形分解为三角形
    const vertices: number[] = [];
    if (ring.length < 3) return vertices;

    // @ts-ignore - 类型断言
    const center = ring[0] as [number, number];
    for (let i = 1; i < ring.length - 1; i++) {
      // @ts-ignore - 类型断言
      const p1 = ring[i] as [number, number];
      // @ts-ignore - 类型断言
      const p2 = ring[i + 1] as [number, number];
      vertices.push(center[0], center[1]);
      vertices.push(p1[0], p1[1]);
      vertices.push(p2[0], p2[1]);
    }

    return vertices;
  }

  /**
   * 获取颜色
   */
  private getColor(style: IVectorStyle, type: 'point' | 'stroke' | 'fill'): [number, number, number, number] {
    let color = '#000000';
    let opacity = 1.0;

    switch (type) {
      case 'point':
        color = style.pointColor || '#000000';
        opacity = style.pointOpacity !== undefined ? style.pointOpacity : 1.0;
        break;
      case 'stroke':
        color = style.strokeColor || '#000000';
        opacity = style.strokeOpacity !== undefined ? style.strokeOpacity : 1.0;
        break;
      case 'fill':
        color = style.fillColor || '#000000';
        opacity = style.fillOpacity !== undefined ? style.fillOpacity : 0.5;
        break;
    }

    return ColorUtils.cssToRgba(color, opacity);
  }

  /**
   * 设置分辨率
   */
  setResolution(width: number, height: number): void {
    this.resolution = [width, height];
  }

  /**
   * 销毁
   */
  dispose(): void {
    const gl = this.gl;
    if (this.pointProgram) {
      gl.deleteProgram(this.pointProgram);
      this.pointProgram = null;
    }
    if (this.lineProgram) {
      gl.deleteProgram(this.lineProgram);
      this.lineProgram = null;
    }
    if (this.polygonProgram) {
      gl.deleteProgram(this.polygonProgram);
      this.polygonProgram = null;
    }
  }
}
