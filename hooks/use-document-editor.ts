/**
 * 文档编辑器Hook - 专为Note组件设计
 *
 * 特性：
 * - 支持多行文本编辑
 * - Enter键自然换行
 * - Escape键取消编辑
 * - 允许空内容
 *
 * 这是"Good Taste"设计的体现：
 * 承认Note组件的独特需求，不强行统一
 */

import { useRef, useEffect, useCallback } from 'react'
import { useEditingCore, EditingCoreOptions } from './use-editing-core'
import { sanitizeLayerText } from '@/lib/security/validation'

export interface DocumentEditorOptions {
  layerId: string
  initialValue: string
  onSave: (value: string) => void
  allowEmpty?: boolean
  autoFocus?: boolean
}

export interface DocumentEditor {
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
 * 文档编辑器Hook
 * 专门为Note组件设计，支持多行文本编辑
 */
export const useDocumentEditor = ({
  layerId,
  initialValue,
  onSave,
  allowEmpty = true,
  autoFocus = true
}: DocumentEditorOptions): DocumentEditor => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 使用核心编辑状态
  const core = useEditingCore({
    layerId,
    onSave: (value) => {
      // 文档编辑器特殊逻辑：允许空内容
      if (!allowEmpty && value.trim() === '') {
        return
      }

      // 安全净化
      const sanitized = sanitizeLayerText(value, 1000)
      onSave(sanitized)
    }
  })

  // 自动聚焦
  useEffect(() => {
    if (core.isEditing && autoFocus && textareaRef.current) {
      // 延迟一帧以确保DOM准备就绪
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          // 将光标移到末尾
          const length = textareaRef.current.value.length
          textareaRef.current.setSelectionRange(length, length)
        }
      })
    }
  }, [core.isEditing, autoFocus])

  /**
   * 处理键盘事件
   * Note组件的核心特性：Enter键换行，而不是结束编辑
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      core.cancelEdit()
    }
    // 重要：不处理Enter键！
    // 让textarea的默认行为生效，实现自然换行
    // 这是与其他编辑器的关键区别
  }, [core])

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