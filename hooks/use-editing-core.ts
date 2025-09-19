/**
 * 核心编辑状态管理Hook
 *
 * 设计原则：
 * - 只管理状态，不处理键盘事件
 * - 提供纯粹的状态操作接口
 * - 通过事件系统实现编辑互斥
 *
 * 这是新编辑系统架构的核心，遵循"Good Taste"原则：
 * 消除特殊情况，让每个编辑器专注自己的职责
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { editingBus, EditingEvent } from '@/lib/editing-events'
import { sanitizeLayerText, sanitizeLayerName } from '@/lib/security/validation'

export interface EditingCoreOptions {
  layerId: string
  onSave: (value: string) => void
  onCancel?: () => void
}

export interface EditingCore {
  // 状态
  isEditing: boolean
  editValue: string

  // 状态操作
  startEdit: (initialValue: string) => void
  stopEdit: () => void
  cancelEdit: () => void
  updateValue: (value: string) => void

  // 安全保存
  saveWithSanitization: (maxLength?: number, useNameSanitization?: boolean) => void
}

/**
 * 核心编辑状态管理
 * 只负责状态管理和编辑互斥，不处理具体的键盘行为
 */
export const useEditingCore = ({
  layerId,
  onSave,
  onCancel
}: EditingCoreOptions): EditingCore => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const originalValueRef = useRef('')

  // 监听其他编辑器的启动事件，实现编辑互斥
  useEffect(() => {
    const handleOtherEdit = (event: EditingEvent) => {
      // 如果其他层开始编辑，退出当前编辑
      if (event.layerId !== layerId && isEditing) {
        cancelEdit()
      }
    }

    const unsubscribe = editingBus.on('edit-start', handleOtherEdit)
    return unsubscribe
  }, [layerId, isEditing])

  /**
   * 开始编辑
   */
  const startEdit = useCallback((initialValue: string) => {
    // 保存原始值，用于取消时恢复
    originalValueRef.current = initialValue
    setEditValue(initialValue)
    setIsEditing(true)

    // 通知其他编辑器退出编辑
    editingBus.emit({
      type: 'edit-start',
      layerId,
      timestamp: Date.now()
    })
  }, [layerId])

  /**
   * 停止编辑并保存
   */
  const stopEdit = useCallback(() => {
    if (!isEditing) return

    onSave(editValue)
    setIsEditing(false)

    editingBus.emit({
      type: 'edit-stop',
      layerId,
      timestamp: Date.now()
    })
  }, [isEditing, editValue, layerId, onSave])

  /**
   * 取消编辑，恢复原始值
   */
  const cancelEdit = useCallback(() => {
    if (!isEditing) return

    setEditValue(originalValueRef.current)
    setIsEditing(false)

    if (onCancel) {
      onCancel()
    }

    editingBus.emit({
      type: 'edit-cancel',
      layerId,
      timestamp: Date.now()
    })
  }, [isEditing, layerId, onCancel])

  /**
   * 更新编辑值
   */
  const updateValue = useCallback((value: string) => {
    setEditValue(value)
  }, [])

  /**
   * 安全保存：带净化的保存操作
   * 这保持了原有的安全性，同时让使用者可以选择净化方式
   */
  const saveWithSanitization = useCallback((
    maxLength: number = 1000,
    useNameSanitization: boolean = false
  ) => {
    if (!isEditing) return

    // 根据类型选择净化函数
    const sanitized = useNameSanitization
      ? sanitizeLayerName(editValue)
      : sanitizeLayerText(editValue, maxLength)

    onSave(sanitized)
    setIsEditing(false)

    editingBus.emit({
      type: 'edit-stop',
      layerId,
      timestamp: Date.now()
    })
  }, [isEditing, editValue, layerId, onSave])

  return {
    isEditing,
    editValue,
    startEdit,
    stopEdit,
    cancelEdit,
    updateValue,
    saveWithSanitization
  }
}