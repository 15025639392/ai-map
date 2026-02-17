/**
 * WebGL 资源管理器
 * 负责管理 WebGL 资源的生命周期，使用引用计数自动清理未使用的资源
 */
export class ResourceManager {
    _resources = new Map();
    _disposed = false;
    /**
     * 注册资源
     */
    registerResource(id, type, resource, disposeFn) {
        if (this._disposed) {
            throw new Error('ResourceManager is disposed');
        }
        if (this._resources.has(id)) {
            throw new Error(`Resource ${id} already registered`);
        }
        const resourceRef = {
            type,
            resource,
            refCount: 1,
            dispose: () => {
                this._safeDisposeResource(id, disposeFn);
            },
        };
        this._resources.set(id, resourceRef);
    }
    /**
     * 增加资源引用计数
     */
    addRef(id) {
        const resource = this._resources.get(id);
        if (!resource) {
            throw new Error(`Resource ${id} not found`);
        }
        resource.refCount++;
    }
    /**
     * 减少资源引用计数，如果计数为 0 则释放资源
     */
    releaseRef(id) {
        const resource = this._resources.get(id);
        if (!resource) {
            throw new Error(`Resource ${id} not found`);
        }
        resource.refCount--;
        if (resource.refCount <= 0) {
            resource.dispose();
        }
    }
    /**
     * 直接释放资源
     */
    disposeResource(id) {
        const resource = this._resources.get(id);
        if (!resource) {
            throw new Error(`Resource ${id} not found`);
        }
        resource.dispose();
    }
    /**
     * 获取资源引用
     */
    getResource(id) {
        return this._resources.get(id);
    }
    /**
     * 检查资源是否存在
     */
    hasResource(id) {
        return this._resources.has(id);
    }
    /**
     * 获取所有资源信息
     */
    getResourceInfo() {
        const info = [];
        this._resources.forEach((ref, id) => {
            info.push({
                id,
                type: ref.type,
                refCount: ref.refCount,
            });
        });
        return info;
    }
    /**
     * 获取资源数量
     */
    getResourceCount() {
        return this._resources.size;
    }
    /**
     * 释放所有资源
     */
    disposeAll() {
        this._resources.forEach((resource) => {
            resource.dispose();
        });
        this._resources.clear();
    }
    /**
     * 清理泄漏检测（查找引用计数大于 0 但未使用的资源）
     */
    detectLeaks() {
        const leakedResources = [];
        this._resources.forEach((resource, id) => {
            if (resource.refCount > 0) {
                leakedResources.push(id);
            }
        });
        return leakedResources;
    }
    /**
     * 安全释放资源
     */
    _safeDisposeResource(id, disposeFn) {
        try {
            disposeFn();
            this._resources.delete(id);
        }
        catch (error) {
            console.error(`[ResourceManager] Failed to dispose resource ${id}:`, error);
            this._resources.delete(id);
        }
    }
    /**
     * 销毁资源管理器
     */
    dispose() {
        this.disposeAll();
        this._disposed = true;
    }
}
//# sourceMappingURL=ResourceManager.js.map