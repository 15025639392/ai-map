/**
 * 坐标系统类型
 */
export enum CoordinateSystem {
  /** WGS84 经纬度坐标 (EPSG:4326) */
  WGS84 = 'wgs84',
  /** Web 墨卡托投影 (EPSG:3857) */
  WEB_MERCATOR = 'web_mercator',
}

/**
 * 坐标点
 */
export type Point = [number, number];

/**
 * 坐标转换结果
 */
export interface TransformationResult {
  /** 转换后的坐标 */
  coordinates: Point | Point[] | Point[][] | Point[][][];
  /** 转换成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
}

/**
 * 几何修复类型
 */
export enum RepairType {
  /** 移除重复顶点 */
  REMOVE_DUPLICATES = 'remove_duplicates',
  /** 修复零面积面 */
  FIX_ZERO_AREA = 'fix_zero_area',
  /** 修复零长度线 */
  FIX_ZERO_LENGTH = 'fix_zero_length',
  /** 修复自相交 */
  FIX_SELF_INTERSECTION = 'fix_self_intersection',
}

/**
 * 几何修复结果
 */
export interface GeometryRepairResult {
  /** 修复后的几何数据 */
  repairedGeometry: any;
  /** 应用的修复类型列表 */
  appliedRepairs: RepairType[];
  /** 修复是否成功 */
  success: boolean;
  /** 错误信息 */
  error?: string;
}

/**
 * 坐标验证结果
 */
export interface CoordinateValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误信息 */
  errors: string[];
  /** 警告信息 */
  warnings: string[];
}

/**
 * 几何验证结果
 */
export interface GeometryValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误信息 */
  errors: string[];
  /** 警告信息 */
  warnings: string[];
  /** 检测到的问题 */
  issues: GeometryIssue[];
}

/**
 * 几何问题
 */
export interface GeometryIssue {
  /** 问题类型 */
  type: RepairType;
  /** 问题描述 */
  description: string;
  /** 严重程度 */
  severity: 'error' | 'warning';
  /** 位置索引 */
  location?: number;
}
