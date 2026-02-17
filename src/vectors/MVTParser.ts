import {
  MVTData,
  IFeature,
  IGeometry,
  GeometryType,
  Coordinates,
  Coordinate,
} from '../vectortypes.js';

/**
 * MVT 几何命令类型
 */
enum MVTCommand {
  MoveTo = 1,
  LineTo = 2,
  ClosePath = 7,
}

/**
 * MVT 几何类型
 */
enum MVTGeomType {
  UNKNOWN = 0,
  POINT = 1,
  LINESTRING = 2,
  POLYGON = 3,
}

/**
 * MVT 解析器
 */
export class MVTParser {
  /**
   * 解析 MVT 瓦片数据
   * 注意：这是简化版实现，实际应用中应使用完整的协议缓冲区解析
   */
  static parse(mvtData: MVTData, layerName?: string): IFeature[] {
    const features: IFeature[] = [];

    for (const layer of mvtData.layers) {
      // 如果指定了图层名，只解析该图层
      if (layerName && layer.name !== layerName) {
        continue;
      }

      for (const mvtFeature of layer.features) {
        const geometry = this.parseGeometry(mvtFeature.geometry, mvtFeature.type, layer.extent || 4096);
        const feature: IFeature = {
          id: mvtFeature.id,
          geometry,
          properties: mvtFeature.properties || {},
        };
        features.push(feature);
      }
    }

    return features;
  }

  /**
   * 解析 MVT 几何数据
   */
  private static parseGeometry(
    geometry: number[],
    type: number,
    extent: number
  ): IGeometry {
    switch (type) {
      case MVTGeomType.POINT:
        return this.parsePointGeometry(geometry);
      case MVTGeomType.LINESTRING:
        return this.parseLineGeometry(geometry);
      case MVTGeomType.POLYGON:
        return this.parsePolygonGeometry(geometry);
      default:
        throw new Error(`Unknown MVT geometry type: ${type}`);
    }
  }

  /**
   * 解析点几何
   */
  private static parsePointGeometry(geometry: number[]): IGeometry {
    const coordinates: Coordinates[] = [];

    let x = 0;
    let y = 0;
    let i = 0;

    while (i < geometry.length) {
      const command = geometry[i] & 0x7;
      const count = geometry[i] >> 3;
      i++;

      if (command === MVTCommand.MoveTo) {
        for (let j = 0; j < count; j++) {
          x += this.zigzagDecode(geometry[i++]);
          y += this.zigzagDecode(geometry[i++]);
          // @ts-ignore - 类型断言
          coordinates.push([x, y]);
        }
      }
    }

    if (coordinates.length === 1) {
      return {
        type: GeometryType.POINT,
        coordinates: coordinates[0],
      };
    } else {
      return {
        type: GeometryType.MULTI_POINT,
        coordinates: coordinates,
      };
    }
  }

  /**
   * 解析线几何
   */
  private static parseLineGeometry(geometry: number[]): IGeometry {
    const lines: Coordinates[] = [];
    let currentLine: Coordinates = [];

    let x = 0;
    let y = 0;
    let i = 0;

    while (i < geometry.length) {
      const command = geometry[i] & 0x7;
      const count = geometry[i] >> 3;
      i++;

      if (command === MVTCommand.MoveTo) {
        if (currentLine.length > 0) {
          lines.push(currentLine);
        }
        currentLine = [];

        for (let j = 0; j < count; j++) {
          x += this.zigzagDecode(geometry[i++]);
          y += this.zigzagDecode(geometry[i++]);
          currentLine.push([x, y]);
        }
      } else if (command === MVTCommand.LineTo) {
        for (let j = 0; j < count; j++) {
          x += this.zigzagDecode(geometry[i++]);
          y += this.zigzagDecode(geometry[i++]);
          currentLine.push([x, y] as Coordinate);
        }
      } else if (command === MVTCommand.ClosePath) {
        // 忽略闭合命令
      }
    }

    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    if (lines.length === 1) {
      return {
        type: GeometryType.LINE,
        coordinates: lines[0],
      };
    } else {
      return {
        type: GeometryType.MULTI_LINE,
        coordinates: lines,
      };
    }
  }

  /**
   * 解析面几何
   */
  private static parsePolygonGeometry(geometry: number[]): IGeometry {
    const polygons: Coordinates[][] = [];
    let currentPolygon: Coordinates[] = [];
    let currentRing: Coordinates = [];

    let x = 0;
    let y = 0;
    let i = 0;

    while (i < geometry.length) {
      const command = geometry[i] & 0x7;
      const count = geometry[i] >> 3;
      i++;

      if (command === MVTCommand.MoveTo) {
        if (currentRing.length > 0) {
          currentPolygon.push(currentRing);
        }
        currentRing = [];

        for (let j = 0; j < count; j++) {
          x += this.zigzagDecode(geometry[i++]);
          y += this.zigzagDecode(geometry[i++]);
          currentRing.push([x, y]);
        }
      } else if (command === MVTCommand.LineTo) {
        for (let j = 0; j < count; j++) {
          x += this.zigzagDecode(geometry[i++]);
          y += this.zigzagDecode(geometry[i++]);
          currentRing.push([x, y]);
        }
      } else if (command === MVTCommand.ClosePath) {
        if (currentRing.length > 0) {
          // 闭合环
          if (currentRing[0][0] !== currentRing[currentRing.length - 1][0] ||
              currentRing[0][1] !== currentRing[currentRing.length - 1][1]) {
            currentRing.push([...currentRing[0]]);
          }
        }
      }
    }

    if (currentRing.length > 0) {
      currentPolygon.push(currentRing);
    }

    if (currentPolygon.length > 0) {
      polygons.push(currentPolygon);
    }

    if (polygons.length === 1) {
      return {
        type: GeometryType.POLYGON,
        coordinates: polygons[0],
      };
    } else {
      return {
        type: GeometryType.MULTI_POLYGON,
        coordinates: polygons,
      };
    }
  }

  /**
   * Zigzag 解码
   */
  private static zigzagDecode(value: number): number {
    return (value >> 1) ^ -(value & 1);
  }
}
