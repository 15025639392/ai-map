import {
  Point,
  RepairType,
  GeometryRepairResult,
  GeometryValidationResult,
  GeometryIssue,
} from './types.js';

/**
 * 几何修复服务
 * 检测并修复常见的几何问题
 */
export class GeometryRepairService {
  /**
   * 误差阈值（米），用于判断两点是否重复
   */
  private static readonly TOLERANCE = 0.0001;

  /**
   * 零面积阈值（平方米）
   */
  private static readonly ZERO_AREA_THRESHOLD = 1e-10; // 更小的阈值，用于检测几乎为零的面积

  /**
   * 零长度阈值（米）
   */
  private static readonly ZERO_LENGTH_THRESHOLD = 0.0001;

  /**
   * 判断两点是否相等（考虑误差）
   */
  private static pointsEqual(p1: Point, p2: Point): boolean {
    return Math.abs(p1[0] - p2[0]) < this.TOLERANCE && Math.abs(p1[1] - p2[1]) < this.TOLERANCE;
  }

  /**
   * 计算两点之间的距离（近似，使用欧几里得距离）
   */
  private static distance(p1: Point, p2: Point): number {
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算多边形的面积（使用鞋带公式）
   */
  private static polygonArea(ring: Point[]): number {
    if (ring.length < 3) return 0;

    let area = 0;
    const n = ring.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += ring[i][0] * ring[j][1];
      area -= ring[j][0] * ring[i][1];
    }
    return Math.abs(area) / 2;
  }

