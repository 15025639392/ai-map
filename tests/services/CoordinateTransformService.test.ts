import { describe, it, expect } from 'vitest';
import { CoordinateTransformService, CoordinateSystem } from '../../services/index.js';

describe('CoordinateTransformService', () => {
  describe('WGS84 to Web Mercator', () => {
    it('应该正确转换零点 (0, 0)', () => {
      const [lon, lat] = [0, 0];
      const [x, y] = CoordinateTransformService.wgs84ToWebMercator(lon, lat);
      // 在零点，Web Mercator 坐标应该是 (0, 0)
      expect(Math.abs(x)).toBeLessThan(0.01);
      expect(Math.abs(y)).toBeLessThan(0.01);
    });

    it('应该正确转换北京天安门 (116.397128, 39.916527)', () => {
      const [lon, lat] = [116.397128, 39.916527];
      const [x, y] = CoordinateTransformService.wgs84ToWebMercator(lon, lat);

      // 预期值基于标准投影公式计算
      const expectedX = 12957298.92;
      const expectedY = 4856547.56;

      // 使用相对误差而不是绝对误差
      const relErrorX = Math.abs((x - expectedX) / expectedX);
      const relErrorY = Math.abs((y - expectedY) / expectedY);

      expect(relErrorX).toBeLessThan(0.001); // 相对误差 < 0.1%
      expect(relErrorY).toBeLessThan(0.001);
    });

    it('应该正确转换纽约 (-74.006, 40.7128)', () => {
      const [lon, lat] = [-74.006, 40.7128];
      const [x, y] = CoordinateTransformService.wgs84ToWebMercator(lon, lat);

      const expectedX = -8238029.53;
      const expectedY = 4970352.29;

      // 使用相对误差
      const relErrorX = Math.abs((x - expectedX) / expectedX);
      const relErrorY = Math.abs((y - expectedY) / expectedY);

      expect(relErrorX).toBeLessThan(0.001);
      expect(relErrorY).toBeLessThan(0.001);
    });

    it('应该拒绝超出范围的纬度', () => {
      expect(() => {
        CoordinateTransformService.wgs84ToWebMercator(0, 90);
      }).toThrow('纬度超出有效范围');
    });

    it('应该拒绝超出范围的经度', () => {
      expect(() => {
        CoordinateTransformService.wgs84ToWebMercator(181, 0);
      }).toThrow('经度超出有效范围');
    });
  });

  describe('Web Mercator to WGS84', () => {
    it('应该正确转换零点 (0, 0)', () => {
      const [x, y] = [0, 0];
      const [lon, lat] = CoordinateTransformService.webMercatorToWgs84(x, y);
      expect(Math.abs(lon)).toBeLessThan(0.01);
      expect(Math.abs(lat)).toBeLessThan(0.01);
    });

    it('应该正确转换北京天安门', () => {
      const [x, y] = [12957298.92, 4856547.56];
      const [lon, lat] = CoordinateTransformService.webMercatorToWgs84(x, y);

      const expectedLon = 116.397128;
      const expectedLat = 39.916527;

      // 使用相对误差
      const relErrorLon = Math.abs((lon - expectedLon) / expectedLon);
      const relErrorLat = Math.abs((lat - expectedLat) / expectedLat);

      expect(relErrorLon).toBeLessThan(0.001);
      expect(relErrorLat).toBeLessThan(0.001);
    });

    it('应该正确转换纽约', () => {
      const [x, y] = [-8238029.53, 4970352.29];
      const [lon, lat] = CoordinateTransformService.webMercatorToWgs84(x, y);

      const expectedLon = -74.006;
      const expectedLat = 40.7128;

      // 使用相对误差
      const relErrorLon = Math.abs((lon - expectedLon) / expectedLon);
      const relErrorLat = Math.abs((lat - expectedLat) / expectedLat);

      expect(relErrorLon).toBeLessThan(0.001);
      expect(relErrorLat).toBeLessThan(0.001);
    });
  });

  describe('双向转换精度验证', () => {
    it('应该在北京天安门前端满足 P99 误差 <= 2m', () => {
      const testPoints: [number, number][] = [
        [116.397128, 39.916527], // 北京天安门
        [116.404, 39.915], // 北京故宫附近
        [116.391, 39.907], // 北京天坛附近
        [116.408, 39.918], // 北京景山附近
        [116.395, 39.910], // 北京前门附近
      ];

      // 测试多个点以计算 P99
      for (const point of testPoints) {
        const error = CoordinateTransformService.calculateTransformationError(point, CoordinateSystem.WGS84);
        const errorInMeters = CoordinateTransformService.calculateErrorInMeters(error, point[1]);
        expect(errorInMeters).toBeLessThan(2);
      }
    });

    it('应该在纽约前端满足 P99 误差 <= 2m', () => {
      const testPoints: [number, number][] = [
        [-74.006, 40.7128], // 纽约
        [-74.0059, 40.7129], // 时代广场附近
        [-73.9855, 40.7489], // 中央公园附近
        [-74.0445, 40.6892], // 布鲁克林大桥附近
        [-73.9654, 40.7829], // 中央公园北部附近
      ];

      for (const point of testPoints) {
        const error = CoordinateTransformService.calculateTransformationError(point, CoordinateSystem.WGS84);
        const errorInMeters = CoordinateTransformService.calculateErrorInMeters(error, point[1]);
        expect(errorInMeters).toBeLessThan(2);
      }
    });

    it('validateP99Error 应该返回 P99 误差值', () => {
      // 生成100个测试点，分布在有效范围内
      const testPoints: [number, number][] = [];
      for (let i = 0; i < 100; i++) {
        const lon = (Math.random() - 0.5) * 360;
        const lat = (Math.random() - 0.5) * 170; // 限制在 [-85, 85] 范围内
        testPoints.push([lon, lat]);
      }

      const p99Error = CoordinateTransformService.validateP99Error(testPoints, CoordinateSystem.WGS84);

      // P99 误差应该 <= 2m
      expect(p99Error).toBeLessThan(2);
    });
  });

  describe('transformPoint', () => {
    it('应该正确转换单个点 WGS84 -> Web Mercator', () => {
      const point: [number, number] = [116.397128, 39.916527];
      const result = CoordinateTransformService.transformPoint(
        point,
        CoordinateSystem.WGS84,
        CoordinateSystem.WEB_MERCATOR
      );

      const expectedX = 12957298.92;
      const expectedY = 4856547.56;

      const relErrorX = Math.abs((result[0] - expectedX) / expectedX);
      const relErrorY = Math.abs((result[1] - expectedY) / expectedY);

      expect(relErrorX).toBeLessThan(0.001);
      expect(relErrorY).toBeLessThan(0.001);
    });

    it('相同坐标系转换应该返回相同值', () => {
      const point: [number, number] = [116.397128, 39.916527];
      const result = CoordinateTransformService.transformPoint(
        point,
        CoordinateSystem.WGS84,
        CoordinateSystem.WGS84
      );

      expect(result).toEqual(point);
    });

    it('应该拒绝无效的坐标', () => {
      expect(() => {
        CoordinateTransformService.transformPoint([999, 0], CoordinateSystem.WGS84, CoordinateSystem.WEB_MERCATOR);
      }).toThrow('经度超出范围');
    });
  });

  describe('transformCoordinates', () => {
    it('应该正确转换多个点', () => {
      const points: [number, number][] = [
        [0, 0],
        [116.397128, 39.916527],
        [-74.006, 40.7128],
      ];

      const result = CoordinateTransformService.transformCoordinates(
        points,
        CoordinateSystem.WGS84,
        CoordinateSystem.WEB_MERCATOR
      );

      expect(result.length).toBe(3);
      expect(Math.abs(result[0][0])).toBeLessThan(0.01);
      expect(Math.abs(result[0][1])).toBeLessThan(0.01);
    });
  });

  describe('transform', () => {
    it('应该返回成功的转换结果', () => {
      const point: [number, number] = [116.397128, 39.916527];
      const result = CoordinateTransformService.transform(
        point,
        CoordinateSystem.WGS84,
        CoordinateSystem.WEB_MERCATOR
      );

      expect(result.success).toBe(true);
      expect(result.coordinates).toBeDefined();
    });

    it('应该返回失败结果并包含错误信息', () => {
      const point: [number, number] = [999, 0];
      const result = CoordinateTransformService.transform(
        point,
        CoordinateSystem.WGS84,
        CoordinateSystem.WEB_MERCATOR
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('validateCoordinate', () => {
    it('应该验证有效的 WGS84 坐标', () => {
      const result = CoordinateTransformService.validateCoordinate(
        [116.397128, 39.916527],
        CoordinateSystem.WGS84
      );

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('应该拒绝无效的经度', () => {
      const result = CoordinateTransformService.validateCoordinate(
        [181, 0],
        CoordinateSystem.WGS84
      );

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('应该拒绝无效的纬度', () => {
      const result = CoordinateTransformService.validateCoordinate(
        [0, 91],
        CoordinateSystem.WGS84
      );

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('应该对接近极点的坐标发出警告', () => {
      const result = CoordinateTransformService.validateCoordinate(
        [0, 86],
        CoordinateSystem.WGS84
      );

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
});
