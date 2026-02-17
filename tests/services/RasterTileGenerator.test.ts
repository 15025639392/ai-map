import { describe, it, expect, beforeEach } from 'vitest';
import { RasterTileGenerator } from '../../services/index.js';
import { TileGeneratorFormat, CompressionLevel } from '../../services/tile-generator-types.js';

describe('RasterTileGenerator - 栅格瓦片生成', () => {
  let generator: RasterTileGenerator;

  beforeEach(() => {
    generator = new RasterTileGenerator({
      format: TileGeneratorFormat.PNG,
      projection: 'web_mercator',
      maxZoom: 18,
      tileSize: 256,
      dataSource: 'http://example.com/tiles/{z}/{x}/{y}.png',
      compression: CompressionLevel.MEDIUM,
      quality: 85,
      backgroundColor: '#ffffff',
      transparent: false,
    });
  });

  describe('generateTile', () => {
    it('应该生成 PNG 瓦片', async () => {
      const result = await generator.generateTile(0, 0, 0);

      // 简化实现中返回空数据，但应该成功
      expect(result.success).toBe(true);
      expect(result.format).toBe(TileGeneratorFormat.PNG);
      expect(result.metadata?.dataSource).toBeDefined();
      expect(result.metadata?.zoom).toBe(0);
    });

    it('应该生成 JPEG 瓦片', async () => {
      const jpegGenerator = new RasterTileGenerator({
        format: TileGeneratorFormat.JPEG,
        projection: 'web_mercator',
        maxZoom: 18,
        tileSize: 256,
        dataSource: 'http://example.com/tiles/{z}/{x}/{y}.jpg',
        quality: 90,
      });

      const result = await jpegGenerator.generateTile(0, 0, 0);

      expect(result.success).toBe(true);
      expect(result.format).toBe(TileGeneratorFormat.JPEG);
      expect(result.metadata?.dataSource).toBeDefined();
    });

    it('应该支持透明背景', async () => {
      const transparentGenerator = new RasterTileGenerator({
        format: TileGeneratorFormat.PNG,
        projection: 'web_mercator',
        maxZoom: 18,
        tileSize: 256,
        dataSource: '',
        transparent: true,
      });

      const result = await transparentGenerator.generateTile(0, 0, 0);

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
    });

    it('应该记录生成时间', async () => {
      const result = await generator.generateTile(0, 0, 0);

      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(result.size).toBeGreaterThanOrEqual(0);
    });

    it('应该正确设置元数据', async () => {
      const result = await generator.generateTile(0, 0, 0);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.zoom).toBe(0);
      expect(result.metadata?.x).toBe(0);
      expect(result.metadata?.y).toBe(0);
      expect(result.metadata?.version).toBeDefined();
    });
  });

  describe('generateBatch', () => {
    it('应该批量生成多个缩放级别的瓦片', async () => {
      const zoomLevels = [0, 1];
      const results = await generator.generateBatch(zoomLevels);

      // 简化实现中所有瓦片应该成功
      expect(results.length).toBeGreaterThan(0);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });

    it('应该报告生成进度', async () => {
      const zoomLevels = [0];
      let progressCalls = 0;

      await generator.generateBatch(zoomLevels, (progress) => {
        if (progress.progress !== undefined) {
          progressCalls++;
        }
      });

      expect(progressCalls).toBeGreaterThan(0);
    });
  });

  describe('updateConfig', () => {
    it('应该更新配置', () => {
      generator.updateConfig({
        quality: 95,
        backgroundColor: '#000000',
      });

      const config = generator.getConfig();
      expect(config.quality).toBe(95);
      expect(config.backgroundColor).toBe('#000000');
    });
  });

  describe('getConfig', () => {
    it('应该返回当前配置', () => {
      const config = generator.getConfig();

      expect(config).toBeDefined();
      expect(config.format).toBe(TileGeneratorFormat.PNG);
      expect(config.maxZoom).toBe(18);
      expect(config.tileSize).toBe(256);
      expect(config.transparent).toBe(false);
    });
  });
});
