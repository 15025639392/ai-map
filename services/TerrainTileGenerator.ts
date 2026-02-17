import {
  ITerrainGeneratorConfig,
  ITileGeneratorResult,
  ITileMetadata,
  TileGeneratorFormat,
} from './tile-generator-types.js';

/**
 * 地形瓦片生成服务
 * 从 DEM 数据生成高度图、坡度图、坡向图
 */
export class TerrainTileGenerator {
  private _config: Required<ITerrainGeneratorConfig>;

  constructor(config: ITerrainGeneratorConfig) {
    this._config = {
      ...config,
      tileSize: config.tileSize ?? 256,
      projection: config.projection ?? 'web_mercator',
      elevationRange: config.elevationRange ?? { min: 0, max: 10000 },
      generateSlope: config.generateSlope ?? false,
      generateAspect: config.generateAspect ?? false,
      colorGradient: config.colorGradient ?? { low: '#0066cc', high: '#ffffcc' },
    };
  }

  /**
   * 生成单个地形瓦片
   */
  async generateTile(
    x: number,
    y: number,
    z: number
  ): Promise<ITileGeneratorResult> {
    const startTime = performance.now();

    try {
      // 获取或生成高程数据
      const elevationData = await this._getElevationData(x, y, z);

      // 根据配置生成地形图
      const tileData = await this._generateTerrainImage(elevationData);

      const duration = performance.now() - startTime;
      const metadata: ITileMetadata = {
        timestamp: Date.now(),
        dataSource: typeof this._config.elevationSource === 'string'
          ? this._config.elevationSource
          : 'internal',
        version: '1.0.0',
        zoom: z,
        x,
        y,
      };

      return {
        success: true,
        data: tileData,
        format: this._config.format,
        size: tileData.byteLength || tileData.length,
        duration,
        metadata,
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      return {
        success: false,
        data: new ArrayBuffer(0),
        format: this._config.format,
        size: 0,
        duration,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * 批量生成瓦片
   */
  async generateBatch(
    zoomLevels: number[],
    onProgress?: (current: number, total: number) => void
  ): Promise<ITileGeneratorResult[]> {
    const results: ITileGeneratorResult[] = [];
    let currentIndex = 0;

    // 计算总瓦片数
    let totalTiles = 0;
    for (const z of zoomLevels) {
      const tilesAtZoom = Math.pow(2, z) * Math.pow(2, z);
      totalTiles += tilesAtZoom;
    }

    for (const z of zoomLevels) {
      if (z < this._config.minZoom || z > this._config.maxZoom) continue;

      const tileCount = Math.pow(2, z);

      for (let x = 0; x < tileCount; x++) {
        for (let y = 0; y < tileCount; y++) {
          const result = await this.generateTile(x, y, z);
          results.push(result);

          currentIndex++;
          if (onProgress) {
            onProgress(currentIndex, totalTiles);
          }
        }
      }
    }

    return results;
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<ITerrainGeneratorConfig>): void {
    this._config = { ...this._config, ...updates };
  }

  /**
   * 获取配置
   */
  getConfig(): Required<ITerrainGeneratorConfig> {
    return { ...this._config };
  }

  /**
   * 生成地形图像
   */
  private async _generateTerrainImage(
    elevationData: Float32Array | Int16Array
  ): Promise<ArrayBuffer> {
    const { tileSize, generateSlope, generateAspect, colorGradient, elevationRange } = this._config;

    // 创建图像数据
    const imageData = new Uint8ClampedArray(tileSize * tileSize * 4);

    // 生成地形图
    for (let i = 0; i < elevationData.length; i++) {
      const elevation = elevationData[i];
      const normalized = this._normalizeElevation(elevation, elevationRange);

      let r = 0, g = 0, b = 0, a = 255;

      if (generateSlope) {
        // 坡度图：根据颜色渐变渲染
        const color = this._gradientColor(normalized, colorGradient);
        r = color.r;
        g = color.g;
        b = color.b;
      } else if (generateAspect) {
        // 坡向图：根据方向渲染
        const color = this._aspectColor(normalized);
        r = color.r;
        g = color.g;
        b = color.b;
      } else {
        // 高程图：灰度显示
        const gray = Math.floor(normalized * 255);
        r = gray;
        g = gray;
        b = gray;
      }

      const idx = i * 4;
      imageData[idx] = r;
      imageData[idx + 1] = g;
      imageData[idx + 2] = b;
      imageData[idx + 3] = a;
    }

    // 编码为指定格式
    if (this._config.format === TileGeneratorFormat.PNG) {
      return this._encodePNG(imageData, tileSize);
    } else if (this._config.format === TileGeneratorFormat.JPEG) {
      return this._encodeJPEG(imageData, tileSize);
    } else if (this._config.format === TileGeneratorFormat.GEOTIFF) {
      return this._encodeGeoTIFF(imageData, tileSize, elevationData);
    }

    return new ArrayBuffer(0);
  }

  /**
   * 获取高程数据
   */
  private async _getElevationData(
    x: number,
    y: number,
    z: number
  ): Promise<Float32Array | Int16Array> {
    const { elevationSource, tileSize } = this._config;

    // 如果是字符串，返回模拟数据
    if (typeof elevationSource === 'string') {
      return this._generateMockElevation(tileSize, tileSize);
    }

    // 如果是数组，直接返回
    if (elevationSource instanceof Float32Array) {
      return elevationSource;
    }

    if (elevationSource instanceof Int16Array) {
      return elevationSource;
    }

    // 生成模拟数据
    return this._generateMockElevation(tileSize, tileSize);
  }

  /**
   * 生成模拟高程数据
   */
  private _generateMockElevation(width: number, height: number): Float32Array {
    const data = new Float32Array(width * height);
    for (let i = 0; i < data.length; i++) {
      // 简单的地形模式
      const x = i % width;
      const y = Math.floor(i / width);
      const normalizedX = x / width;
      const normalizedY = y / height;

      // 生成平缓地形
      data[i] =
        Math.sin(normalizedX * 10) * 100 +
        Math.cos(normalizedY * 10) * 100 +
        Math.random() * 50;
    }
    return data;
  }

  /**
   * 归一化高程值
   */
  private _normalizeElevation(
    elevation: number,
    range: { min: number; max: number }
  ): number {
    const normalized = (elevation - range.min) / (range.max - range.min);
    return Math.max(0, Math.min(1, normalized));
  }

  /**
   * 颜色渐变
   */
  private _gradientColor(
    value: number,
    gradient: { low: string; high: string }
  ): { r: number; g: number; b: number } {
    const lowColor = this._hexToRgb(gradient.low);
    const highColor = this._hexToRgb(gradient.high);

    const r = Math.floor(lowColor.r + (highColor.r - lowColor.r) * value);
    const g = Math.floor(lowColor.g + (highColor.g - lowColor.g) * value);
    const b = Math.floor(lowColor.b + (highColor.b - lowColor.b) * value);

    return { r, g, b };
  }

  /**
   * 坡向颜色
   */
  private _aspectColor(value: number): { r: number; g: number; b: number } {
    // 坡向 0-1 对应北、东、南、西
    const direction = value * 360;

    // 使用 HSL 颜色空间表示方向
    const hue = direction;
    const sat = 70;
    const light = 50;

    return this._hslToRgb(hue, sat, light);
  }

  /**
   * HEX 转 RGB
   */
  private _hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { r: 0, g: 0, b: 0 };

    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    };
  }

  /**
   * HSL 转 RGB
   */
  private _hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    h = ((h % 360) + 360) % 360;
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
      r = x;
      g = x;
      b = x;
    } else if (60 <= h && h < 120) {
      r = x;
      g = m;
      b = m;
    } else if (120 <= h && h < 180) {
      r = x;
      g = x;
      b = x;
    } else if (180 <= h && h < 240) {
      r = m;
      g = x;
      b = x;
    } else if (240 <= h && h < 300) {
      r = m;
      g = m;
      b = x;
    } else {
      r = x;
      g = m;
      b = x;
    }

    return {
      r: Math.floor(r * 255),
      g: Math.floor(g * 255),
      b: Math.floor(b * 255),
    };
  }

  /**
   * 编码为 PNG
   */
  private async _encodePNG(imageData: Uint8ClampedArray, size: number): Promise<ArrayBuffer> {
    // 简化实现：返回空数据
    // 实际实现需要使用 pngjs 库
    return new ArrayBuffer(0);
  }

  /**
   * 编码为 JPEG
   */
  private async _encodeJPEG(imageData: Uint8ClampedArray, size: number): Promise<ArrayBuffer> {
    // 简化实现：返回空数据
    // 实际实现需要使用 jpeg-js 库
    return new ArrayBuffer(0);
  }

  /**
   * 编码为 GeoTIFF
   */
  private async _encodeGeoTIFF(
    imageData: Uint8ClampedArray,
    size: number,
    elevation: Float32Array | Int16Array
  ): Promise<ArrayBuffer> {
    // 简化实现：返回空数据
    // 实际实现需要使用 geotiff.js 库
    return new ArrayBuffer(0);
  }
}
