import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GeometryRenderer } from '../../src/vectors/GeometryRenderer.js';
import { IGeometry, GeometryType, IVectorStyle } from '../../src/vectortypes.js';

/**
 * 创建模拟的 WebGL2 上下文
 */
function createMockGL(): any {
  const mockGL = {
    createShader: vi.fn(() => ({ __mockShader: true })),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    createProgram: vi.fn(() => ({ __mockProgram: true })),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => ''),
    getAttribLocation: vi.fn(() => 0),
    getUniformLocation: vi.fn(() => ({ __mockUniform: true })),
    useProgram: vi.fn(),
    uniform2f: vi.fn(),
    uniform1f: vi.fn(),
    vertexAttribPointer: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    disableVertexAttribArray: vi.fn(),
    vertexAttrib1f: vi.fn(),
    vertexAttrib4f: vi.fn(),
    createBuffer: vi.fn(() => ({ __mockBuffer: true })),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    deleteBuffer: vi.fn(),
    deleteProgram: vi.fn(),
    drawArrays: vi.fn(),
    lineWidth: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    blendFunc: vi.fn(),
    VERTEX_SHADER: 0x8b31,
    FRAGMENT_SHADER: 0x8b30,
    LINK_STATUS: true,
    POINTS: 0x0000,
    LINES: 0x0001,
    LINE_STRIP: 0x0003,
    TRIANGLES: 0x0004,
    FLOAT: 0x1406,
    STATIC_DRAW: 0x88e4,
    BLEND: 0x0be2,
    SRC_ALPHA: 0x0302,
    ONE_MINUS_SRC_ALPHA: 0x0303,
  };

  return mockGL;
}

