/**
 * Golden Image 管理器
 * 提供 golden image 的存储、加载、更新、版本管理功能
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import {
  GoldenImageInfo,
  GoldenImageMetadata,
  TestScenario,
} from './types.js';

/**
 * Golden Image 管理器
 */
export class GoldenImageManager {
  private _baseDir: string;
  private _imagesDir: string;
  private _metadataDir: string;
  private _cache: Map<string, GoldenImageInfo> = new Map();

  constructor(baseDir?: string) {
    this._baseDir = baseDir || path.join(process.cwd(), 'tests', 'golden-images');
    this._imagesDir = path.join(this._baseDir, 'images');
    this._metadataDir = path.join(this._baseDir, 'metadata');
  }

  /**
   * 初始化目录结构
   */
  async initialize(): Promise<void> {
    await fs.mkdir(this._baseDir, { recursive: true });
    await fs.mkdir(this._imagesDir, { recursive: true });
    await fs.mkdir(this._metadataDir, { recursive: true });
  }

  /**
   * 保存 Golden Image
   */
  async saveGoldenImage(
    name: string,
    imageData: Buffer,
    width: number,
    height: number,
    options?: {
      description?: string;
      tags?: string[];
      environment?: Record<string, string>;
    }
  ): Promise<GoldenImageInfo> {
    await this.initialize();

    const metadata: GoldenImageMetadata = {
      name,
      version: 1,
      width,
      height,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      description: options?.description,
      tags: options?.tags,
      environment: options?.environment,
    };

    // 生成文件名（使用 hash 避免冲突）
    const hash = crypto.createHash('md5').update(imageData).digest('hex');
    const filename = `${name}_${hash.slice(0, 8)}.png`;
    const imagePath = path.join(this._imagesDir, filename);
    const metadataPath = path.join(this._metadataDir, `${name}.json`);

    // 保存图像
    await fs.writeFile(imagePath, imageData);

    // 保存元数据
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    const info: GoldenImageInfo = {
      metadata,
      data: imageData,
      path: imagePath,
    };

    // 更新缓存
    this._cache.set(name, info);

    return info;
  }

  /**
   * 加载 Golden Image
   */
  async loadGoldenImage(name: string): Promise<GoldenImageInfo | null> {
    // 检查缓存
    const cached = this._cache.get(name);
    if (cached) {
      return cached;
    }

    try {
      const metadataPath = path.join(this._metadataDir, `${name}.json`);
      const metadataContent = await fs.readFile(metadataPath, 'utf-8');
      const metadata: GoldenImageMetadata = JSON.parse(metadataContent);

      // 从元数据中获取图像路径
      const hash = crypto.createHash('md5').update(Buffer.from('')).digest('hex');
      const filename = `${name}_${hash.slice(0, 8)}.png`;
      const imagePath = path.join(this._imagesDir, filename);

      // 尝试加载图像
      let imageData: Buffer;
      try {
        imageData = await fs.readFile(imagePath);
      } catch (e) {
        // 如果找不到图像，尝试从其他可能的路径加载
        const files = await fs.readdir(this._imagesDir);
        const matchingFile = files.find(f => f.startsWith(name));
        if (matchingFile) {
          imageData = await fs.readFile(path.join(this._imagesDir, matchingFile));
          imagePath = path.join(this._imagesDir, matchingFile);
        } else {
          return null;
        }
      }

      const info: GoldenImageInfo = {
        metadata,
        data: imageData,
        path: imagePath,
      };

      // 更新缓存
      this._cache.set(name, info);

      return info;
    } catch (error) {
      console.warn(`Failed to load golden image "${name}":`, error);
      return null;
    }
  }

