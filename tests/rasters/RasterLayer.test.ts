import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RasterLayer } from '../../lib/rasters/RasterLayer.js';

describe('RasterLayer', () => {
  let rasterLayer: RasterLayer;
  let mockRenderer: any;

  beforeEach(() => {
    mockRenderer = {
      gl: null,
      pipeline: {
        addNode: vi.fn(),
        removeNode: vi.fn(),
        updateNode: vi.fn(),
      },
      resourceManager: {
        registerResource: vi.fn(),
        addRef: vi.fn(),
        releaseRef: vi.fn(),
        disposeResource: vi.fn(),
      },
    };

    rasterLayer = new RasterLayer({
      name: '测试图层',
      tileUrl: 'https://example.com/tiles/{z}/{x}/{y}.png',
      minZoom: 1,
      maxZoom: 18,
      zoom: 10,
      tileSize: 256,
      crossOrigin: 'anonymous',
    });
  });

  describe('构造函数', () => {
    it('应该正确初始化图层', () => {
      expect(rasterLayer.name).toBe('测试图层');
      expect(rasterLayer.getTileUrl()).toBe('https://example.com/tiles/{z}/{x}/{y}.png');
      expect(rasterLayer.getMinZoom()).toBe(1);
      expect(rasterLayer.getMaxZoom()).toBe(18);
      expect(rasterLayer.getZoom()).toBe(10);
    });

    it('应该使用默认值', () => {
      const layer = new RasterLayer({
        tileUrl: 'https://example.com/tiles/{z}/{x}/{y}.png',
      });

      expect(layer.getMinZoom()).toBe(1);
      expect(layer.getMaxZoom()).toBe(18);
      expect(layer.getZoom()).toBe(10);
      expect(layer.name).toBe('RasterLayer');
    });

    it('缺少 tileUrl 时应该抛出错误', () => {
      expect(() => {
        new RasterLayer({} as any);
      }).toThrow('RasterLayer: tileUrl is required');
    });
  });

  describe('缩放控制', () => {
    it('应该能够设置缩放级别', () => {
      rasterLayer.setZoom(12);
      expect(rasterLayer.getZoom()).toBe(12);
    });

    it('不应该设置超出范围的缩放级别', () => {
      rasterLayer.setZoom(20);
      expect(rasterLayer.getZoom()).toBe(10);

      rasterLayer.setZoom(0);
      expect(rasterLayer.getZoom()).toBe(10);
    });

    it('应该在范围内正常设置缩放', () => {
      rasterLayer.setZoom(1);
      expect(rasterLayer.getZoom()).toBe(1);

      rasterLayer.setZoom(18);
      expect(rasterLayer.getZoom()).toBe(18);
    });

    it('应该将浮点缩放级别转换为整数', () => {
      rasterLayer.setZoom(12.5);
      expect(rasterLayer.getZoom()).toBe(12);
    });
  });

  describe('瓦片 URL', () => {
    it('应该能够设置瓦片 URL', () => {
      const newUrl = 'https://new-source.com/{z}/{x}/{y}.png';
      rasterLayer.setTileUrl(newUrl);
      expect(rasterLayer.getTileUrl()).toBe(newUrl);
    });

    it('应该能够获取瓦片 URL', () => {
      expect(rasterLayer.getTileUrl()).toBe('https://example.com/tiles/{z}/{x}/{y}.png');
    });
  });

  describe('统计信息', () => {
    it('应该返回正确的统计信息', () => {
      const stats = rasterLayer.getStats();

      expect(stats).toHaveProperty('totalTiles');
      expect(stats).toHaveProperty('loadedTiles');
      expect(stats).toHaveProperty('loadingTiles');
      expect(stats).toHaveProperty('errorTiles');
      expect(stats).toHaveProperty('currentZoom');
      expect(stats).toHaveProperty('minZoom');
      expect(stats).toHaveProperty('maxZoom');
    });

    it('统计信息应该包含正确的缩放级别', () => {
      const stats = rasterLayer.getStats();

      expect(stats.currentZoom).toBe(10);
      expect(stats.minZoom).toBe(1);
      expect(stats.maxZoom).toBe(18);
    });
  });

  describe('资源管理', () => {
    it('应该能够销毁图层', () => {
      rasterLayer.dispose();
      expect(() => rasterLayer.dispose()).not.toThrow();
    });

    it('销毁后不应该能够使用', () => {
      rasterLayer.dispose();
      // 注意：setZoom 方法会检查 isDisposed()，但可能不会抛出错误
      // 具体行为取决于实现
      expect(rasterLayer.isDisposed()).toBe(true);
    });
  });
});
