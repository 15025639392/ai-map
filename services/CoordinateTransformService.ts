import {
  CoordinateSystem,
  Point,
  TransformationResult,
  CoordinateValidationResult,
} from './types.js';

/**
 * Web Mercator 投影参数
 */
const WEB_MERCATOR_PARAMS = {
  /** 地球半径 (米) */
  R: 6378137,
  /** 最大纬度限制 (约85.05度，避免无限大值) */
  MAX_LATITUDE: 85.0511287798,
};

/**
 * 坐标转换服务
 * 提供 WGS84 与 Web Mercator 之间的双向转换
 * 精度目标：P99 误差 <= 2m
 */
export class CoordinateTransformService {
  /**
   * WGS84 转 Web Mercator
   * @param lon 经度 (度)
   * @param lat 纬度 (度)
   * @returns Web Mercator 坐标 [x, y] (米)
   */
  static wgs84ToWebMercator(lon: number, lat: number): Point {
    // 验证输入范围
    if (lat > WEB_MERCATOR_PARAMS.MAX_LATITUDE || lat < -WEB_MERCATOR_PARAMS.MAX_LATITUDE) {
      throw new Error(`纬度超出有效范围 [-${WEB_MERCATOR_PARAMS.MAX_LATITUDE}, ${WEB_MERCATOR_PARAMS.MAX_LATITUDE}]: ${lat}`);
    }
    if (lon > 180 || lon < -180) {
      throw new Error(`经度超出有效范围 [-180, 180]: ${lon}`);
    }

    const { R } = WEB_MERCATOR_PARAMS;

    // Web Mercator 投影公式
    const x = (lon * Math.PI) / 180 * R;
    const y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) * R;

