import { describe, it, expect, vi } from 'vitest';
import { TileGeneratorService } from '../../services/index.js';
import { TileGeneratorFormat } from '../../services/tile-generator-types.js';

describe('TileGeneratorService - MVT瓦片生成', () => {
  let service: TileGeneratorService;

  beforeEach(() => {
    service = new TileGeneratorService({
      format: TileGeneratorFormat.MVT,
      projection: 'web_mercator',
      maxZoom: 18,
      tileSize: 4096,
      layers: ['layer1', 'layer2'],
      maxFeaturesPerLayer: 10000,
      simplifyGeometry: true,
      simplifyTolerance: 0.0001,
      enableGzip: true,
    });
  });

  describe('generateTile', () => {
    it('应该生成 MVT 瓦片', async () => {
      const geojsonData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [0, 0],
            },
            properties: { name: 'point1' },
          },
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [
                [0, 0],
                [1, 1],
              ],
            },
            properties: { name: 'line1' },
          },
        ],
      };

      const result = await service.generateTile(0, 0, 0, geojsonData);

      expect(result.success).toBe(true);
      expect(result.format).toBe(TileGeneratorFormat.MVT);
      expect(result.metadata?.featureCount).toBeGreaterThan(0);
      expect(result.metadata?.layerCount).toBe(2);
    });

    it('应该处理无效 GeoJSON', async () => {
      const result = await service.generateTile(0, 0, 0, {
        type: 'FeatureCollection',
        features: [],
      } as any);

      expect(result.success).toBe(true);
    });

    it('应该返回生成时间', async () => {
      const geojsonData = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [0, 0],
            },
          },
        ],
      };

      const result = await service.generateTile(0, 0, 0, geojsonData);

      expect(result.duration).toBeGreaterThan(0);
      expect(result.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('generateBatch', () => {
    it('应该批量生成多个缩放级别的瓦片', async () => {
      const geojsonData = {
        type: 'FeatureCollection',
        features: [],
      } as any;

      const zoomLevels = [0, 1, 2];
      const results = await service.generateBatch(zoomLevels, geojsonData);

      expect(results.length).toBeGreaterThan(0);
      results.forEach((result) => {
        expect(result.success).toBe(true);
        expect(result.format).toBe(TileGeneratorFormat.MVT);
      });
    });

    it('应该报告生成进度', async () => {
      const geojsonData = {
        type: 'FeatureCollection',
        features: [],
      } as any;

      const zoomLevels = [0, 1];
      let progressCalls = 0;

      await service.generateBatch(zoomLevels, geojsonData, (progress) => {
        progressCalls++;
        // progress.progress 应该有值
        if (progress.progress !== undefined) {
          expect(progress.progress).toBeGreaterThanOrEqual(0);
        }
      });

      expect(progressCalls).toBeGreaterThan(0);
    });
  });

  describe('updateConfig', () => {
    it('应该更新配置', () => {
      const newConfig = {
        maxFeaturesPerLayer: 20000,
        simplifyTolerance: 0.0002,
      };

      service.updateConfig(newConfig);

      const config = service.getConfig();
      expect(config.maxFeaturesPerLayer).toBe(20000);
      expect(config.simplifyTolerance).toBe(0.0002);
    });
  });

  describe('getConfig', () => {
    it('应该返回当前配置', () => {
      const config = service.getConfig();

      expect(config).toBeDefined();
      expect(config.format).toBe(TileGeneratorFormat.MVT);
      expect(config.maxZoom).toBe(18);
      expect(config.tileSize).toBe(4096);
      expect(config.layers).toEqual(['layer1', 'layer2']);
    });
  });
});
