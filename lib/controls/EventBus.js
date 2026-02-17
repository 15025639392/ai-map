/**
 * 事件总线
 */
export class EventBus {
    listeners = new Map();
    /**
     * 订阅事件
     */
    on(eventType, listener) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set());
        }
        this.listeners.get(eventType).add(listener);
        // 返回取消订阅函数
        return () => this.off(eventType, listener);
    }
    /**
     * 取消订阅
     */
    off(eventType, listener) {
        const listeners = this.listeners.get(eventType);
        if (listeners) {
            listeners.delete(listener);
        }
    }
    /**
     * 发布事件
     */
    emit(eventType, data) {
        const event = {
            type: eventType,
            data,
            timestamp: Date.now(),
        };
        const listeners = this.listeners.get(eventType);
        if (listeners) {
            listeners.forEach((listener) => {
                try {
                    listener(event);
                }
                catch (error) {
                    console.error(`[EventBus] Error in listener for ${eventType}:`, error);
                }
            });
        }
    }
    /**
     * 清除所有监听器
     */
    clear() {
        this.listeners.clear();
    }
    /**
     * 获取事件监听器数量
     */
    listenerCount(eventType) {
        return this.listeners.get(eventType)?.size || 0;
    }
}
//# sourceMappingURL=EventBus.js.map