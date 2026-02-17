import { describe, it, expect } from 'vitest';
import { MVTParser } from '../../src/vectors/MVTParser.js';
import { GeometryType } from '../../src/vectortypes.js';

describe('MVTParser', () => {
  describe('parse', () => {
    it('should parse point geometry', () => {
      const mvtData = {
        layers: [
          {
            name: 'layer1',
            extent: 4096,
            features: [
              {
                id: 1,
                type: 1, // POINT
                geometry: [9, 50, 34], // MoveTo, x=25, y=17
                properties: { name: 'test' },
              },
            ],
          },
        ],
      };

      const features = MVTParser.parse(mvtData);

      expect(features).toHaveLength(1);
      expect(features[0].id).toBe(1);
      expect(features[0].geometry.type).toBe(GeometryType.POINT);
      expect(features[0].properties).toEqual({ name: 'test' });
    });

    it('should parse multipoint geometry', () => {
      const mvtData = {
        layers: [
          {
            name: 'layer1',
            extent: 4096,
            features: [
              {
                id: 1,
                type: 1, // POINT
                geometry: [17, 50, 34, 2, 34], // MoveTo(2), (25,17), (17,17)
                properties: {},
              },
            ],
          },
        ],
      };

      const features = MVTParser.parse(mvtData);

      expect(features).toHaveLength(1);
      expect(features[0].geometry.type).toBe(GeometryType.MULTI_POINT);
    });

    it('should parse linestring geometry', () => {
      const mvtData = {
        layers: [
          {
            name: 'layer1',
            extent: 4096,
            features: [
              {
                id: 1,
                type: 2, // LINESTRING
                geometry: [9, 50, 34, 18, 2, 34], // MoveTo, LineTo(2)
                properties: {},
              },
            ],
          },
        ],
      };

      const features = MVTParser.parse(mvtData);

      expect(features).toHaveLength(1);
      expect(features[0].geometry.type).toBe(GeometryType.LINE);
    });

    it('should parse polygon geometry', () => {
      const mvtData = {
        layers: [
          {
            name: 'layer1',
            extent: 4096,
            features: [
              {
                id: 1,
                type: 3, // POLYGON
                geometry: [9, 50, 34, 26, 20, 2, 34, 26, 18, 10, 34, 15], // MoveTo, LineTo, ClosePath
                properties: {},
              },
            ],
          },
        ],
      };

      const features = MVTParser.parse(mvtData);

      expect(features).toHaveLength(1);
      expect(features[0].geometry.type).toBe(GeometryType.POLYGON);
    });

    it('should parse multiple layers', () => {
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

      const features = MVTParser.parse(mvtData);

      expect(features).toHaveLength(2);
      expect(features[0].id).toBe(1);
      expect(features[1].id).toBe(2);
    });

    it('should parse specific layer by name', () => {
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

      const features = MVTParser.parse(mvtData, 'layer2');

      expect(features).toHaveLength(1);
      expect(features[0].id).toBe(2);
    });

    it('should throw error for unknown geometry type', () => {
      const mvtData = {
        layers: [
          {
            name: 'layer1',
            extent: 4096,
            features: [
              {
                id: 1,
                type: 0, // UNKNOWN
                geometry: [],
                properties: {},
              },
            ],
          },
        ],
      };

      expect(() => MVTParser.parse(mvtData)).toThrow();
    });

    it('should handle empty layers array', () => {
      const mvtData = {
        layers: [],
      };

      const features = MVTParser.parse(mvtData);

      expect(features).toHaveLength(0);
    });

    it('should handle layer with no features', () => {
      const mvtData = {
        layers: [
          {
            name: 'layer1',
            extent: 4096,
            features: [],
          },
        ],
      };

      const features = MVTParser.parse(mvtData);

      expect(features).toHaveLength(0);
    });
  });

  describe('zigzagDecode', () => {
    it('should decode positive values', () => {
      const parser = MVTParser as any;
      expect(parser.zigzagDecode(0)).toBe(0);
      expect(parser.zigzagDecode(2)).toBe(1);
      expect(parser.zigzagDecode(4)).toBe(2);
    });

    it('should decode negative values', () => {
      const parser = MVTParser as any;
      expect(parser.zigzagDecode(1)).toBe(-1);
      expect(parser.zigzagDecode(3)).toBe(-2);
      expect(parser.zigzagDecode(5)).toBe(-3);
    });
  });
});
