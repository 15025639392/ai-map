import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  StyleService,
} from '../../services/StyleService.js';
import {
  IStyleConfig,
  ICreateStyleConfig,
  StyleType,
  IUpdateStyleConfig,
  IStyleQuery,
  IApplyStyleConfig,
} from '../../services/style-types.js';

describe('StyleService', () => {
  let styleService: StyleService;

  beforeEach(() => {
    styleService = new StyleService();
  });

  describe('createStyle', () => {
    it('should create a new style', async () => {
      const config: ICreateStyleConfig = {
        name: 'Test Style',
        type: StyleType.VECTOR,
        definition: JSON.stringify({ version: 8, layers: [] }),
        createdBy: 'user123',
        isPublic: true,
        tags: ['test', 'vector'],
        description: 'Test style description',
      };

      const style = await styleService.createStyle(config);

      expect(style).toBeDefined();
      expect(style.name).toBe('Test Style');
      expect(style.type).toBe(StyleType.VECTOR);
      expect(style.createdBy).toBe('user123');
      expect(style.isPublic).toBe(true);
      expect(style.tags).toEqual(['test', 'vector']);
      expect(style.description).toBe('Test style description');
      expect(style.version).toBe(1);
      expect(style.id).toBeDefined();
      expect(typeof style.id).toBe('string');
    });

    it('should create style with default values', async () => {
      const config: ICreateStyleConfig = {
        name: 'Default Style',
        type: StyleType.RASTER,
        definition: JSON.stringify({}),
        createdBy: 'user456',
      };

      const style = await styleService.createStyle(config);

      expect(style.isPublic).toBe(false);
      expect(style.tags).toEqual([]);
      expect(style.description).toBeUndefined();
    });
  });

  describe('getStyle', () => {
    it('should return existing style', async () => {
      const createConfig: ICreateStyleConfig = {
        name: 'Get Test Style',
        type: StyleType.VECTOR,
        definition: JSON.stringify({}),
        createdBy: 'user123',
      };

      const created = await styleService.createStyle(createConfig);
      const fetched = await styleService.getStyle(created.id);

      expect(fetched).not.toBeNull();
      expect(fetched?.id).toBe(created.id);
      expect(fetched?.name).toBe('Get Test Style');
    });

    it('should return null for non-existent style', async () => {
      const fetched = await styleService.getStyle('non-existent-id');
      expect(fetched).toBeNull();
    });
  });

  describe('updateStyle', () => {
    it('should update existing style', async () => {
      const createConfig: ICreateStyleConfig = {
        name: 'Original Name',
        type: StyleType.VECTOR,
        definition: JSON.stringify({}),
        createdBy: 'user123',
      };

      const created = await styleService.createStyle(createConfig);

      const updates: IUpdateStyleConfig = {
        name: 'Updated Name',
        isPublic: true,
        tags: ['updated'],
        description: 'Updated description',
      };

      const updated = await styleService.updateStyle(created.id, updates);

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.isPublic).toBe(true);
      expect(updated?.tags).toEqual(['updated']);
      expect(updated?.description).toBe('Updated description');
      expect(updated?.version).toBe(2);
    });

    it('should increment version on update', async () => {
      const createConfig: ICreateStyleConfig = {
        name: 'Version Test',
        type: StyleType.VECTOR,
        definition: JSON.stringify({}),
        createdBy: 'user123',
      };

      const created = await styleService.createStyle(createConfig);

      const update1 = await styleService.updateStyle(created.id, { name: 'V2' });
      expect(update1?.version).toBe(2);

      const update2 = await styleService.updateStyle(created.id, { name: 'V3' });
      expect(update2?.version).toBe(3);
    });

    it('should return null for non-existent style', async () => {
      const updated = await styleService.updateStyle('non-existent-id', {
        name: 'New Name',
      });
      expect(updated).toBeNull();
    });
  });

  describe('deleteStyle', () => {
    it('should delete existing style', async () => {
      const createConfig: ICreateStyleConfig = {
        name: 'Delete Test',
        type: StyleType.VECTOR,
        definition: JSON.stringify({}),
        createdBy: 'user123',
      };

      const created = await styleService.createStyle(createConfig);
      const deleted = await styleService.deleteStyle(created.id);

      expect(deleted).toBe(true);

      const fetched = await styleService.getStyle(created.id);
      expect(fetched).toBeNull();
    });

    it('should return false for non-existent style', async () => {
      const deleted = await styleService.deleteStyle('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('queryStyles', () => {
    beforeEach(async () => {
      // Create test styles
      await styleService.createStyle({
        name: 'Style 1',
        type: StyleType.VECTOR,
        definition: JSON.stringify({}),
        createdBy: 'user1',
        isPublic: true,
        tags: ['vector', 'public'],
      });

      await styleService.createStyle({
        name: 'Style 2',
        type: StyleType.RASTER,
        definition: JSON.stringify({}),
        createdBy: 'user1',
        isPublic: false,
        tags: ['raster', 'private'],
      });

      await styleService.createStyle({
        name: 'Style 3',
        type: StyleType.VECTOR,
        definition: JSON.stringify({}),
        createdBy: 'user2',
        isPublic: true,
        tags: ['vector', 'user2'],
      });
    });

    it('should return all styles', async () => {
      const result = await styleService.queryStyles({});

      expect(result.styles.length).toBe(3);
      expect(result.total).toBe(3);
    });

    it('should filter by createdBy', async () => {
      const result = await styleService.queryStyles({ createdBy: 'user1' });

      expect(result.styles.length).toBe(2);
      expect(result.styles.every(s => s.createdBy === 'user1')).toBe(true);
    });

    it('should filter by type', async () => {
      const result = await styleService.queryStyles({ type: StyleType.VECTOR });

      expect(result.styles.length).toBe(2);
      expect(result.styles.every(s => s.type === StyleType.VECTOR)).toBe(true);
    });

    it('should filter by isPublic', async () => {
      const result = await styleService.queryStyles({ isPublic: true });

      expect(result.styles.length).toBe(2);
      expect(result.styles.every(s => s.isPublic === true)).toBe(true);
    });

    it('should filter by tags', async () => {
      const result = await styleService.queryStyles({ tags: ['vector'] });

      expect(result.styles.length).toBe(2);
      expect(result.styles.every(s => s.tags?.includes('vector'))).toBe(true);
    });

    it('should filter by keyword', async () => {
      const result = await styleService.queryStyles({ keyword: 'Style 1' });

      expect(result.styles.length).toBe(1);
      expect(result.styles[0].name).toBe('Style 1');
    });

    it('should apply pagination', async () => {
      const result = await styleService.queryStyles({ offset: 0, limit: 2 });

      expect(result.styles.length).toBe(2);
      expect(result.total).toBe(3);
      expect(result.offset).toBe(0);
      expect(result.limit).toBe(2);
    });
  });

  describe('applyStyle', () => {
    it('should apply style successfully', async () => {
      const createConfig: ICreateStyleConfig = {
        name: 'Apply Test',
        type: StyleType.VECTOR,
        definition: JSON.stringify({ version: 8, layers: [] }),
        createdBy: 'user123',
      };

      const created = await styleService.createStyle(createConfig);

      const applyConfig: IApplyStyleConfig = {
        styleId: created.id,
        target: 'layer1',
        params: { scale: 1 },
      };

      const result = await styleService.applyStyle(applyConfig);

      expect(result.success).toBe(true);
      expect(result.version).toBe(1);
      expect(result.appliedAt).toBeDefined();
    });

    it('should return error for non-existent style', async () => {
      const applyConfig: IApplyStyleConfig = {
        styleId: 'non-existent-id',
        target: 'layer1',
      };

      const result = await styleService.applyStyle(applyConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Style not found');
    });

    it('should return error for invalid style definition', async () => {
      const createConfig: ICreateStyleConfig = {
        name: 'Invalid Style',
        type: StyleType.VECTOR,
        definition: 'invalid json',
        createdBy: 'user123',
      };

      const created = await styleService.createStyle(createConfig);

      const applyConfig: IApplyStyleConfig = {
        styleId: created.id,
        target: 'layer1',
      };

      const result = await styleService.applyStyle(applyConfig);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('copyStyle', () => {
    it('should copy existing style', async () => {
      const createConfig: ICreateStyleConfig = {
        name: 'Original',
        type: StyleType.VECTOR,
        definition: JSON.stringify({}),
        createdBy: 'user123',
        isPublic: true,
        tags: ['original'],
        description: 'Original description',
      };

      const created = await styleService.createStyle(createConfig);

      const copied = await styleService.copyStyle(created.id, 'user456');

      expect(copied).not.toBeNull();
      expect(copied?.id).not.toBe(created.id);
      expect(copied?.name).toBe('Original (Copy)');
      expect(copied?.createdBy).toBe('user456');
      expect(copied?.version).toBe(1);
      expect(copied?.isPublic).toBe(false);
      expect(copied?.tags).toEqual(['original']);
      expect(copied?.description).toBe('Original description');
    });

    it('should copy with custom name', async () => {
      const createConfig: ICreateStyleConfig = {
        name: 'Original',
        type: StyleType.VECTOR,
        definition: JSON.stringify({}),
        createdBy: 'user123',
      };

      const created = await styleService.createStyle(createConfig);

      const copied = await styleService.copyStyle(created.id, 'user456', 'Custom Name');

      expect(copied?.name).toBe('Custom Name');
    });

    it('should return null for non-existent style', async () => {
      const copied = await styleService.copyStyle('non-existent-id', 'user456');
      expect(copied).toBeNull();
    });
  });

  describe('batchDeleteStyles', () => {
    it('should delete multiple styles', async () => {
      const style1 = await styleService.createStyle({
        name: 'Delete 1',
        type: StyleType.VECTOR,
        definition: JSON.stringify({}),
        createdBy: 'user123',
      });

      const style2 = await styleService.createStyle({
        name: 'Delete 2',
        type: StyleType.VECTOR,
        definition: JSON.stringify({}),
        createdBy: 'user123',
      });

      const result = await styleService.batchDeleteStyles([style1.id, style2.id]);

      expect(result.success).toHaveLength(2);
      expect(result.success).toContain(style1.id);
      expect(result.success).toContain(style2.id);
      expect(result.failed).toHaveLength(0);
    });

    it('should handle mixed success and failure', async () => {
      const style1 = await styleService.createStyle({
        name: 'Delete 3',
        type: StyleType.VECTOR,
        definition: JSON.stringify({}),
        createdBy: 'user123',
      });

      const result = await styleService.batchDeleteStyles([style1.id, 'non-existent']);

      expect(result.success).toHaveLength(1);
      expect(result.success).toContain(style1.id);
      expect(result.failed).toHaveLength(1);
      expect(result.failed).toContain('non-existent');
    });
  });

  describe('getStyleVersions', () => {
    it('should return style versions', async () => {
      const created = await styleService.createStyle({
        name: 'Version Test',
        type: StyleType.VECTOR,
        definition: JSON.stringify({}),
        createdBy: 'user123',
      });

      await styleService.updateStyle(created.id, { name: 'V2' });
      await styleService.updateStyle(created.id, { name: 'V3' });

      const versions = await styleService.getStyleVersions(created.id);

      expect(versions).toEqual([1, 2, 3]);
    });

    it('should return empty array for non-existent style', async () => {
      const versions = await styleService.getStyleVersions('non-existent-id');
      expect(versions).toEqual([]);
    });
  });

  describe('validateStyleDefinition', () => {
    it('should validate valid JSON definition', async () => {
      const result = await styleService.validateStyleDefinition(
        JSON.stringify({ version: 8, layers: [] })
      );

      expect(result).toBe(true);
    });

    it('should reject invalid JSON', async () => {
      const result = await styleService.validateStyleDefinition('invalid json');

      expect(result).toBe(false);
    });

    it('should reject non-object JSON', async () => {
      const result = await styleService.validateStyleDefinition('[]');

      expect(result).toBe(false);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      await styleService.createStyle({
        name: 'Vector Style',
        type: StyleType.VECTOR,
        definition: JSON.stringify({}),
        createdBy: 'user1',
        isPublic: true,
      });

      await styleService.createStyle({
        name: 'Raster Style',
        type: StyleType.RASTER,
        definition: JSON.stringify({}),
        createdBy: 'user1',
        isPublic: false,
      });
    });

    it('should return style statistics', async () => {
      const stats = await styleService.getStats();

      expect(stats.totalStyles).toBe(2);
      expect(stats.publicStyles).toBe(1);
      expect(stats.privateStyles).toBe(1);
      expect(stats.stylesByType[StyleType.VECTOR]).toBe(1);
      expect(stats.stylesByType[StyleType.RASTER]).toBe(1);
    });
  });

  describe('clearAll', () => {
    it('should clear all styles', async () => {
      await styleService.createStyle({
        name: 'Test',
        type: StyleType.VECTOR,
        definition: JSON.stringify({}),
        createdBy: 'user123',
      });

      await styleService.clearAll();

      const result = await styleService.queryStyles({});
      expect(result.styles.length).toBe(0);
    });
  });
});