  /**
   * 检测线段是否自相交
   * 检查非相邻线段是否相交
   */
  private static hasSelfIntersection(points: Point[]): boolean {
    if (points.length < 4) return false;

    const segments: { start: Point; end: Point }[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      segments.push({ start: points[i], end: points[i + 1] });
    }

    // 检查所有线段对
    for (let i = 0; i < segments.length; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        // 跳过相邻线段
        if (Math.abs(i - j) <= 1) continue;

        // 跳过共享端点的线段（不算自相交）
        const seg1 = segments[i];
        const seg2 = segments[j];
        if (this.pointsEqual(seg1.start, seg2.start) ||
            this.pointsEqual(seg1.start, seg2.end) ||
            this.pointsEqual(seg1.end, seg2.start) ||
            this.pointsEqual(seg1.end, seg2.end)) {
          continue;
        }

        if (this.segmentsIntersect(seg1, seg2)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 判断两条线段是否相交
   */
  private static segmentsIntersect(
    seg1: { start: Point; end: Point },
    seg2: { start: Point; end: Point }
  ): boolean {
    const ccw = (p1: Point, p2: Point, p3: Point) => {
      return (p3[0] - p1[0]) * (p2[1] - p1[1]) - (p2[0] - p1[0]) * (p3[1] - p1[1]);
    };

    const a = seg1.start;
    const b = seg1.end;
    const c = seg2.start;
    const d = seg2.end;

    return (
      ccw(a, b, c) * ccw(a, b, d) <= 0 && ccw(c, d, a) * ccw(c, d, b) <= 0
    );
  }

  /**
   * 移除重复顶点
   */
  private static removeDuplicatePoints(points: Point[]): Point[] {
    if (points.length <= 1) return points;

    const unique: Point[] = [points[0]];
    for (let i = 1; i < points.length; i++) {
      if (!this.pointsEqual(points[i], unique[unique.length - 1])) {
        unique.push(points[i]);
      }
    }

    return unique;
  }

  /**
   * 修复零面积面
   * 如果多边形闭合（首尾相同），移除最后一个点
   */
  private static fixZeroAreaPolygon(ring: Point[]): Point[] | null {
    if (ring.length < 3) return null;

    // 如果首尾相同，移除最后一个点
    if (this.pointsEqual(ring[0], ring[ring.length - 1])) {
      ring = ring.slice(0, -1);
    }

    // 检查是否形成有效多边形
    if (ring.length < 3) return null;

    const area = this.polygonArea(ring);
    if (area < this.ZERO_AREA_THRESHOLD) {
      return null; // 零面积，标记为无效
    }

    return ring;
  }

  /**
   * 修复零长度线
   */
  private static fixZeroLengthLine(points: Point[]): Point[] | null {
    if (points.length < 2) return null;

    let totalLength = 0;
    for (let i = 1; i < points.length; i++) {
      totalLength += this.distance(points[i - 1], points[i]);
    }

    if (totalLength < this.ZERO_LENGTH_THRESHOLD) {
      return null; // 零长度，标记为无效
    }

    return points;
  }

  /**
   * 简单的自相交修复（移除导致自相交的点）
   * 注意：这是一个简化的实现，完整的自相交修复需要更复杂的算法
   */
  private static fixSelfIntersectionSimple(points: Point[]): Point[] {
    // 移除重复顶点后通常能解决大部分自相交问题
    const deduplicated = this.removeDuplicatePoints(points);

    // 如果仍然有自相交，返回原始数据（不进行复杂修复）
    if (this.hasSelfIntersection(deduplicated)) {
      // 在实际应用中，这里应该实现更复杂的修复算法
      // 例如使用 JSTS 或 turf.js 库
      return points;
    }

    return deduplicated;
  }

  /**
   * 检测几何问题
   */
  static detectIssues(geometry: any): GeometryValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const issues: GeometryIssue[] = [];

    const detectInPoints = (points: Point[]) => {
      // 检测重复顶点
      const duplicateCount = points.length - this.removeDuplicatePoints(points).length;
      if (duplicateCount > 0) {
        issues.push({
          type: RepairType.REMOVE_DUPLICATES,
          description: `发现 ${duplicateCount} 个重复顶点`,
          severity: 'warning',
        });
        warnings.push(`发现 ${duplicateCount} 个重复顶点`);
      }

      // 检测零长度
      if (points.length >= 2) {
        const fixed = this.fixZeroLengthLine(points);
        if (fixed === null) {
          issues.push({
            type: RepairType.FIX_ZERO_LENGTH,
            description: '线段长度为零',
            severity: 'error',
          });
          errors.push('线段长度为零');
        }
      }
    };

    const detectInRing = (ring: Point[]) => {
      detectInPoints(ring);

      // 检测零面积
      const fixed = this.fixZeroAreaPolygon(ring);
      if (fixed === null) {
        issues.push({
          type: RepairType.FIX_ZERO_AREA,
          description: '多边形面积为零',
          severity: 'error',
        });
        errors.push('多边形面积为零');
      }

      // 检测自相交
      if (this.hasSelfIntersection(ring)) {
        issues.push({
          type: RepairType.FIX_SELF_INTERSECTION,
          description: '多边形自相交',
          severity: 'error',
        });
        errors.push('多边形自相交');
      }
    };

    const detectInCoordinates = (coords: any) => {
      const isPoint = (arr: any): arr is Point => {
        return Array.isArray(arr) && arr.length >= 2 && typeof arr[0] === 'number';
      };

      const isPointArray = (arr: any): arr is Point[] => {
        return Array.isArray(arr) && arr.length > 0 && isPoint(arr[0]);
      };

      if (isPointArray(coords)) {
        // 单层坐标数组，判断是线段还是多边形环
        // 只有当首尾相同时才认为是多边形（需要至少4个点，因为首尾重复）
        if (coords.length >= 4 && this.pointsEqual(coords[0], coords[coords.length - 1])) {
          detectInRing(coords);
        } else {
          detectInPoints(coords);
        }
      } else if (Array.isArray(coords)) {
        if (isPointArray(coords[0])) {
          // LineString 或 Polygon ring
          if (coords.length >= 4 && this.pointsEqual(coords[0], coords[coords.length - 1])) {
            detectInRing(coords);
          } else {
            detectInPoints(coords);
          }
        } else {
          coords.forEach((c: any) => detectInCoordinates(c));
        }
      }
    };

    detectInCoordinates(geometry);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      issues,
    };
  }

  /**
   * 修复几何数据
   */
  static repair(
    geometry: any,
    options: {
      /** 要应用的修复类型，不指定则应用所有修复 */
      repairTypes?: RepairType[];
      /** 是否保持原始数据的引用 */
      immutable?: boolean;
    } = {}
  ): GeometryRepairResult {
    const { repairTypes = Object.values(RepairType), immutable = true } = options;
    const appliedRepairs: RepairType[] = [];

    try {
      const shouldApply = (type: RepairType) => repairTypes.includes(type);

      const repairPointArray = (points: Point[]): Point[] => {
        let result = immutable ? [...points] : points;

        // 移除重复顶点
        if (shouldApply(RepairType.REMOVE_DUPLICATES)) {
          const originalLength = result.length;
          result = this.removeDuplicatePoints(result);
          if (result.length < originalLength) {
            appliedRepairs.push(RepairType.REMOVE_DUPLICATES);
          }
        }

        // 修复零长度
        if (shouldApply(RepairType.FIX_ZERO_LENGTH)) {
          const fixed = this.fixZeroLengthLine(result);
          if (fixed === null) {
            return null as any; // 零长度，标记为无效
          } else {
            result = fixed;
            appliedRepairs.push(RepairType.FIX_ZERO_LENGTH);
          }
        }

        return result;
      };

      const repairRing = (ring: Point[]): Point[] | null => {
        let result = immutable ? [...ring] : ring;

        // 移除重复顶点
        if (shouldApply(RepairType.REMOVE_DUPLICATES)) {
          const originalLength = result.length;
          result = this.removeDuplicatePoints(result);
          if (result.length < originalLength) {
            appliedRepairs.push(RepairType.REMOVE_DUPLICATES);
          }
        }

        // 修复零面积
        if (shouldApply(RepairType.FIX_ZERO_AREA)) {
          const fixed = this.fixZeroAreaPolygon(result);
          if (fixed !== null) {
            result = fixed;
            appliedRepairs.push(RepairType.FIX_ZERO_AREA);
          } else {
            return null; // 无效多边形
          }
        }

        // 修复自相交
        if (shouldApply(RepairType.FIX_SELF_INTERSECTION)) {
          const fixed = this.fixSelfIntersectionSimple(result);
          if (fixed !== result) {
            result = fixed;
            appliedRepairs.push(RepairType.FIX_SELF_INTERSECTION);
          }
        }

        return result;
      };

      const repairCoordinates = (coords: any): any => {
        const isPoint = (arr: any): arr is Point => {
          return Array.isArray(arr) && arr.length >= 2 && typeof arr[0] === 'number';
        };

        const isPointArray = (arr: any): arr is Point[] => {
          return Array.isArray(arr) && arr.length > 0 && isPoint(arr[0]);
        };

        if (isPointArray(coords)) {
          const repaired = repairPointArray(coords);
          return repaired !== null ? repaired : coords;
        } else if (Array.isArray(coords)) {
          if (isPointArray(coords[0])) {
            // LineString 或 Polygon ring
            if (coords.length >= 3) {
              const repaired = repairRing(coords);
              return repaired !== null ? repaired : coords; // 返回原始数据而不是null
            } else {
              const repaired = repairPointArray(coords);
              return repaired !== null ? repaired : coords;
            }
          } else {
            return coords.map((c: any) => repairCoordinates(c));
          }
        }
        return coords;
      };

      const repairedGeometry = repairCoordinates(geometry);

      return {
        repairedGeometry,
        appliedRepairs,
        success: true,
      };
    } catch (error) {
      return {
        repairedGeometry: geometry,
        appliedRepairs,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 批量修复几何数据
   */
  static repairBatch(
    geometries: any[],
    options?: {
      repairTypes?: RepairType[];
      immutable?: boolean;
    }
  ): GeometryRepairResult[] {
    return geometries.map((geom) => this.repair(geom, options));
  }
}
