/**
 * 表单编辑器Hook - 专为Frame组件设计
 *
 * 特性：
 * - 单行输入（使用input而非textarea）
 * - Enter键完成编辑（符合表单习惯）
 * - Escape键取消编辑
 * - 自动选中所有文本
 * - 不允许空内容
 *
 * 这是唯一符合原有useLayerEditing行为的编辑器
 * 因为Frame的标签输入本就应该是单行的
 */

import { useRef, useEffect, useCallback } from 'react'
import { useEditingCore, EditingCoreOptions } from './use-editing-core'
import { sanitizeLayerName } from '@/lib/security/validation'

export interface FormEditorOptions {
  layerId: string
  initialValue: string
  onSave: (value: string) => void
  defaultValue?: string
  autoSelect?: boolean
  autoFocus?: boolean
}

export interface FormEditor {
  // 继承核心状态
  isEditing: boolean
  editValue: string

  // 编辑操作
  startEdit: () => void
  stopEdit: () => void
  cancelEdit: () => void

  // DOM引用
  inputRef: React.RefObject<HTMLInputElement>

  // 事件处理器
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleBlur: () => void
  handleDoubleClick: (e: React.MouseEvent) => void
}

/**
 * 表单编辑器Hook
 * 专门为Frame组件设计，提供表单式的单行输入体验
 */
export const useFormEditor = ({
  layerId,
  initialValue,
  onSave,
  defaultValue = 'Frame',
  autoSelect = true,
  autoFocus = true
}: FormEditorOptions): FormEditor => {
  const inputRef = useRef<HTMLInputElement>(null)

  // 使用核心编辑状态
  const core = useEditingCore({
    layerId,
    onSave: (value) => {
      // Frame组件特殊逻辑：不允许空值，使用默认值
      const finalValue = value.trim() || defaultValue

      // 使用名称净化（长度限制为100字符）
      const sanitized = sanitizeLayerName(finalValue)
      onSave(sanitized)
    }
  })

  // 自动聚焦和选中
  useEffect(() => {
    if (core.isEditing && inputRef.current) {
      // 延迟一帧以确保DOM准备就绪
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus()

          // Frame组件特性：自动选中所有文本
          if (autoSelect) {
            inputRef.current.select()
          }
        }
      })
    }
  }, [core.isEditing, autoSelect])

  /**
   * 处理键盘事件
   * Frame组件的独特行为：Enter键结束编辑
   * 这是三种编辑器中唯一符合表单输入习惯的
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      core.cancelEdit()
    } else if (e.key === 'Enter') {
      // Frame组件特性：Enter键完成编辑
      // 这符合单行输入框的标准行为
      e.preventDefault()
      core.stopEdit()
    }
  }, [core])

  /**
   * 处理文本变化
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
    inputRef,

    // 事件处理器
    handleKeyDown,
    handleChange,
    handleBlur,
    handleDoubleClick
  }
}