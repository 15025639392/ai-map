import { ControlEventType, IControlEvent, EventListener } from './types.js';

/**
 * 事件总线
 */
export class EventBus {
  private listeners: Map<ControlEventType, Set<EventListener>> = new Map();

  /**
   * 订阅事件
   */
  on(eventType: ControlEventType, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);

    // 返回取消订阅函数
    return () => this.off(eventType, listener);
  }

  /**
   * 取消订阅
   */
  off(eventType: ControlEventType, listener: EventListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * 发布事件
   */
  emit(eventType: ControlEventType, data?: any): void {
    const event: IControlEvent = {
      type: eventType,
      data,
      timestamp: Date.now(),
    };

    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error(`[EventBus] Error in listener for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * 清除所有监听器
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * 获取事件监听器数量
   */
  listenerCount(eventType: ControlEventType): number {
    return this.listeners.get(eventType)?.size || 0;
  }
}
