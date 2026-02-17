import {
  ITileVersion,
  ITileCacheInfo,
  ITileMetadata,
} from './tile-generator-types.js';

/**
 * 瓦片版本管理器
 * 负责管理瓦片版本、缓存和元数据
 */
export class TileVersionManager {
  private _versions: Map<string, ITileVersion> = new Map();
  private _cache: Map<string, ITileCacheInfo> = new Map();
  private _maxCacheSize: number;
  private _enableLRU: boolean;

  constructor(maxCacheSize: number = 10000, enableLRU: boolean = true) {
    this._maxCacheSize = maxCacheSize;
    this._enableLRU = enableLRU;
  }

  /**
   * 创建新版本
   */
  createVersion(
    version: string,
    description?: string,
    sourceHash?: string
  ): ITileVersion {
    const tileVersion: ITileVersion = {
      version,
      timestamp: Date.now(),
      sourceHash: sourceHash || '',
      tileCount: 0,
      description,
      expired: false,
    };

    this._versions.set(version, tileVersion);
    return tileVersion;
  }

  /**
   * 获取版本信息
   */
  getVersion(version: string): ITileVersion | undefined {
    return this._versions.get(version);
  }

  /**
   * 获取所有版本
   */
  getAllVersions(): ITileVersion[] {
    return Array.from(this._versions.values());
  }

  /**
   * 获取最新版本
   */
  getLatestVersion(): ITileVersion | undefined {
    const versions = Array.from(this._versions.values());
    if (versions.length === 0) return undefined;

    return versions.reduce((latest, current) => {
      return current.timestamp > latest.timestamp ? current : latest;
    });
  }

  /**
   * 标记版本为过期
   */
  markVersionExpired(version: string): boolean {
    const tileVersion = this._versions.get(version);
    if (!tileVersion) return false;

    tileVersion.expired = true;
    return true;
  }

  /**
   * 清理过期版本
   */
  cleanExpiredVersions(thresholdMs: number = 7 * 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    const expiredVersions: string[] = [];

    for (const [version, tileVersion] of this._versions) {
      if (now - tileVersion.timestamp > thresholdMs) {
        this._versions.delete(version);
        expiredVersions.push(version);
      }
    }

    // 清理相关缓存
    expiredVersions.forEach((version) => {
      this.cleanCacheByVersion(version);
    });

    return expiredVersions.length;
  }

  /**
   * 添加瓦片到缓存
   */
  addToCache(
    x: number,
    y: number,
    z: number,
    path: string,
    data: ArrayBuffer | string,
    version: string,
    metadata?: Partial<ITileMetadata>
  ): void {
    const key = this.getCacheKey(x, y, z);
    const size = data instanceof ArrayBuffer ? data.byteLength : data.length;

    // 检查缓存大小限制
    this._checkCacheSize();

    const cacheInfo: ITileCacheInfo = {
      coord: { x, y, z },
      key,
      path,
      size,
      lastAccess: Date.now(),
      version,
      hitCount: 0,
    };

    this._cache.set(key, cacheInfo);

    // 更新版本统计
    const tileVersion = this._versions.get(version);
    if (tileVersion) {
      tileVersion.tileCount++;
    }
  }

  /**
   * 从缓存获取瓦片
   */
  getFromCache(
    x: number,
    y: number,
    z: number
  ): { data: ArrayBuffer | string; version: string } | undefined {
    const key = this.getCacheKey(x, y, z);
    const cacheInfo = this._cache.get(key);

    if (!cacheInfo) return undefined;

    // 更新访问信息
    if (this._enableLRU) {
      cacheInfo.lastAccess = Date.now();
    }
    cacheInfo.hitCount++;

    return {
      data: this._decodeCacheData(cacheInfo.path),
      version: cacheInfo.version,
    };
  }

  /**
   * 检查缓存是否存在
   */
  hasInCache(x: number, y: number, z: number): boolean {
    const key = this.getCacheKey(x, y, z);
    return this._cache.has(key);
  }

  /**
   * 从缓存移除瓦片
   */
  removeFromCache(x: number, y: number, z: number): boolean {
    const key = this.getCacheKey(x, y, z);
    return this._cache.delete(key);
  }

  /**
   * 清理指定版本的缓存
   */
  cleanCacheByVersion(version: string): number {
    let count = 0;
    for (const [key, cacheInfo] of this._cache) {
      if (cacheInfo.version === version) {
        this._cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * 清理所有缓存
   */
  clearCache(): void {
    this._cache.clear();
  }

  /**
   * 清理旧缓存 (LRU策略)
   */
  cleanOldCache(count: number): number {
    const entries = Array.from(this._cache.entries());
    // 按最后访问时间排序
    entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);

    let removed = 0;
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      this._cache.delete(entries[i][0]);
      removed++;
    }

    return removed;
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): {
    size: number;
    totalSize: number;
    hitRate: number;
    oldestAccess: number;
  } {
    const entries = Array.from(this._cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const totalHits = entries.reduce((sum, entry) => sum + entry.hitCount, 0);
    const oldestAccess = entries.length > 0 ? Math.min(...entries.map((e) => e.lastAccess)) : 0;
    const hitRate = totalHits > 0 ? totalHits / (totalHits + entries.length) : 0;

    return {
      size: this._cache.size,
      totalSize,
      hitRate,
      oldestAccess,
    };
  }

  /**
   * 获取版本统计
   */
  getVersionStats(): {
    versionCount: number;
    latestVersion: string | undefined;
    totalTiles: number;
  } {
    const versions = Array.from(this._versions.values());
    const latest = this.getLatestVersion();
    const totalTiles = versions.reduce((sum, v) => sum + v.tileCount, 0);

    return {
      versionCount: versions.length,
      latestVersion: latest?.version,
      totalTiles,
    };
  }

  /**
   * 导出版本列表 (用于版本化服务)
   */
  exportVersions(): string[] {
    return Array.from(this._versions.keys());
  }

  /**
   * 导出缓存键列表
   */
  exportCacheKeys(): string[] {
    return Array.from(this._cache.keys());
  }

  /**
   * 重置统计
   */
  resetStats(): void {
    for (const cacheInfo of this._cache.values()) {
      cacheInfo.hitCount = 0;
      cacheInfo.lastAccess = Date.now();
    }

    for (const tileVersion of this._versions.values()) {
      tileVersion.tileCount = 0;
    }
  }

  /**
   * 清理 (重置所有状态)
   */
  dispose(): void {
    this._versions.clear();
    this._cache.clear();
  }

  /**
   * 生成缓存键
   */
  private getCacheKey(x: number, y: number, z: number): string {
    return `${z}/${x}/${y}`;
  }

  /**
   * 检查缓存大小并清理旧缓存
   */
  private _checkCacheSize(): void {
    if (this._cache.size <= this._maxCacheSize) return;

    if (this._enableLRU) {
      this.cleanOldCache(this._cache.size - this._maxCacheSize);
    }
  }

  /**
   * 解码缓存数据 (简化实现，实际可能从文件或URL加载)
   */
  private _decodeCacheData(path: string): ArrayBuffer | string {
    // 在实际实现中，这里应该从文件系统或CDN加载数据
    // 这里简化返回空数据
    return '';
  }

  /**
   * 计算版本哈希
   */
  static calculateSourceHash(data: any): string {
    // 简化哈希计算
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
