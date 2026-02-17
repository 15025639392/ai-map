import {
  IStyleConfig,
  ICreateStyleConfig,
  IUpdateStyleConfig,
  IStyleQuery,
  IStyleQueryResult,
  IApplyStyleConfig,
  IApplyStyleResult,
  StyleType,
  APIError,
} from './style-types.js';

/**
 * 样式服务
 * 提供样式 CRUD 操作、样式应用、样式版本管理等功能
 */
export class StyleService {
  private _styles: Map<string, IStyleConfig>;
  private _versionCounter: Map<string, number>;

  constructor() {
    this._styles = new Map();
    this._versionCounter = new Map();
  }

  /**
   * 创建样式
   */
  async createStyle(config: ICreateStyleConfig): Promise<IStyleConfig> {
    const id = this._generateStyleId(config.createdBy);
    const now = Date.now();

    const styleConfig: IStyleConfig = {
      id,
      name: config.name,
      type: config.type,
      definition: config.definition,
      createdBy: config.createdBy,
      createdAt: now,
      updatedAt: now,
      version: 1,
      isPublic: config.isPublic ?? false,
      tags: config.tags ?? [],
      description: config.description,
    };

    this._styles.set(id, styleConfig);
    this._versionCounter.set(id, 1);

    return { ...styleConfig };
  }

  /**
   * 获取样式
   */
  async getStyle(id: string): Promise<IStyleConfig | null> {
    const style = this._styles.get(id);
    return style ? { ...style } : null;
  }

  /**
   * 更新样式
   */
  async updateStyle(
    id: string,
    updates: IUpdateStyleConfig
  ): Promise<IStyleConfig | null> {
    const style = this._styles.get(id);
    if (!style) {
      return null;
    }

    const updatedStyle: IStyleConfig = {
      ...style,
      ...updates,
      updatedAt: Date.now(),
      version: (this._versionCounter.get(id) ?? 0) + 1,
    };

    this._styles.set(id, updatedStyle);
    this._versionCounter.set(id, updatedStyle.version);

    return { ...updatedStyle };
  }

  /**
   * 删除样式
   */
  async deleteStyle(id: string): Promise<boolean> {
    const deleted = this._styles.delete(id);
    if (deleted) {
      this._versionCounter.delete(id);
    }
    return deleted;
  }

  /**
   * 查询样式
   */
  async queryStyles(query: IStyleQuery): Promise<IStyleQueryResult> {
    let results = Array.from(this._styles.values());

    // 按条件过滤
    if (query.id) {
      results = results.filter(s => s.id === query.id);
    }
    if (query.createdBy) {
      results = results.filter(s => s.createdBy === query.createdBy);
    }
    if (query.type) {
      results = results.filter(s => s.type === query.type);
    }
    if (query.isPublic !== undefined) {
      results = results.filter(s => s.isPublic === query.isPublic);
    }
    if (query.tags && query.tags.length > 0) {
      results = results.filter(s =>
        query.tags!.some(tag => s.tags?.includes(tag))
      );
    }
    if (query.keyword) {
      const keyword = query.keyword.toLowerCase();
      results = results.filter(
        s =>
          s.name.toLowerCase().includes(keyword) ||
          s.description?.toLowerCase().includes(keyword)
      );
    }

    // 排序（按更新时间倒序）
    results.sort((a, b) => b.updatedAt - a.updatedAt);

    const total = results.length;
    const offset = query.offset ?? 0;
    const limit = query.limit ?? 20;

    // 分页
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      styles: paginatedResults.map(s => ({ ...s })),
      total,
      offset,
      limit,
    };
  }

  /**
   * 应用样式
   */
  async applyStyle(config: IApplyStyleConfig): Promise<IApplyStyleResult> {
    const style = this._styles.get(config.styleId);
    if (!style) {
      return {
        success: false,
        appliedAt: Date.now(),
        version: 0,
        error: 'Style not found',
      };
    }

    try {
      // 解析样式定义
      const styleDefinition = JSON.parse(style.definition);

      // 应用样式到目标（这里简化处理，实际需要根据 target 类型应用）
      // 在实际实现中，可能需要调用图层服务或其他服务

      return {
        success: true,
        appliedAt: Date.now(),
        version: style.version,
      };
    } catch (error) {
      return {
        success: false,
        appliedAt: Date.now(),
        version: style.version,
        error:
          error instanceof Error ? error.message : 'Failed to apply style',
      };
    }
  }

  /**
   * 复制样式
   */
  async copyStyle(
    id: string,
    userId: string,
    newName?: string
  ): Promise<IStyleConfig | null> {
    const originalStyle = this._styles.get(id);
    if (!originalStyle) {
      return null;
    }

    const now = Date.now();
    const newId = this._generateStyleId(userId);

    const copiedStyle: IStyleConfig = {
      ...originalStyle,
      id: newId,
      name: newName ?? `${originalStyle.name} (Copy)`,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
      version: 1,
      isPublic: false, // 复制的样式默认为私有
    };

    this._styles.set(newId, copiedStyle);
    this._versionCounter.set(newId, 1);

    return { ...copiedStyle };
  }

  /**
   * 批量删除样式
   */
  async batchDeleteStyles(ids: string[]): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const id of ids) {
      const deleted = await this.deleteStyle(id);
      if (deleted) {
        success.push(id);
      } else {
        failed.push(id);
      }
    }

    return { success, failed };
  }

  /**
   * 获取样式历史版本
   */
  async getStyleVersions(id: string): Promise<number[]> {
    // 简化实现：只返回当前版本号
    const currentVersion = this._versionCounter.get(id) ?? 0;
    if (currentVersion === 0) {
      return [];
    }

    // 实际实现中应该存储所有历史版本
    return Array.from({ length: currentVersion }, (_, i) => i + 1);
  }

  /**
   * 验证样式定义
   */
  async validateStyleDefinition(definition: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(definition);

      // 基本验证：必须是对象且不是数组
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return false;
      }

      // 实际实现中需要更详细的验证
      // 例如检查必填字段、字段类型等

      return true;
    } catch {
      return false;
    }
  }

  /**
   * 清空所有样式（测试用）
   */
  async clearAll(): Promise<void> {
    this._styles.clear();
    this._versionCounter.clear();
  }

  /**
   * 获取样式统计
   */
  async getStats(): Promise<{
    totalStyles: number;
    publicStyles: number;
    privateStyles: number;
    stylesByType: Record<string, number>;
  }> {
    const styles = Array.from(this._styles.values());

    const stats = {
      totalStyles: styles.length,
      publicStyles: styles.filter(s => s.isPublic).length,
      privateStyles: styles.filter(s => !s.isPublic).length,
      stylesByType: {} as Record<string, number>,
    };

    styles.forEach(s => {
      const type = s.type;
      stats.stylesByType[type] = (stats.stylesByType[type] || 0) + 1;
    });

    return stats;
  }

  /**
   * 生成样式 ID
   */
  private _generateStyleId(userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${userId.substring(0, 8)}_${timestamp}_${random}`;
  }
}
