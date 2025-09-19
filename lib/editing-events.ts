/**
 * 编辑事件系统
 *
 * 设计原则：
 * - 简单的事件总线，用于编辑器之间的通信
 * - 确保同一时间只有一个编辑器处于活动状态
 * - 轻量级实现，避免过度工程化
 */

export type EditingEventType = 'edit-start' | 'edit-stop' | 'edit-cancel'

export interface EditingEvent {
  type: EditingEventType
  layerId: string
  timestamp: number
}

/**
 * 简单的事件总线实现
 * 用于协调不同编辑器之间的状态
 */
export class EditingEventBus {
  private listeners: Map<EditingEventType, Set<(event: EditingEvent) => void>> = new Map()

  constructor() {
    // 初始化所有事件类型的监听器集合
    const eventTypes: EditingEventType[] = ['edit-start', 'edit-stop', 'edit-cancel']
    eventTypes.forEach(type => {
      this.listeners.set(type, new Set())
    })
  }

  /**
   * 发送事件
   */
  emit(event: EditingEvent): void {
    const listeners = this.listeners.get(event.type)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error(`Error in editing event listener:`, error)
        }
      })
    }
  }

  /**
   * 订阅事件
   * @returns 取消订阅的函数
   */
  on(type: EditingEventType, listener: (event: EditingEvent) => void): () => void {
    const listeners = this.listeners.get(type)
    if (listeners) {
      listeners.add(listener)
    }

    // 返回取消订阅函数
    return () => {
      const listeners = this.listeners.get(type)
      if (listeners) {
        listeners.delete(listener)
      }
    }
  }

  /**
   * 订阅一次性事件
   */
  once(type: EditingEventType, listener: (event: EditingEvent) => void): () => void {
    const wrappedListener = (event: EditingEvent) => {
      listener(event)
      this.off(type, wrappedListener)
    }
    return this.on(type, wrappedListener)
  }

  /**
   * 取消订阅
   */
  off(type: EditingEventType, listener: (event: EditingEvent) => void): void {
    const listeners = this.listeners.get(type)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * 清空所有监听器
   */
  clear(): void {
    this.listeners.forEach(listeners => listeners.clear())
  }
}

// 全局单例
export const editingBus = new EditingEventBus()

/**
 * React Hook: 使用编辑事件总线
 */
export const useEditingEvents = () => {
  return editingBus
}