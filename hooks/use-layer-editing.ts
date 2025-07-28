import { useState, useRef, useEffect, useCallback } from 'react'
import { useCanvasStore } from '@/stores/canvas-store'
import { sanitizeLayerText } from '@/lib/security/validation'

interface UseLayerEditingOptions {
  id: string
  initialValue: string
  onSave: (value: string) => void
  onDelete?: () => void
  allowEmpty?: boolean
  autoSelect?: boolean
}

/**
 * 高效能的圖層編輯 Hook
 * 
 * 優化特性：
 * - 使用 useCallback 穩定化事件處理函數
 * - 精確的 store 選擇器避免不必要重渲染
 * - 記憶體使用優化
 */
export const useLayerEditing = ({
  id,
  initialValue,
  onSave,
  onDelete,
  allowEmpty = true,
  autoSelect = true
}: UseLayerEditingOptions) => {
  // 精確訂閱：只有當前圖層的編輯狀態變化才重渲染
  const isEditing = useCanvasStore(state => state.editingLayerId === id)
  const setEditingLayer = useCanvasStore(state => state.setEditingLayer)
  
  const [editValue, setEditValue] = useState(initialValue)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 同步外部值變化
  useEffect(() => {
    if (!isEditing) {
      setEditValue(initialValue)
    }
  }, [initialValue, isEditing])

  // 自動聚焦和選中文本
  useEffect(() => {
    if (isEditing) {
      // 優先使用 inputRef，否則使用 textareaRef
      const activeRef = inputRef.current || textareaRef.current
      if (activeRef) {
        activeRef.focus()
        if (autoSelect) {
          activeRef.select()
        }
      }
    }
  }, [isEditing, autoSelect])

  // 穩定化的事件處理函數
  const startEditing = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (!isEditing) {
      setEditingLayer(id)
      setEditValue(initialValue)
    }
  }, [id, initialValue, isEditing, setEditingLayer])

  const stopEditing = useCallback(() => {
    setEditingLayer(null)
    const trimmedValue = editValue.trim()
    
    if (!allowEmpty && trimmedValue === '' && onDelete) {
      onDelete()
    } else {
      // Sanitize input before saving to prevent XSS
      const valueToSave = allowEmpty ? editValue : (trimmedValue || initialValue)
      const sanitizedValue = sanitizeLayerText(valueToSave, 1000)
      onSave(sanitizedValue)
    }
  }, [editValue, allowEmpty, initialValue, onSave, onDelete, setEditingLayer])

  const cancelEditing = useCallback(() => {
    setEditingLayer(null)
    setEditValue(initialValue)
  }, [initialValue, setEditingLayer])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      cancelEditing()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      stopEditing()
    }
    // 其他鍵行為由各組件自定義
  }, [cancelEditing, stopEditing])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditValue(e.target.value)
  }, [])

  return {
    // 狀態
    isEditing,
    editValue,
    textareaRef,
    inputRef,
    
    // 事件處理器
    startEditing,
    stopEditing,
    cancelEditing,
    handleKeyDown,
    handleChange,
    
    // 手動控制
    setEditValue,
  }
}