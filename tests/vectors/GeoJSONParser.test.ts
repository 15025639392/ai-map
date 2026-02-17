import { describe, it, expect, beforeEach } from 'vitest';
import { GeoJSONParser } from '../../src/vectors/GeoJSONParser.js';
import { GeometryType } from '../../src/vectortypes.js';

describe('GeoJSONParser', () => {
  describe('parse', () => {
    it('should parse a Point feature', () => {
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [100.0, 0.0],
        },
        properties: { name: 'test' },
        id: 'point-1',
      };

      const features = GeoJSONParser.parse(geojson);

      expect(features).toHaveLength(1);
      expect(features[0].id).toBe('point-1');
      expect(features[0].geometry.type).toBe(GeometryType.POINT);
      expect(features[0].geometry.coordinates).toEqual([100.0, 0.0]);
      expect(features[0].properties).toEqual({ name: 'test' });
    });

    it('should parse a MultiPoint feature', () => {
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'MultiPoint',
          coordinates: [[100.0, 0.0], [101.0, 1.0]],
        },
      };

      const features = GeoJSONParser.parse(geojson);

      expect(features).toHaveLength(1);
      expect(features[0].geometry.type).toBe(GeometryType.MULTI_POINT);
      expect(features[0].geometry.coordinates).toEqual([[100.0, 0.0], [101.0, 1.0]]);
    });

    it('should parse a LineString feature', () => {
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [[100.0, 0.0], [101.0, 1.0], [102.0, 2.0]],
        },
      };

      const features = GeoJSONParser.parse(geojson);

      expect(features).toHaveLength(1);
      expect(features[0].geometry.type).toBe(GeometryType.LINE);
      expect(features[0].geometry.coordinates).toEqual([
        [100.0, 0.0],
        [101.0, 1.0],
        [102.0, 2.0],
      ]);
    });

    it('should parse a MultiLineString feature', () => {
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'MultiLineString',
          coordinates: [
            [[100.0, 0.0], [101.0, 1.0]],
            [[102.0, 2.0], [103.0, 3.0]],
          ],
        },
      };

      const features = GeoJSONParser.parse(geojson);

      expect(features).toHaveLength(1);
      expect(features[0].geometry.type).toBe(GeometryType.MULTI_LINE);
    });

    it('should parse a Polygon feature', () => {
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
          ],
        },
      };

      const features = GeoJSONParser.parse(geojson);

      expect(features).toHaveLength(1);
      expect(features[0].geometry.type).toBe(GeometryType.POLYGON);
    });

    it('should parse a MultiPolygon feature', () => {
      const geojson = {
        type: 'Feature',
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [
              [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
            ],
            [
              [[102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0]],
            ],
          ],
        },
      };

      const features = GeoJSONParser.parse(geojson);

      expect(features).toHaveLength(1);
      expect(features[0].geometry.type).toBe(GeometryType.MULTI_POLYGON);
    });

    it('should parse a FeatureCollection', () => {
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

      const features = GeoJSONParser.parse(geojson);

      expect(features).toHaveLength(2);
      expect(features[0].id).toBe('point-1');
      expect(features[1].id).toBe('line-1');
    });

    it('should throw error for unsupported GeoJSON type', () => {
      const geojson: any = {
        type: 'GeometryCollection',
        geometries: [],
      };

      expect(() => GeoJSONParser.parse(geojson)).toThrow();
    });

    it('should filter features without geometry', () => {
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
            id: 'no-geometry',
          },
        ],
      };

      const features = GeoJSONParser.parse(geojson);

      expect(features).toHaveLength(1);
      expect(features[0].id).toBe('point-1');
    });
  });

  describe('getBounds', () => {
    it('should calculate bounds for point geometry', () => {
      const geometry = {
        type: GeometryType.POINT,
        coordinates: [100.0, 0.0],
      };

      const bounds = GeoJSONParser.getBounds(geometry);

      expect(bounds).toEqual([[100.0, 0.0], [100.0, 0.0]]);
    });

    it('should calculate bounds for line geometry', () => {
      const geometry = {
        type: GeometryType.LINE,
        coordinates: [
          [100.0, 0.0],
          [101.0, 1.0],
          [102.0, 2.0],
        ],
      };

      const bounds = GeoJSONParser.getBounds(geometry);

      expect(bounds).toEqual([[100.0, 0.0], [102.0, 2.0]]);
    });

    it('should calculate bounds for polygon geometry', () => {
      const geometry = {
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
      };

      const bounds = GeoJSONParser.getBounds(geometry);

      expect(bounds).toEqual([[100.0, 0.0], [101.0, 1.0]]);
    });
  });

  describe('getFeatureBounds', () => {
    it('should calculate bounds for feature', () => {
      const feature = {
        id: 'feature-1',
        geometry: {
          type: GeometryType.POINT,
          coordinates: [100.0, 0.0],
        },
      };

      const bounds = GeoJSONParser.getFeatureBounds(feature);

      expect(bounds).toEqual([[100.0, 0.0], [100.0, 0.0]]);
    });
  });
});
