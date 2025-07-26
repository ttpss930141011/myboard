import { Kalam } from 'next/font/google'
import { useEffect, useRef, useState } from 'react'

import { NoteLayer } from '@/types/canvas'
import { cn, colorToCss, getContrastingTextColor } from '@/lib/utils'
import { useCanvasStore } from '@/stores/canvas-store'
import { useLayerEditing } from '@/hooks/use-layer-editing'

const font = Kalam({ subsets: ['latin'], weight: ['400'] })

// Binary search algorithm to find optimal font size
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

interface NoteProps {
  id: string
  layer: NoteLayer
  onPointerDown?: (e: React.PointerEvent, id: string) => void
  selectionColor?: string
}

export const Note = ({
  layer,
  onPointerDown,
  id,
  selectionColor,
}: NoteProps) => {
  const { x, y, width, height, fill, value } = layer
  const updateLayer = useCanvasStore(state => state.updateLayer)
  const containerRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(24)

  // 使用 useLayerEditing Hook，注意 Note 組件允許空值
  const {
    isEditing,
    editValue,
    textareaRef,
    startEditing,
    stopEditing,
    handleKeyDown,
    handleChange,
  } = useLayerEditing({
    id,
    initialValue: value || '',
    onSave: (newValue) => {
      // Note 組件允許空值，不會自動刪除
      updateLayer(id, { value: newValue })
    },
    allowEmpty: true, // Note 組件的特殊需求：允許空值
    autoSelect: false, // Note 通常不需要自動選中所有文本
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
    `
    measureElement.textContent = value || editValue || 'Placeholder'
    containerRef.current.appendChild(measureElement)
    
    // Reset to measure natural size
    measureElement.style.fontSize = '96px'
    
    // Calculate available space (with padding)
    const padding = 32 // 16px on each side for better spacing
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


  // Note 組件特有的雙擊編輯處理
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    startEditing(e)
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
        backgroundColor: fill ? colorToCss(fill) : '#000',
      }}
      className="shadow-md drop-shadow-xl"
    >
      <div 
        ref={containerRef} 
        className="h-full w-full flex items-center justify-center p-4 relative overflow-hidden"
      >
        {/* Conditionally render textarea or div based on editing state */}
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={handleChange}
            onBlur={stopEditing}
            onKeyDown={handleKeyDown}
            className={cn(
              'resize-none bg-transparent border-none outline-none text-center w-full h-full overflow-y-hidden',
              'focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-transparent',
              font.className
            )}
            style={{
              fontSize: `${fontSize}px`,
              color: fill ? getContrastingTextColor(fill) : '#000',
              lineHeight: '1.4',
              padding: 0,
              margin: 0,
              caretColor: fill ? getContrastingTextColor(fill) : '#000',
            }}
          />
        ) : (
          <div
            onDoubleClick={handleDoubleClick}
            className={cn(
              'text-center w-full h-full flex items-center justify-center overflow-hidden cursor-text',
              font.className
            )}
            style={{
              fontSize: `${fontSize}px`,
              color: fill ? getContrastingTextColor(fill) : '#000',
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