describe('GeometryRenderer', () => {
  let renderer: GeometryRenderer;
  let mockGL: any;

  beforeEach(() => {
    mockGL = createMockGL();
    renderer = new GeometryRenderer(mockGL);
  });

  describe('constructor', () => {
    it('should create renderer with WebGL context', () => {
      expect(renderer).toBeDefined();
    });

    it('should initialize shader programs', () => {
      expect(mockGL.createProgram).toHaveBeenCalled();
      expect(mockGL.linkProgram).toHaveBeenCalled();
    });
  });

  describe('render', () => {
    it('should render point geometry', () => {
      const geometries: IGeometry[] = [
        {
          type: GeometryType.POINT,
          coordinates: [100.0, 0.0],
        },
      ];

      const style: IVectorStyle = {
        pointColor: '#ff0000',
        pointRadius: 10,
      };

      const stats = renderer.render(geometries, style);

      expect(stats.featuresRendered).toBe(1);
      expect(stats.pointsRendered).toBe(1);
      expect(stats.linesRendered).toBe(0);
      expect(stats.polygonsRendered).toBe(0);
      expect(mockGL.drawArrays).toHaveBeenCalled();
    });

    it('should render line geometry', () => {
      const geometries: IGeometry[] = [
        {
          type: GeometryType.LINE,
          coordinates: [
            [100.0, 0.0],
            [101.0, 1.0],
          ],
        },
      ];

      const style: IVectorStyle = {
        strokeColor: '#ff0000',
        strokeWidth: 2,
      };

      const stats = renderer.render(geometries, style);

      expect(stats.featuresRendered).toBe(1);
      expect(stats.pointsRendered).toBe(0);
      expect(stats.linesRendered).toBe(1);
      expect(stats.polygonsRendered).toBe(0);
      expect(mockGL.drawArrays).toHaveBeenCalled();
    });

    it('should render polygon geometry', () => {
      const geometries: IGeometry[] = [
        {
          type: GeometryType.POLYGON,
          coordinates: [
            [
              [100.0, 0.0],
              [101.0, 0.0],
              [101.0, 1.0],
              [100.0, 1.0],
              [100.0, 0.0],
            ],
          ],
        },
      ];

      const style: IVectorStyle = {
        fillColor: '#ff0000',
        fillOpacity: 0.5,
      };

      const stats = renderer.render(geometries, style);

      expect(stats.featuresRendered).toBe(1);
      expect(stats.pointsRendered).toBe(0);
      expect(stats.linesRendered).toBe(0);
      expect(stats.polygonsRendered).toBe(1);
      expect(mockGL.drawArrays).toHaveBeenCalled();
    });

    it('should render multipoint geometry', () => {
      const geometries: IGeometry[] = [
        {
          type: GeometryType.MULTI_POINT,
          coordinates: [
            [100.0, 0.0],
            [101.0, 1.0],
          ],
        },
      ];

      const style: IVectorStyle = {
        pointColor: '#ff0000',
      };

      const stats = renderer.render(geometries, style);

      expect(stats.featuresRendered).toBe(1);
      expect(stats.pointsRendered).toBe(1);
    });

    it('should render multiline geometry', () => {
      const geometries: IGeometry[] = [
        {
          type: GeometryType.MULTI_LINE,
          coordinates: [
            [
              [100.0, 0.0],
              [101.0, 1.0],
            ],
            [
              [102.0, 2.0],
              [103.0, 3.0],
            ],
          ],
        },
      ];

      const style: IVectorStyle = {
        strokeColor: '#ff0000',
      };

      const stats = renderer.render(geometries, style);

      expect(stats.featuresRendered).toBe(1);
      expect(stats.linesRendered).toBe(1);
    });

    it('should render multipolygon geometry', () => {
      const geometries: IGeometry[] = [
        {
          type: GeometryType.MULTI_POLYGON,
          coordinates: [
            [
              [
                [100.0, 0.0],
                [101.0, 0.0],
                [101.0, 1.0],
                [100.0, 1.0],
                [100.0, 0.0],
              ],
            ],
            [
              [
                [102.0, 2.0],
                [103.0, 2.0],
                [103.0, 3.0],
                [102.0, 3.0],
                [102.0, 2.0],
              ],
            ],
          ],
        },
      ];

      const style: IVectorStyle = {
        fillColor: '#ff0000',
      };

      const stats = renderer.render(geometries, style);

      expect(stats.featuresRendered).toBe(1);
      expect(stats.polygonsRendered).toBe(1);
    });

    it('should render mixed geometries', () => {
      const geometries: IGeometry[] = [
        {
          type: GeometryType.POINT,
          coordinates: [100.0, 0.0],
        },
        {
          type: GeometryType.LINE,
          coordinates: [
            [100.0, 0.0],
            [101.0, 1.0],
          ],
        },
        {
          type: GeometryType.POLYGON,
          coordinates: [
            [
              [100.0, 0.0],
              [101.0, 0.0],
              [101.0, 1.0],
              [100.0, 1.0],
              [100.0, 0.0],
            ],
          ],
        },
      ];

      const style: IVectorStyle = {};

      const stats = renderer.render(geometries, style);

      expect(stats.featuresRendered).toBe(3);
      expect(stats.pointsRendered).toBe(1);
      expect(stats.linesRendered).toBe(1);
      expect(stats.polygonsRendered).toBe(1);
    });

    it('should handle empty geometry array', () => {
      const geometries: IGeometry[] = [];
      const style: IVectorStyle = {};

      const stats = renderer.render(geometries, style);

      expect(stats.featuresRendered).toBe(0);
      expect(stats.pointsRendered).toBe(0);
      expect(stats.linesRendered).toBe(0);
      expect(stats.polygonsRendered).toBe(0);
    });

    it('should enable blending', () => {
      const geometries: IGeometry[] = [
        {
          type: GeometryType.POINT,
          coordinates: [100.0, 0.0],
        },
      ];

      const style: IVectorStyle = {};

      renderer.render(geometries, style);

      expect(mockGL.enable).toHaveBeenCalledWith(mockGL.BLEND);
      expect(mockGL.blendFunc).toHaveBeenCalledWith(mockGL.SRC_ALPHA, mockGL.ONE_MINUS_SRC_ALPHA);
    });
  });

  describe('setResolution', () => {
    it('should set resolution', () => {
      renderer.setResolution(1024, 768);

      const geometries: IGeometry[] = [
        {
          type: GeometryType.POINT,
          coordinates: [100.0, 0.0],
        },
      ];

      const style: IVectorStyle = {};

      renderer.render(geometries, style);

      expect(mockGL.uniform2f).toHaveBeenCalled();
    });
  });

  describe('dispose', () => {
    it('should dispose and clean up resources', () => {
      renderer.dispose();

      expect(mockGL.deleteProgram).toHaveBeenCalled();
    });

    it('should not throw error when disposing twice', () => {
      renderer.dispose();

      expect(() => renderer.dispose()).not.toThrow();
    });
  });
});