  /**
   * 更新 Golden Image
   */
  async updateGoldenImage(
    name: string,
    imageData: Buffer,
    width: number,
    height: number,
    options?: {
      description?: string;
      tags?: string[];
      environment?: Record<string, string>;
    }
  ): Promise<GoldenImageInfo> {
    const existing = await this.loadGoldenImage(name);

    if (!existing) {
      return this.saveGoldenImage(name, imageData, width, height, options);
    }

    // 备份旧版本
    const backupDir = path.join(this._baseDir, 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    const timestamp = Date.now();
    const backupPath = path.join(backupDir, `${name}_v${existing.metadata.version}_${timestamp}.png`);
    await fs.copyFile(existing.path, backupPath);

    // 更新元数据
    const metadata: GoldenImageMetadata = {
      ...existing.metadata,
      version: existing.metadata.version + 1,
      width,
      height,
      updatedAt: Date.now(),
      description: options?.description ?? existing.metadata.description,
      tags: options?.tags ?? existing.metadata.tags,
      environment: options?.environment ?? existing.metadata.environment,
    };

    // 生成新文件名
    const hash = crypto.createHash('md5').update(imageData).digest('hex');
    const filename = `${name}_${hash.slice(0, 8)}.png`;
    const imagePath = path.join(this._imagesDir, filename);
    const metadataPath = path.join(this._metadataDir, `${name}.json`);

    // 保存新图像
    await fs.writeFile(imagePath, imageData);

    // 更新元数据
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

    // 删除旧图像文件
    try {
      await fs.unlink(existing.path);
    } catch (e) {
      // 忽略删除错误
    }

    const info: GoldenImageInfo = {
      metadata,
      data: imageData,
      path: imagePath,
    };

    // 更新缓存
    this._cache.set(name, info);

    return info;
  }

  /**
   * 删除 Golden Image
   */
  async deleteGoldenImage(name: string): Promise<boolean> {
    const info = await this.loadGoldenImage(name);
    if (!info) {
      return false;
    }

    try {
      await fs.unlink(info.path);
      await fs.unlink(path.join(this._metadataDir, `${name}.json`));
      this._cache.delete(name);
      return true;
    } catch (error) {
      console.warn(`Failed to delete golden image "${name}":`, error);
      return false;
    }
  }

  /**
   * 列出所有 Golden Images
   */
  async listGoldenImages(): Promise<GoldenImageMetadata[]> {
    try {
      const files = await fs.readdir(this._metadataDir);
      const images: GoldenImageMetadata[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(this._metadataDir, file), 'utf-8');
          const metadata: GoldenImageMetadata = JSON.parse(content);
          images.push(metadata);
        }
      }

      return images.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.warn('Failed to list golden images:', error);
      return [];
    }
  }

  /**
   * 根据标签搜索 Golden Images
   */
  async findByTag(tag: string): Promise<GoldenImageMetadata[]> {
    const all = await this.listGoldenImages();
    return all.filter(img => img.tags?.includes(tag));
  }

  /**
   * 获取 Golden Image 统计信息
   */
  async getStats(): Promise<{
    total: number;
    totalSize: number;
    byTag: Record<string, number>;
    versions: Record<string, number>;
  }> {
    const images = await this.listGoldenImages();
    const byTag: Record<string, number> = {};
    const versions: Record<string, number> = {};
    let totalSize = 0;

    for (const img of images) {
      // 统计标签
      for (const tag of img.tags || []) {
        byTag[tag] = (byTag[tag] || 0) + 1;
      }

      // 统计版本
      versions[img.name] = img.version;

      // 统计大小
      const info = await this.loadGoldenImage(img.name);
      if (info) {
        totalSize += info.data.length;
      }
    }

    return {
      total: images.length,
      totalSize,
      byTag,
      versions,
    };
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this._cache.clear();
  }

  /**
   * 导出所有 Golden Images
   */
  async export(outputDir: string): Promise<void> {
    await fs.mkdir(outputDir, { recursive: true });

    // 复制图像
    await fs.cp(this._imagesDir, path.join(outputDir, 'images'), { recursive: true });

    // 复制元数据
    await fs.cp(this._metadataDir, path.join(outputDir, 'metadata'), { recursive: true });

    // 导出索引文件
    const images = await this.listGoldenImages();
    const indexPath = path.join(outputDir, 'index.json');
    await fs.writeFile(indexPath, JSON.stringify(images, null, 2));
  }

  /**
   * 导入 Golden Images
   */
  async import(inputDir: string): Promise<number> {
    const imagesDir = path.join(inputDir, 'images');
    const metadataDir = path.join(inputDir, 'metadata');

    try {
      // 复制图像
      await fs.cp(imagesDir, this._imagesDir, { recursive: true });

      // 复制元数据
      await fs.cp(metadataDir, this._metadataDir, { recursive: true });

      // 清除缓存
      this.clearCache();

      // 返回导入数量
      const images = await this.listGoldenImages();
      return images.length;
    } catch (error) {
      console.warn('Failed to import golden images:', error);
      return 0;
    }
  }
}
