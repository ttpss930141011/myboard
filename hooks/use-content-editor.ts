/**
 * 内容编辑器Hook - 专为Text组件设计
 *
 * 特性：
 * - 支持多行文本编辑（标题、描述等）
 * - Enter键自然换行
 * - Escape键取消编辑
 * - 空内容时自动删除组件
 * - 自动选中所有文本
 *
 * 与Document Editor的区别：
 * - 初始时选中所有文本
 * - 空内容时删除组件而不是保留
 */

import { useRef, useEffect, useCallback } from 'react'
import { useEditingCore, EditingCoreOptions } from './use-editing-core'
import { sanitizeLayerText } from '@/lib/security/validation'

export interface ContentEditorOptions {
  layerId: string
  initialValue: string
  onSave: (value: string) => void
  onDelete: () => void
  autoSelect?: boolean
  autoFocus?: boolean
}

export interface ContentEditor {
  // 继承核心状态
  isEditing: boolean
  editValue: string

  // 编辑操作
  startEdit: () => void
  stopEdit: () => void
  cancelEdit: () => void

  // DOM引用
  textareaRef: React.RefObject<HTMLTextAreaElement>

  // 事件处理器
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleBlur: () => void
  handleDoubleClick: (e: React.MouseEvent) => void
}

/**
 * 内容编辑器Hook
 * 专门为Text组件设计，支持可删除的文本内容
 */
export const useContentEditor = ({
  layerId,
  initialValue,
  onSave,
  onDelete,
  autoSelect = true,
  autoFocus = true
}: ContentEditorOptions): ContentEditor => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 使用核心编辑状态
  const core = useEditingCore({
    layerId,
    onSave: (value) => {
      const trimmed = value.trim()

      // Text组件特殊逻辑：空内容时删除组件
      if (trimmed === '') {
        onDelete()
        return
      }

      // 安全净化并保存
      const sanitized = sanitizeLayerText(value, 1000)
      onSave(sanitized)
    }
  })

  // 自动聚焦和选中
  useEffect(() => {
    if (core.isEditing && textareaRef.current) {
      // 延迟一帧以确保DOM准备就绪
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()

          // Text组件特性：自动选中所有文本
          if (autoSelect) {
            textareaRef.current.select()
          } else {
            // 将光标移到末尾
            const length = textareaRef.current.value.length
            textareaRef.current.setSelectionRange(length, length)
          }
        }
      })
    }
  }, [core.isEditing, autoSelect])

  /**
   * 处理键盘事件
   * 与Note组件相同：Enter键换行，不结束编辑
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()

      // Text组件特殊逻辑：如果原始值为空，取消时删除组件
      if (!initialValue || initialValue.trim() === '') {
        onDelete()
      } else {
        core.cancelEdit()
      }
    }
    // 重要：不处理Enter键！
    // 让textarea的默认行为生效，实现自然换行
  }, [core, initialValue, onDelete])

  /**
   * 处理文本变化
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    core.updateValue(e.target.value)
  }, [core])

  /**
   * 处理失焦
   */
  const handleBlur = useCallback(() => {
    // 失焦时保存（如果为空会自动删除）
    core.stopEdit()
  }, [core])

  /**
   * 处理双击进入编辑
   */
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!core.isEditing) {
      core.startEdit(initialValue)
    }
  }, [core, initialValue])

  /**
   * 包装的开始编辑函数
   */
  const startEdit = useCallback(() => {
    core.startEdit(initialValue)
  }, [core, initialValue])

  return {
    // 状态
    isEditing: core.isEditing,
    editValue: core.editValue,

    // 操作
    startEdit,
    stopEdit: core.stopEdit,
    cancelEdit: core.cancelEdit,

    // DOM引用
    textareaRef,

    // 事件处理器
    handleKeyDown,
    handleChange,
    handleBlur,
    handleDoubleClick
  }
}