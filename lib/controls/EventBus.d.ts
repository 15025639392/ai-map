import { ControlEventType, EventListener } from './types.js';
/**
 * 事件总线
 */
export declare class EventBus {
    private listeners;
    /**
     * 订阅事件
     */
    on(eventType: ControlEventType, listener: EventListener): () => void;
    /**
     * 取消订阅
     */
    off(eventType: ControlEventType, listener: EventListener): void;
    /**
     * 发布事件
     */
    emit(eventType: ControlEventType, data?: any): void;
    /**
     * 清除所有监听器
     */
    clear(): void;
    /**
     * 获取事件监听器数量
     */
    listenerCount(eventType: ControlEventType): number;
}
//# sourceMappingURL=EventBus.d.ts.map