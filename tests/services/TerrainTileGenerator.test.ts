import { describe, it, expect, beforeEach } from 'vitest';
import { TerrainTileGenerator } from '../../services/index.js';
import { TileGeneratorFormat } from '../../services/tile-generator-types.js';

describe('TerrainTileGenerator - 地形瓦片生成', () => {
  let generator: TerrainTileGenerator;

  beforeEach(() => {
    generator = new TerrainTileGenerator({
      format: TileGeneratorFormat.PNG,
      projection: 'web_mercator',
      maxZoom: 18,
      tileSize: 256,
      elevationSource: new Float32Array(256 * 256),
      elevationRange: { min: 0, max: 5000 },
      generateSlope: false,
      generateAspect: false,
      colorGradient: {
        low: '#0066cc',
        high: '#ffffcc',
      },
    });
  });

  describe('generateTile', () => {
    it('应该生成高程图瓦片', async () => {
      const result = await generator.generateTile(0, 0, 0);

      expect(result.success).toBe(true);
      expect(result.format).toBe(TileGeneratorFormat.PNG);
      expect(result.metadata?.dataSource).toBe('internal');
    });

    it('应该生成坡度图瓦片', async () => {
      const slopeGenerator = new TerrainTileGenerator({
        format: TileGeneratorFormat.PNG,
        projection: 'web_mercator',
        maxZoom: 18,
        tileSize: 256,
        elevationSource: new Float32Array(256 * 256),
        generateSlope: true,
        generateAspect: false,
      });

      const result = await slopeGenerator.generateTile(0, 0, 0);

      expect(result.success).toBe(true);
    });

    it('应该生成坡向图瓦片', async () => {
      const aspectGenerator = new TerrainTileGenerator({
        format: TileGeneratorFormat.PNG,
        projection: 'web_mercator',
        maxZoom: 18,
        tileSize: 256,
        elevationSource: new Float32Array(256 * 256),
        generateSlope: false,
        generateAspect: true,
      });

      const result = await aspectGenerator.generateTile(0, 0, 0);

      expect(result.success).toBe(true);
    });

    it('应该使用自定义颜色渐变', async () => {
      const customGenerator = new TerrainTileGenerator({
        format: TileGeneratorFormat.PNG,
        projection: 'web_mercator',
        maxZoom: 18,
        tileSize: 256,
        elevationSource: new Float32Array(256 * 256),
        colorGradient: {
          low: '#ff0000',
          high: '#00ff00',
        },
      });

      const result = await customGenerator.generateTile(0, 0, 0);

      expect(result.success).toBe(true);
    });

    it('应该正确设置元数据', async () => {
      const result = await generator.generateTile(10, 20, 5);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.zoom).toBe(5);
      expect(result.metadata?.x).toBe(10);
      expect(result.metadata?.y).toBe(20);
      expect(result.metadata?.version).toBeDefined();
    });
  });

  describe('generateBatch', () => {
    it('应该批量生成多个缩放级别的瓦片', async () => {
      const zoomLevels = [0, 1, 2];
      const results = await generator.generateBatch(zoomLevels);

      expect(results.length).toBeGreaterThan(0);
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });

    it('应该报告生成进度', async () => {
      const zoomLevels = [0, 1];
      let progressCalls = 0;

      await generator.generateBatch(zoomLevels, (current, total) => {
        progressCalls++;
      });

      expect(progressCalls).toBeGreaterThan(0);
    });
  });

  describe('updateConfig', () => {
    it('应该更新配置', () => {
      generator.updateConfig({
        elevationRange: { min: 100, max: 3000 },
        generateSlope: true,
      });

      const config = generator.getConfig();
      expect(config.elevationRange?.min).toBe(100);
      expect(config.elevationRange?.max).toBe(3000);
      expect(config.generateSlope).toBe(true);
    });
  });

  describe('getConfig', () => {
    it('应该返回当前配置', () => {
      const config = generator.getConfig();

      expect(config).toBeDefined();
      expect(config.format).toBe(TileGeneratorFormat.PNG);
      expect(config.maxZoom).toBe(18);
      expect(config.tileSize).toBe(256);
    });
  });
});