    return [x, y];
  }

  /**
   * Web Mercator 转 WGS84
   * @param x X 坐标 (米)
   * @param y Y 坐标 (米)
   * @returns WGS84 坐标 [lon, lat] (度)
   */
  static webMercatorToWgs84(x: number, y: number): Point {
    const { R } = WEB_MERCATOR_PARAMS;

    // 反投影公式
    const lon = (x / R) * (180 / Math.PI);
    const lat = (Math.atan(Math.exp(y / R)) * 2 - Math.PI / 2) * (180 / Math.PI);

    // 验证输出范围
    if (lat > WEB_MERCATOR_PARAMS.MAX_LATITUDE || lat < -WEB_MERCATOR_PARAMS.MAX_LATITUDE) {
      throw new Error(`投影后的纬度超出有效范围: ${lat}`);
    }
    if (lon > 180 || lon < -180) {
      throw new Error(`投影后的经度超出有效范围: ${lon}`);
    }

    return [lon, lat];
  }

  /**
   * 验证坐标点
   */
  static validateCoordinate(point: Point, system: CoordinateSystem): CoordinateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Array.isArray(point) || point.length < 2) {
      errors.push('坐标必须是包含至少2个数字的数组');
      return { valid: false, errors, warnings };
    }

    const [x, y] = point;

    if (typeof x !== 'number' || typeof y !== 'number') {
      errors.push('坐标值必须是数字');
      return { valid: false, errors, warnings };
    }

    if (!isFinite(x) || !isFinite(y)) {
      errors.push('坐标值必须是有限数字');
      return { valid: false, errors, warnings };
    }

    if (system === CoordinateSystem.WGS84) {
      const lon = x;
      const lat = y;
      if (lon < -180 || lon > 180) {
        errors.push(`经度超出范围 [-180, 180]: ${lon}`);
      }
      if (lat < -90 || lat > 90) {
        errors.push(`纬度超出范围 [-90, 90]: ${lat}`);
      }
      // 接近极点时警告
      if (Math.abs(lat) > 85) {
        warnings.push(`纬度接近极点，投影精度可能降低: ${lat}`);
      }
    } else if (system === CoordinateSystem.WEB_MERCATOR) {
      // Web Mercator 坐标范围较大，不做严格限制
      if (Math.abs(x) > 20037508.34) {
        warnings.push(`X 坐标超出常用范围 [-20037508.34, 20037508.34]: ${x}`);
      }
      if (Math.abs(y) > 20037508.34) {
        warnings.push(`Y 坐标超出常用范围 [-20037508.34, 20037508.34]: ${y}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 转换单个坐标点
   */
  static transformPoint(
    point: Point,
    from: CoordinateSystem,
    to: CoordinateSystem
  ): Point {
    // 验证输入
    const validation = this.validateCoordinate(point, from);
    if (!validation.valid) {
      throw new Error(`坐标验证失败: ${validation.errors.join(', ')}`);
    }

    // 相同坐标系直接返回
    if (from === to) {
      return [point[0], point[1]];
    }

    // 执行转换
    if (from === CoordinateSystem.WGS84 && to === CoordinateSystem.WEB_MERCATOR) {
      return this.wgs84ToWebMercator(point[0], point[1]);
    } else if (from === CoordinateSystem.WEB_MERCATOR && to === CoordinateSystem.WGS84) {
      return this.webMercatorToWgs84(point[0], point[1]);
    } else {
      throw new Error(`不支持的坐标转换: ${from} -> ${to}`);
    }
  }

  /**
   * 转换坐标数组
   */
  static transformCoordinates(
    coordinates: Point[],
    from: CoordinateSystem,
    to: CoordinateSystem
  ): Point[] {
    return coordinates.map((point) => this.transformPoint(point, from, to));
  }

  /**
   * 转换多层嵌套坐标数组
   */
  static transformNestedCoordinates(
    coordinates: Point | Point[] | Point[][] | Point[][][],
    from: CoordinateSystem,
    to: CoordinateSystem
  ): Point | Point[] | Point[][] | Point[][][] {
    const isPoint = (arr: any): arr is Point => {
      return Array.isArray(arr) && arr.length >= 2 && typeof arr[0] === 'number' && typeof arr[1] === 'number';
    };

    const isPointArray = (arr: any): arr is Point[] => {
      return Array.isArray(arr) && arr.length > 0 && isPoint(arr[0]);
    };

    const transform = (coords: any): any => {
      if (isPoint(coords)) {
        return this.transformPoint(coords, from, to);
      } else if (isPointArray(coords)) {
        return coords.map((p) => this.transformPoint(p, from, to));
      } else if (Array.isArray(coords)) {
        return coords.map(transform);
      } else {
        throw new Error('无效的坐标格式');
      }
    };

    return transform(coordinates);
  }

  /**
   * 批量转换坐标
   */
  static transform(
    coordinates: Point | Point[] | Point[][] | Point[][][],
    from: CoordinateSystem,
    to: CoordinateSystem
  ): TransformationResult {
    try {
      const transformed = this.transformNestedCoordinates(coordinates, from, to);
      return {
        coordinates: transformed,
        success: true,
      };
    } catch (error) {
      return {
        coordinates: coordinates,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 计算坐标转换误差（用于验证）
   * 执行双向转换并返回最终坐标与原始坐标的差异
   */
  static calculateTransformationError(point: Point, system: CoordinateSystem): Point {
    const targetSystem =
      system === CoordinateSystem.WGS84
        ? CoordinateSystem.WEB_MERCATOR
        : CoordinateSystem.WGS84;

    const converted = this.transformPoint(point, system, targetSystem);
    const restored = this.transformPoint(converted, targetSystem, system);

    return [restored[0] - point[0], restored[1] - point[1]];
  }

  /**
   * 计算误差（米）
   */
  static calculateErrorInMeters(error: Point, lat: number): number {
    const { R } = WEB_MERCATOR_PARAMS;
    // 在纬度 lat 处，1度经度的长度约为 111320 * cos(lat * π / 180) 米
    // 1度纬度的长度约为 110540 米
    const meterPerDegreeLon = 111320 * Math.cos((lat * Math.PI) / 180);
    const meterPerDegreeLat = 110540;

    const errorX = error[0] * meterPerDegreeLon;
    const errorY = error[1] * meterPerDegreeLat;

    return Math.sqrt(errorX * errorX + errorY * errorY);
  }

  /**
   * 批量转换并计算 P99 误差
   * 用于验证转换精度是否满足 P99 <= 2m 要求
   */
  static validateP99Error(points: Point[], system: CoordinateSystem): number {
    const errors = points.map((point) => {
      const error = this.calculateTransformationError(point, system);
      const lat = system === CoordinateSystem.WGS84 ? point[1] : 0;
      return this.calculateErrorInMeters(error, lat);
    });

    // 排序并取 P99
    errors.sort((a, b) => a - b);
    const p99Index = Math.floor(errors.length * 0.99);
    return errors[p99Index];
  }
}
