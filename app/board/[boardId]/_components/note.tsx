import { Kalam } from 'next/font/google'
import { useEffect, useRef, useState } from 'react'

import { NoteLayer } from '@/types/canvas'
import { cn, colorToCss, getContrastingTextColor } from '@/lib/utils'
import { useCanvasStore } from '@/stores/canvas-store'

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
  const editingLayerId = useCanvasStore(state => state.editingLayerId)
  const setEditingLayer = useCanvasStore(state => state.setEditingLayer)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [fontSize, setFontSize] = useState(24)
  const isEditing = editingLayerId === id
  const [editValue, setEditValue] = useState(value || '')

  // Update edit value when layer value changes
  useEffect(() => {
    setEditValue(value || '')
  }, [value])

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


  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isEditing) {
      setEditingLayer(id)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditValue(e.target.value)
  }

  const handleTextareaBlur = () => {
    setEditingLayer(null)
    updateLayer(id, { value: editValue })
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setEditingLayer(null)
      setEditValue(value || '')
    }
    // Let Enter key work naturally for line breaks
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
            onChange={handleTextareaChange}
            onBlur={handleTextareaBlur}
            onKeyDown={handleTextareaKeyDown}
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
            autoFocus
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
