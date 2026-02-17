import { describe, it, expect } from 'vitest';
import {
  CoordinateTransformService,
  GeometryRepairService,
  CoordinateSystem,
  RepairType,
} from '../../services/index.js';
import type { Point } from '../../services/types.js';

describe('坐标转换与几何修复集成测试', () => {
  describe('端到端流程验证', () => {
    it('应该完成完整的转换-修复-反转换流程', () => {
      // 原始 WGS84 坐标（包含相邻重复顶点的简单多边形）
      const originalRing: Point[] = [
        [0, 0],
        [1, 0],
        [1, 1],
        [1, 1], // 重复（相邻）
        [0, 1],
        [0, 0],
      ];

      // 步骤 1: 检测几何问题
      const validation1 = GeometryRepairService.detectIssues(originalRing);
      // 有warning时valid仍然是true
      expect(validation1.valid).toBe(true);
      expect(validation1.issues.length).toBeGreaterThan(0);

      // 步骤 2: 修复几何问题
      const repairResult1 = GeometryRepairService.repair(originalRing);
      expect(repairResult1.success).toBe(true);
      expect(repairResult1.appliedRepairs).toContain(RepairType.REMOVE_DUPLICATES);

      const repairedRing = repairResult1.repairedGeometry as Point[];
      const validation2 = GeometryRepairService.detectIssues(repairedRing);
      expect(validation2.valid).toBe(true);

      // 步骤 3: 转换到 Web Mercator
      const transformResult1 = CoordinateTransformService.transform(
        repairedRing,
        CoordinateSystem.WGS84,
        CoordinateSystem.WEB_MERCATOR
      );
      expect(transformResult1.success).toBe(true);

      const mercatorRing = transformResult1.coordinates as Point[];

      // 步骤 4: 转换回 WGS84
      const transformResult2 = CoordinateTransformService.transform(
        mercatorRing,
        CoordinateSystem.WEB_MERCATOR,
        CoordinateSystem.WGS84
      );
      expect(transformResult2.success).toBe(true);

      const finalRing = transformResult2.coordinates as Point[];

      // 步骤 5: 验证最终几何数据
      const validation3 = GeometryRepairService.detectIssues(finalRing);
      expect(validation3.valid).toBe(true);

      // 步骤 6: 验证坐标精度（P99 误差 <= 2m）
      for (let i = 0; i < repairedRing.length; i++) {
        const error = CoordinateTransformService.calculateTransformationError(
          repairedRing[i],
          CoordinateSystem.WGS84
        );
        const errorInMeters = CoordinateTransformService.calculateErrorInMeters(error, repairedRing[i][1]);
        expect(errorInMeters).toBeLessThan(2);
      }
    });

    it('应该处理批量几何数据的完整流程', () => {
      // 创建多个带有问题的几何数据
      const geometries: Point[][][] = [
        [
          // 多边形 1: 有重复顶点
          [0, 0],
          [1, 1],
          [1, 1], // 重复
          [2, 2],
          [0, 0],
        ],
        [
          // 多边形 2: 自相交（简化的8字形）
          [0, 0],
          [2, 2],
          [0, 2],
          [2, 0],
          [0, 0],
        ],
        [
          // 多边形 3: 有效
          [3, 3],
          [5, 3],
          [5, 5],
          [3, 5],
          [3, 3],
        ],
      ];

      // 批量修复
      const repairResults = GeometryRepairService.repairBatch(geometries);
      expect(repairResults.length).toBe(3);

      // 对修复后的数据进行批量转换
      const transformResults = repairResults.map((repairResult, index) => {
        if (!repairResult.success || repairResult.repairedGeometry === null) {
          return { success: false, coordinates: geometries[index] };
        }

        return CoordinateTransformService.transform(
          repairResult.repairedGeometry,
          CoordinateSystem.WGS84,
          CoordinateSystem.WEB_MERCATOR
        );
      });

      // 验证转换结果
      expect(transformResults.length).toBe(3);
      transformResults.forEach((result) => {
        if (result.coordinates !== null) {
          expect(result.success).toBe(true);
        }
      });
    });

    it('应该处理复杂的多面数据', () => {
      const multiPolygon: Point[][][] = [
        [
          // 面 1: 有重复顶点
          [
            [0, 0],
            [2, 0],
            [2, 2],
            [0, 2],
            [0, 0],
          ],
        ],
        [
          // 面 2: 有效
          [
            [3, 3],
            [5, 3],
            [5, 5],
            [3, 5],
            [3, 3],
          ],
        ],
      ];

      // 修复
      const repairResult = GeometryRepairService.repair(multiPolygon);
      expect(repairResult.success).toBe(true);

      // 转换
      const transformResult = CoordinateTransformService.transform(
        repairResult.repairedGeometry,
        CoordinateSystem.WGS84,
        CoordinateSystem.WEB_MERCATOR
      );
      expect(transformResult.success).toBe(true);

      // 反转换
      const reverseTransformResult = CoordinateTransformService.transform(
        transformResult.coordinates,
        CoordinateSystem.WEB_MERCATOR,
        CoordinateSystem.WGS84
      );
      expect(reverseTransformResult.success).toBe(true);
    });
  });

  describe('性能验证', () => {
    it('应该在合理时间内处理大量坐标转换', () => {
      // 生成 10000 个随机点（在 Web Mercator 有效范围内）
      const points: Point[] = [];
      for (let i = 0; i < 10000; i++) {
        const lon = (Math.random() - 0.5) * 360;
        const lat = (Math.random() - 0.5) * 170; // 限制在 [-85, 85] 范围内
        points.push([lon, lat]);
      }

      const startTime = performance.now();
      const transformed = CoordinateTransformService.transformCoordinates(
        points,
        CoordinateSystem.WGS84,
        CoordinateSystem.WEB_MERCATOR
      );
      const endTime = performance.now();

      const duration = endTime - startTime;

      // 10000 个点的转换应该在 100ms 内完成
      expect(duration).toBeLessThan(100);
      expect(transformed.length).toBe(10000);
    });

    it('应该在合理时间内处理大量几何修复', () => {
      // 生成 1000 个带有重复顶点的多边形
      const geometries: Point[][] = [];
      for (let i = 0; i < 1000; i++) {
        const baseX = Math.random() * 10;
        const baseY = Math.random() * 10;
        geometries.push([
          [baseX, baseY],
          [baseX + 1, baseY],
          [baseX + 1, baseY + 1], // 重复
          [baseX + 1, baseY + 1],
          [baseX, baseY + 1],
          [baseX, baseY],
        ]);
      }

      const startTime = performance.now();
      const results = GeometryRepairService.repairBatch(geometries);
      const endTime = performance.now();

      const duration = endTime - startTime;

      // 1000 个多边形的修复应该在 200ms 内完成
      expect(duration).toBeLessThan(200);
      expect(results.length).toBe(1000);
    });

    it('验证 P99 坐标误差 <= 2m（性能测试）', () => {
      // 生成 1000 个测试点（在 Web Mercator 有效范围内）
      const testPoints: Point[] = [];
      for (let i = 0; i < 1000; i++) {
        const lon = (Math.random() - 0.5) * 360;
        const lat = (Math.random() - 0.5) * 170; // 限制在 [-85, 85] 范围内
        testPoints.push([lon, lat]);
      }

      const startTime = performance.now();
      const p99Error = CoordinateTransformService.validateP99Error(testPoints, CoordinateSystem.WGS84);
      const endTime = performance.now();

      const duration = endTime - startTime;

      // 验证应该在 50ms 内完成
      expect(duration).toBeLessThan(50);
      // P99 误差应该 <= 2m
      expect(p99Error).toBeLessThan(2);
    });
  });

  describe('真实场景模拟', () => {
    it('应该处理真实地理数据的修复和转换', () => {
      // 模拟一个包含多个城市的多边形数据（简化版）
      const cityPolygon: Point[] = [
        [116.397128, 39.916527], // 北京
        [121.473701, 31.230416], // 上海
        [113.264385, 23.129110], // 广州
        [114.057868, 22.543099], // 深圳
        [116.397128, 39.916527], // 回到北京（闭合）
      ];

      // 检测问题
      const validation = GeometryRepairService.detectIssues(cityPolygon);
      expect(validation).toBeDefined();

      // 修复
      const repairResult = GeometryRepairService.repair(cityPolygon);
      expect(repairResult.success).toBe(true);

      // 转换
      const transformResult = CoordinateTransformService.transform(
        repairResult.repairedGeometry,
        CoordinateSystem.WGS84,
        CoordinateSystem.WEB_MERCATOR
      );
      expect(transformResult.success).toBe(true);

      // 反转换并验证精度
      const reverseResult = CoordinateTransformService.transform(
        transformResult.coordinates,
        CoordinateSystem.WEB_MERCATOR,
        CoordinateSystem.WGS84
      );
      expect(reverseResult.success).toBe(true);

      const finalPoints = reverseResult.coordinates as Point[];
      const repairedPoints = repairResult.repairedGeometry as Point[];

      // 验证每个点的精度
      for (let i = 0; i < repairedPoints.length; i++) {
        const error = CoordinateTransformService.calculateTransformationError(
          repairedPoints[i],
          CoordinateSystem.WGS84
        );
        const errorInMeters = CoordinateTransformService.calculateErrorInMeters(error, repairedPoints[i][1]);
        expect(errorInMeters).toBeLessThan(2);
      }
    });

    it('应该处理带有多个问题的复杂几何数据', () => {
      // 创建一个同时有多个问题的几何数据
      const complexGeometry: Point[] = [
        [0, 0],
        [1, 0],
        [2, 0],
        [2, 0], // 重复
        [2, 2],
        [2, 2], // 重复
        [0, 2],
        [0, 0],
        [0, 0], // 重复
      ];

      // 检测所有问题
      const validation = GeometryRepairService.detectIssues(complexGeometry);
      expect(validation.issues.length).toBeGreaterThan(0);

      // 应用所有修复
      const repairResult = GeometryRepairService.repair(complexGeometry, {
        repairTypes: Object.values(RepairType),
      });
      expect(repairResult.success).toBe(true);
      expect(repairResult.appliedRepairs.length).toBeGreaterThan(0);

      // 验证修复后的数据
      const finalValidation = GeometryRepairService.detectIssues(repairResult.repairedGeometry);
      expect(finalValidation.valid).toBe(true);

      // 转换并验证
      const transformResult = CoordinateTransformService.transform(
        repairResult.repairedGeometry,
        CoordinateSystem.WGS84,
        CoordinateSystem.WEB_MERCATOR
      );
      expect(transformResult.success).toBe(true);
    });
  });

  describe('错误处理和边界情况', () => {
    it('应该正确处理转换失败的情况', () => {
      const invalidGeometry: Point[] = [
        [999, 0], // 无效经度
        [1000, 0], // 无效经度
        [1100, 0], // 无效经度
        [999, 0], // 重复
      ];

      // 修复不会修复坐标范围问题，只有几何拓扑问题
      const repairResult = GeometryRepairService.repair(invalidGeometry);
      expect(repairResult).toBeDefined();

      // 转换会失败
      const transformResult = CoordinateTransformService.transform(
        repairResult.repairedGeometry,
        CoordinateSystem.WGS84,
        CoordinateSystem.WEB_MERCATOR
      );
      expect(transformResult.success).toBe(false);
      expect(transformResult.error).toBeDefined();
    });

    it('应该处理空几何数据', () => {
      const emptyGeometry: Point[] = [];

      const repairResult = GeometryRepairService.repair(emptyGeometry);
      expect(repairResult.success).toBe(true);

      const transformResult = CoordinateTransformService.transform(
        repairResult.repairedGeometry,
        CoordinateSystem.WGS84,
        CoordinateSystem.WEB_MERCATOR
      );
      expect(transformResult.success).toBe(true);
    });

    it('应该处理单点几何数据', () => {
      const point: Point = [116.397128, 39.916527];

      const repairResult = GeometryRepairService.repair(point);
      expect(repairResult.success).toBe(true);

      const transformResult = CoordinateTransformService.transform(
        repairResult.repairedGeometry,
        CoordinateSystem.WGS84,
        CoordinateSystem.WEB_MERCATOR
      );
      expect(transformResult.success).toBe(true);

      // 验证精度
      const reverseResult = CoordinateTransformService.transform(
        transformResult.coordinates,
        CoordinateSystem.WEB_MERCATOR,
        CoordinateSystem.WGS84
      );
      expect(reverseResult.success).toBe(true);

      const finalPoint = reverseResult.coordinates as Point;
      const error = CoordinateTransformService.calculateTransformationError(point, CoordinateSystem.WGS84);
      const errorInMeters = CoordinateTransformService.calculateErrorInMeters(error, point[1]);
      expect(errorInMeters).toBeLessThan(2);
    });
  });
});
