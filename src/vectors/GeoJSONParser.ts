import {
  GeoJSONData,
  IFeature,
  IGeometry,
  GeometryType,
  Coordinates,
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
    const type = geojson.type;
    if (type === 'FeatureCollection') {
      return geojson.features
        .filter((f) => f.geometry)
        .map((f) => this.parseFeature(f));
    } else if (type === 'Feature') {
      if (!geojson.geometry) {
        throw new Error('GeoJSON Feature must have geometry');
      }
      return [this.parseFeature(geojson)];
    } else {
      throw new Error(`Unsupported GeoJSON type: ${type}`);
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
        return {
          type: GeometryType.MULTI_LINE,
          coordinates: this.parseMultiLineCoordinates(geometry.coordinates),
        };
      case 'Polygon':
        return {
          type: GeometryType.POLYGON,
          coordinates: this.parsePolygonCoordinates(geometry.coordinates),
        };
      case 'MultiPolygon':
        return {
          type: GeometryType.MULTI_POLYGON,
          coordinates: this.parseMultiPolygonCoordinates(geometry.coordinates),
        };
      default:
        throw new Error(`Unsupported geometry type: ${geometry.type}`);
    }
  }

  /**
   * 解析坐标
   */
  private static parseCoordinates(coords: any): Coordinate {
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
  private static parseLineCoordinates(coords: any): Coordinates {
    if (!Array.isArray(coords) || coords.length < 2) {
      throw new Error('Invalid LineString format');
    }
    const result: Coordinates = [];
    for (const c of coords) {
      result.push(this.parseCoordinates(c as any));
    }
    return result;
  }

  /**
   * 解析多线坐标数组
   */
  private static parseMultiLineCoordinates(coords: any): Coordinates[] {
    if (!Array.isArray(coords) || coords.length < 1) {
      throw new Error('Invalid MultiLineString format');
    }
    return coords.map((c) => this.parseLineCoordinates(c));
  }

  /**
   * 解析面坐标
   */
  private static parsePolygonCoordinates(coords: any): Coordinates[] {
    if (!Array.isArray(coords) || coords.length < 1) {
      throw new Error('Invalid Polygon format');
    }
    return coords.map((ring) => this.parseLineCoordinates(ring));
  }

  /**
   * 解析多面坐标数组
   */
  private static parseMultiPolygonCoordinates(coords: any): Coordinates[][] {
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
