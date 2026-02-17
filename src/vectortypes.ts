/**
 * 几何类型枚举
 */
export enum GeometryType {
  /** 点 */
  POINT = 'point',
  /** 线 */
  LINE = 'line',
  /** 面 */
  POLYGON = 'polygon',
  /** 多点 */
  MULTI_POINT = 'multi_point',
  /** 多线 */
  MULTI_LINE = 'multi_line',
  /** 多面 */
  MULTI_POLYGON = 'multi_polygon',
}

/**
 * 坐标
 */
export type Coordinate = [number, number];

/**
 * 坐标数组
 */
export type Coordinates = Coordinate[];

/**
 * 线坐标数组
 */
export type LineCoordinates = Coordinates[];

/**
 * 面坐标数组
 */
export type PolygonCoordinates = Coordinates[][];

/**
 * 几何数据
 */
export interface IGeometry {
  /** 几何类型 */
  type: GeometryType;
  /** 坐标数据 */
  coordinates: Coordinates | LineCoordinates | PolygonCoordinates;
}

/**
 * 要素属性
 */
export interface IFeatureProperties {
  [key: string]: any;
}

/**
 * 要素
 */
export interface IFeature {
  /** 唯一标识 */
  id?: string | number;
  /** 几何数据 */
  geometry: IGeometry;
  /** 属性 */
  properties?: IFeatureProperties;
}

/**
 * 图层样式
 */
export interface IVectorStyle {
  /** 填充颜色 */
  fillColor?: string;
  /** 填充不透明度 */
  fillOpacity?: number;
  /** 边框颜色 */
  strokeColor?: string;
  /** 边框宽度 */
  strokeWidth?: number;
  /** 边框不透明度 */
  strokeOpacity?: number;
  /** 点半径 */
  pointRadius?: number;
  /** 点颜色 */
  pointColor?: string;
  /** 点不透明度 */
  pointOpacity?: number;
}

/**
 * 拾取结果
 */
export interface IPickResult {
  /** 要素 */
  feature: IFeature;
  /** 距离（像素） */
  distance: number;
  /** 投影坐标 */
  screenPosition: Coordinate;
}

/**
 * 渲染统计
 */
export interface IRenderStats {
  /** 渲染的要素数量 */
  featuresRendered: number;
  /** 渲染的点数量 */
  pointsRendered: number;
  /** 渲染的线段数量 */
  linesRendered: number;
  /** 渲染的面数量 */
  polygonsRendered: number;
}

/**
 * GeoJSON 数据类型
 */
export type GeoJSONData =
  | {
      type: 'FeatureCollection';
      features: Array<{
        type: 'Feature';
        geometry?: {
          type: 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon';
          coordinates: any;
        };
        properties?: IFeatureProperties;
        id?: string | number;
      }>;
    }
  | {
      type: 'Feature';
      geometry?: {
        type: 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon';
        coordinates: any;
      };
      properties?: IFeatureProperties;
      id?: string | number;
    };

/**
 * MVT 瓦片数据
 */
export interface MVTData {
  /** 图层数据 */
  layers: {
    /** 图层名称 */
    name: string;
    /** 版本 */
    version?: number;
    /** 范围 */
    extent?: number;
    /** 要素数组 */
    features: Array<{
      /** 要素ID */
      id?: number;
      /** 要素类型 */
      type: number;
      /** 几何数据 */
      geometry: number[];
      /** 属性 */
      properties: { [key: string]: any };
    }>;
  }[];
}
