import { Kalam } from 'next/font/google'
import { useRef, useEffect, useState } from 'react'

import { TextLayer } from '@/types/canvas'
import { cn, colorToCss } from '@/lib/utils'
import { useCanvasStore } from '@/stores/canvas-store'
import { useLayerEditing } from '@/hooks/use-layer-editing'

const font = Kalam({ subsets: ['latin'], weight: ['400'] })

// Use the same binary search algorithm as Note component
const findOptimalFontSize = (
  element: HTMLElement,
  containerWidth: number,
  containerHeight: number,
  minSize: number = 10,
  maxSize: number = 96
): number => {
  let low = minSize
  let high = maxSize
  let bestSize = minSize
  
  // Save original styles
  const originalWhiteSpace = element.style.whiteSpace
  const originalWordWrap = element.style.wordWrap
  
  // Ensure text wrapping is enabled for measurement
  element.style.whiteSpace = 'pre-wrap'
  element.style.wordWrap = 'break-word'
  
  // Binary search with 0.5px precision
  while (high - low > 0.5) {
    const mid = (low + high) / 2
    element.style.fontSize = `${mid}px`
    
    // Force reflow to get accurate measurements
    element.offsetHeight
    
    const isOverflowing = 
      element.scrollHeight > containerHeight || 
      element.scrollWidth > containerWidth
    
    if (isOverflowing) {
      high = mid
    } else {
      bestSize = mid
      low = mid
    }
  }
  
  // Final check to ensure no overflow
  element.style.fontSize = `${bestSize}px`
  element.offsetHeight // Force reflow
  
  while ((element.scrollHeight > containerHeight || element.scrollWidth > containerWidth) && bestSize > minSize) {
    bestSize -= 0.5
    element.style.fontSize = `${bestSize}px`
    element.offsetHeight // Force reflow
  }
  
  // Restore original styles
  element.style.whiteSpace = originalWhiteSpace
  element.style.wordWrap = originalWordWrap
  
  return bestSize
}

interface TextProps {
  id: string
  layer: TextLayer
  onPointerDown?: (e: React.PointerEvent, id: string) => void
  selectionColor?: string
}

export const Text = ({
  layer,
  onPointerDown,
  id,
  selectionColor,
}: TextProps) => {
  const { x, y, width, height, fill, value } = layer
  const updateLayer = useCanvasStore(state => state.updateLayer)
  const deleteLayer = useCanvasStore(state => state.deleteLayer)
  const [fontSize, setFontSize] = useState(24)
  const containerRef = useRef<HTMLDivElement>(null)

  // 使用 useLayerEditing Hook，配置 Text 組件的特殊需求
  const {
    isEditing,
    editValue,
    textareaRef,
    startEditing,
    stopEditing,
    handleKeyDown: baseHandleKeyDown,
    handleChange,
  } = useLayerEditing({
    id,
    initialValue: value || '',
    onSave: (newValue) => {
      // Text 組件的保存邏輯：如果內容為空則刪除
      const trimmedValue = newValue.trim()
      if (trimmedValue === '') {
        deleteLayer(id)
      } else {
        updateLayer(id, { value: newValue })
      }
    },
    onDelete: () => deleteLayer(id),
    allowEmpty: false, // Text 組件不允許空值
    autoSelect: true,
  })

  // Auto-resize text to fit container
  useEffect(() => {
    if (!containerRef.current) return
    
    // Create a temporary element for measurement
    const measureElement = document.createElement('div')
    measureElement.style.cssText = `
      position: absolute;
      visibility: hidden;
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: ${font.style.fontFamily};
      text-align: center;
    `
    measureElement.textContent = value || editValue || 'Placeholder'
    containerRef.current.appendChild(measureElement)
    
    // Reset to measure natural size
    measureElement.style.fontSize = '96px'
    
    // Calculate available space (with padding)
    const padding = 16 // 8px on each side
    const availableWidth = width - padding
    const availableHeight = height - padding
    
    // Find optimal font size using binary search
    const optimalSize = findOptimalFontSize(
      measureElement,
      availableWidth,
      availableHeight,
      10,
      96
    )
    
    setFontSize(optimalSize)
    
    // Clean up the temporary element
    containerRef.current.removeChild(measureElement)
  }, [width, height, value, editValue])

  // Text 組件的特殊鍵盤處理（基於 Hook 的處理器）
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 首先執行基礎鍵盤處理（包含 Escape 邏輯）
    baseHandleKeyDown(e)
    
    // Text 組件特殊邏輯：Escape 時如果原始值為空，則刪除圖層
    if (e.key === 'Escape') {
      const originalValue = value || ''
      if (originalValue.trim() === '') {
        deleteLayer(id)
      }
    }
    // Enter 鍵自然換行（與 Note 組件相同）
  }

  return (
    <foreignObject
      x={x}
      y={y}
      width={width}
      height={height}
      onPointerDown={e => {
        if (!isEditing && onPointerDown) {
          onPointerDown(e, id)
        }
      }}
      style={{
        outline: selectionColor ? `1px solid ${selectionColor}` : 'none',
      }}
      className=""
    >
      <div 
        ref={containerRef}
        className="h-full w-full flex items-center justify-center p-2 relative overflow-hidden"
      >
        {/* 根據編輯狀態條件渲染 textarea 或 div */}
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={handleChange}
            onBlur={stopEditing}
            onKeyDown={handleKeyDown}
            className={cn(
              'resize-none bg-transparent border-none outline-none text-center w-full h-full drop-shadow-md overflow-y-hidden',
              'focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-transparent',
              font.className
            )}
            style={{
              fontSize: `${fontSize}px`,
              color: fill ? colorToCss(fill) : '#000',
              lineHeight: '1.4',
              padding: 0,
              margin: 0,
              caretColor: fill ? colorToCss(fill) : '#000',
            }}
          />
        ) : (
          <div
            onDoubleClick={startEditing}
            className={cn(
              'text-center w-full h-full flex items-center justify-center overflow-hidden cursor-text drop-shadow-md',
              font.className
            )}
            style={{
              fontSize: `${fontSize}px`,
              color: fill ? colorToCss(fill) : '#000',
              lineHeight: '1.4',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
            }}
          >
            {value || ''}
          </div>
        )}
        
        
      </div>
    </foreignObject>
  )
}
