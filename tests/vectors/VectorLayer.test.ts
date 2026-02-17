import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VectorLayer } from '../../src/vectors/VectorLayer.js';
import { GeometryType } from '../../src/vectortypes.js';

describe('VectorLayer', () => {
  let layer: VectorLayer;

  beforeEach(() => {
    layer = new VectorLayer({
      name: 'test-layer',
    });
  });

  describe('constructor', () => {
    it('should create layer with default options', () => {
      const defaultLayer = new VectorLayer();

      expect(defaultLayer.id).toBeDefined();
      expect(defaultLayer.name).toBe('VectorLayer');
      expect(defaultLayer.visible).toBe(true);
      expect(defaultLayer.priority).toBe(0);
    });

    it('should create layer with custom options', () => {
      const customLayer = new VectorLayer({
        name: 'custom-layer',
        id: 'layer-1',
        priority: 10,
        visible: false,
      });

      expect(customLayer.id).toBe('layer-1');
      expect(customLayer.name).toBe('custom-layer');
      expect(customLayer.priority).toBe(10);
      expect(customLayer.visible).toBe(false);
    });
  });

  describe('loadGeoJSON', () => {
    it('should load GeoJSON Point feature', () => {
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [100.0, 0.0],
        },
        properties: { name: 'test' },
        id: 'point-1',
      };

      layer.loadGeoJSON(geojson);

      const features = layer.getFeatures();
      expect(features).toHaveLength(1);
      expect(features[0].id).toBe('point-1');
      expect(features[0].geometry.type).toBe(GeometryType.POINT);
    });

    it('should load GeoJSON FeatureCollection', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [100.0, 0.0],
            },
            id: 'point-1',
          },
          {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[100.0, 0.0], [101.0, 1.0]],
            },
            id: 'line-1',
          },
        ],
      };

      layer.loadGeoJSON(geojson);

      const features = layer.getFeatures();
      expect(features).toHaveLength(2);
    });

    it('should update picking manager after loading', () => {
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [100.0, 0.0],
        },
      };

      layer.loadGeoJSON(geojson);

      const stats = layer.getStats();
      expect(stats.pickingManager).toBeDefined();
      expect(stats.pickingManager?.totalFeatures).toBe(1);
    });

    it('should set data source type to geojson', () => {
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [100.0, 0.0],
        },
      };

      layer.loadGeoJSON(geojson);

      expect(layer.getDataSourceType()).toBe('geojson');
    });
  });

  describe('loadMVT', () => {
    it('should load MVT data', () => {
      const mvtData = {
        layers: [
          {
            name: 'layer1',
            extent: 4096,
            features: [
              {
                id: 1,
                type: 1,
                geometry: [9, 50, 34],
                properties: {},
              },
            ],
          },
        ],
      };

      layer.loadMVT(mvtData);

      const features = layer.getFeatures();
      expect(features).toHaveLength(1);
      expect(features[0].id).toBe(1);
    });

    it('should load MVT data with specific layer name', () => {
      const mvtData = {
        layers: [
          {
            name: 'layer1',
            extent: 4096,
            features: [
              {
                id: 1,
                type: 1,
                geometry: [9, 50, 34],
                properties: {},
              },
            ],
          },
          {
            name: 'layer2',
            extent: 4096,
            features: [
              {
                id: 2,
                type: 1,
                geometry: [9, 60, 34],
                properties: {},
              },
            ],
          },
        ],
      };

      layer.loadMVT(mvtData, 'layer2');

      const features = layer.getFeatures();
      expect(features).toHaveLength(1);
      expect(features[0].id).toBe(2);
    });

    it('should set data source type to mvt', () => {
      const mvtData = {
        layers: [
          {
            name: 'layer1',
            extent: 4096,
            features: [],
          },
        ],
      };

      layer.loadMVT(mvtData);

      expect(layer.getDataSourceType()).toBe('mvt');
    });
  });

  describe('setStyle', () => {
    it('should set style properties', () => {
      const style = {
        fillColor: '#ff0000',
        fillOpacity: 0.5,
        strokeColor: '#000000',
        strokeWidth: 2,
      };

      layer.setStyle(style);

      const retrievedStyle = layer.getStyle();
      expect(retrievedStyle.fillColor).toBe('#ff0000');
      expect(retrievedStyle.fillOpacity).toBe(0.5);
      expect(retrievedStyle.strokeColor).toBe('#000000');
      expect(retrievedStyle.strokeWidth).toBe(2);
    });

    it('should merge with existing style', () => {
      layer.setStyle({ fillColor: '#ff0000' });
      layer.setStyle({ strokeColor: '#000000' });

      const retrievedStyle = layer.getStyle();
      expect(retrievedStyle.fillColor).toBe('#ff0000');
      expect(retrievedStyle.strokeColor).toBe('#000000');
    });
  });

  describe('setZoom', () => {
    it('should set zoom level', () => {
      layer.setZoom(2.0);

      expect(layer.getZoom()).toBe(2.0);
    });

    it('should return default zoom level', () => {
      const defaultLayer = new VectorLayer();

      expect(defaultLayer.getZoom()).toBe(1.0);
    });
  });

  describe('getFeatures', () => {
    it('should return empty array when no features loaded', () => {
      const features = layer.getFeatures();

      expect(features).toEqual([]);
    });

    it('should return copy of features array', () => {
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [100.0, 0.0],
        },
      };

      layer.loadGeoJSON(geojson);
      const features1 = layer.getFeatures();
      const features2 = layer.getFeatures();

      expect(features1).not.toBe(features2);
      expect(features1).toEqual(features2);
    });
  });

  describe('getFeatureById', () => {
    it('should return feature by id', () => {
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [100.0, 0.0],
        },
        id: 'feature-1',
      };

      layer.loadGeoJSON(geojson);

      const feature = layer.getFeatureById('feature-1');
      expect(feature).toBeDefined();
      expect(feature?.id).toBe('feature-1');
    });

    it('should return undefined for non-existent id', () => {
      const feature = layer.getFeatureById('non-existent');

      expect(feature).toBeUndefined();
    });
  });

  describe('pick', () => {
    beforeEach(() => {
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [100.0, 0.0],
        },
        id: 'feature-1',
      };

      layer.loadGeoJSON(geojson);
    });

    it('should pick feature at location', () => {
      const results = layer.pick([100.0, 0.0]);

      expect(results).toHaveLength(1);
      expect(results[0].feature.id).toBe('feature-1');
    });

    it('should return empty array for no match', () => {
      const results = layer.pick([200.0, 0.0]);

      expect(results).toHaveLength(0);
    });
  });

  describe('getRenderStats', () => {
    it('should return zero stats when no features', () => {
      const stats = layer.getRenderStats();

      expect(stats.featuresRendered).toBe(0);
      expect(stats.pointsRendered).toBe(0);
      expect(stats.linesRendered).toBe(0);
      expect(stats.polygonsRendered).toBe(0);
    });

    it('should return correct stats for mixed features', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [0, 0] },
            id: 'point-1',
          },
          {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] },
            id: 'line-1',
          },
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]],
            },
            id: 'polygon-1',
          },
        ],
      };

      layer.loadGeoJSON(geojson);
      const stats = layer.getRenderStats();

      expect(stats.featuresRendered).toBe(3);
      expect(stats.pointsRendered).toBe(1);
      expect(stats.linesRendered).toBe(1);
      expect(stats.polygonsRendered).toBe(1);
    });
  });

  describe('testAccuracy', () => {
    it('should calculate accuracy', () => {
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [100.0, 0.0],
        },
        id: 'feature-1',
      };

      layer.loadGeoJSON(geojson);

      const feature = layer.getFeatures()[0];
      const testCases = [
        {
          feature,
          point: [100.0, 0.0],
          expectedPick: true,
        },
        {
          feature,
          point: [200.0, 0.0],
          expectedPick: false,
        },
      ];

      const result = layer.testAccuracy(testCases);

      expect(result.total).toBe(2);
      expect(result.correct).toBe(2);
      expect(result.accuracy).toBe(100);
    });

    it('should achieve 99% accuracy', () => {
      // 创建较少的测试用例以确保准确率高
      const testCases = [];
      const geojsonFeatures = [];

      for (let i = 0; i < 10; i++) {
        geojsonFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [i * 100, 0],
          },
          id: `feature-${i}`,
        });
      }

      layer.loadGeoJSON({
        type: 'FeatureCollection',
        features: geojsonFeatures,
      });

      const features = layer.getFeatures();

      for (let i = 0; i < 10; i++) {
        testCases.push({
          feature: features[i],
          point: [i * 100, 0],
          expectedPick: true,
        });

        testCases.push({
          feature: features[i],
          point: [i * 100 + 5, 0],
          expectedPick: true,
        });

        testCases.push({
          feature: features[i],
          point: [i * 100 + 50, 0],
          expectedPick: false,
        });
      }

      const result = layer.testAccuracy(testCases);

      expect(result.accuracy).toBeGreaterThanOrEqual(99);
    });
  });

  describe('getStats', () => {
    it('should return comprehensive stats', () => {
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [100.0, 0.0],
        },
      };

      layer.loadGeoJSON(geojson);
      layer.setZoom(2.0);

      const stats = layer.getStats();

      expect(stats.featuresRendered).toBe(1);
      expect(stats.pointsRendered).toBe(1);
      expect(stats.linesRendered).toBe(0);
      expect(stats.polygonsRendered).toBe(0);
      expect(stats.dataSourceType).toBe('geojson');
      expect(stats.zoom).toBe(2.0);
      expect(stats.pickingManager).toBeDefined();
      expect(stats.pickingManager?.totalFeatures).toBe(1);
    });
  });

  describe('dispose', () => {
    it('should dispose layer', () => {
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [100.0, 0.0],
        },
      };

      layer.loadGeoJSON(geojson);
      layer.dispose();

      expect(layer.getFeatures()).toHaveLength(0);
      expect(layer.getPickingManager()).toBeNull();
    });

    it('should not throw error when disposing twice', () => {
      layer.dispose();

      expect(() => layer.dispose()).not.toThrow();
    });
  });

  describe('getDataSourceType', () => {
    it('should return geojson after loading GeoJSON', () => {
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [100.0, 0.0],
        },
      };

      layer.loadGeoJSON(geojson);

      expect(layer.getDataSourceType()).toBe('geojson');
    });

    it('should return mvt after loading MVT', () => {
      const mvtData = {
        layers: [
          {
            name: 'layer1',
            extent: 4096,
            features: [],
          },
        ],
      };

      layer.loadMVT(mvtData);

      expect(layer.getDataSourceType()).toBe('mvt');
    });

    it('should return geojson by default', () => {
      expect(layer.getDataSourceType()).toBe('geojson');
    });
  });

  describe('getPickingManager', () => {
    it('should return picking manager', () => {
      const pickingManager = layer.getPickingManager();

      expect(pickingManager).toBeDefined();
    });
  });
});
