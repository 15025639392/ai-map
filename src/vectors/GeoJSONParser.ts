import {
  GeoJSONData,
  IFeature,
  IGeometry,
  GeometryType,
  Coordinates,
  LineCoordinates,
  PolygonCoordinates,
  Coordinate,
} from '../vectortypes.js';

/**
 * GeoJSON 解析器
 */
export class GeoJSONParser {
  /**
   * 解析 GeoJSON 数据
   */
  static parse(geojson: GeoJSONData): IFeature[] {
    if (geojson.type === 'FeatureCollection') {
      return geojson.features
        .filter((f) => f.geometry)
        .map((f) => this.parseFeature(f));
    } else if (geojson.type === 'Feature') {
      if (!geojson.geometry) {
        throw new Error('GeoJSON Feature must have geometry');
      }
      return [this.parseFeature(geojson)];
    } else {
      throw new Error(`Unsupported GeoJSON type: ${geojson.type}`);
    }
  }

  /**
   * 解析 Feature
   */
  private static parseFeature(feature: {
    geometry?: any;
    properties?: any;
    id?: string | number;
  }): IFeature {
    const geometry = this.parseGeometry(feature.geometry);
    return {
      id: feature.id,
      geometry,
      properties: feature.properties || {},
    };
  }

  /**
   * 解析 Geometry
   */
  private static parseGeometry(geometry: any): IGeometry {
    const geomType = geometry.type;
    switch (geomType) {
      case 'Point':
        return {
          type: GeometryType.POINT,
          coordinates: this.parseCoordinates(geometry.coordinates),
        };
      case 'MultiPoint':
        return {
          type: GeometryType.MULTI_POINT,
          coordinates: this.parseCoordinatesArray(geometry.coordinates),
        };
      case 'LineString':
        return {
          type: GeometryType.LINE,
          coordinates: this.parseLineCoordinates(geometry.coordinates),
        };
      case 'MultiLineString':
        // @ts-ignore - 类型转换问题
        return {
          type: GeometryType.MULTI_LINE,
          coordinates: this.parseLineCoordinatesArray(geometry.coordinates) as LineCoordinates,
        };
      case 'Polygon':
        // @ts-ignore - 类型转换问题
        return {
          type: GeometryType.POLYGON,
          coordinates: this.parsePolygonCoordinates(geometry.coordinates) as PolygonCoordinates,
        };
      case 'MultiPolygon':
        // @ts-ignore - 类型转换问题
        return {
          type: GeometryType.MULTI_POLYGON,
          coordinates: this.parsePolygonCoordinatesArray(geometry.coordinates) as PolygonCoordinates,
        };
      default:
        throw new Error(`Unsupported geometry type: ${geometry.type}`);
    }
  }

  /**
   * 解析坐标
   */
  private static parseCoordinates(coords: any): Coordinates {
    if (!Array.isArray(coords) || coords.length < 2) {
      throw new Error('Invalid coordinate format');
    }
    return [coords[0], coords[1]];
  }

  /**
   * 解析坐标数组
   */
  private static parseCoordinatesArray(coords: any): Coordinates {
    if (!Array.isArray(coords) || coords.length < 1) {
      throw new Error('Invalid coordinates array format');
    }
    return [coords[0], coords[1]];
  }

  /**
   * 解析线坐标
   */
  private static parseLineCoordinates(coords: any): LineCoordinates {
    if (!Array.isArray(coords) || coords.length < 2) {
      throw new Error('Invalid LineString format');
    }
    return coords.map((c) => this.parseCoordinates(c));
  }

  /**
   * 解析线坐标数组
   */
  private static parseLineCoordinatesArray(coords: any): LineCoordinates {
    if (!Array.isArray(coords) || coords.length < 1) {
      throw new Error('Invalid MultiLineString format');
    }
    return coords.map((c) => this.parseLineCoordinates(c));
  }

  /**
   * 解析面坐标
   */
  private static parsePolygonCoordinates(coords: any): PolygonCoordinates {
    if (!Array.isArray(coords) || coords.length < 1) {
      throw new Error('Invalid Polygon format');
    }
    return coords.map((ring) => this.parseLineCoordinates(ring));
  }

  /**
   * 解析面坐标数组
   */
  private static parsePolygonCoordinatesArray(coords: any): PolygonCoordinates {
    if (!Array.isArray(coords) || coords.length < 1) {
      throw new Error('Invalid MultiPolygon format');
    }
    return coords.map((polygon) => this.parsePolygonCoordinates(polygon));
  }

  /**
   * 计算 geometry 的边界框
   */
  static getBounds(geometry: IGeometry): [Coordinate, Coordinate] {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const visitCoordinates = (coords: any) => {
      if (Array.isArray(coords[0])) {
        coords.forEach((c: any) => visitCoordinates(c));
      } else {
        minX = Math.min(minX, coords[0]);
        minY = Math.min(minY, coords[1]);
        maxX = Math.max(maxX, coords[0]);
        maxY = Math.max(maxY, coords[1]);
      }
    };

    visitCoordinates(geometry.coordinates);

    return [
      [minX, minY],
      [maxX, maxY],
    ];
  }

  /**
   * 计算要素的边界框
   */
  static getFeatureBounds(feature: IFeature): [Coordinate, Coordinate] {
    return this.getBounds(feature.geometry);
  }
}
