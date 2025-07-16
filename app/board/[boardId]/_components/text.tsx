import { Kalam } from 'next/font/google'
import { useState, useRef, useEffect } from 'react'

import { TextLayer } from '@/types/canvas'
import { cn, colorToCss } from '@/lib/utils'
import { useCanvasStore } from '@/stores/canvas-store'

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
  onPointerDown: (e: React.PointerEvent, id: string) => void
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
  const editingLayerId = useCanvasStore(state => state.editingLayerId)
  const setEditingLayer = useCanvasStore(state => state.setEditingLayer)
  const isEditing = editingLayerId === id
  const [editValue, setEditValue] = useState(value || '')
  const [fontSize, setFontSize] = useState(24)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Update edit value when layer value changes
  useEffect(() => {
    setEditValue(value || '')
  }, [value])

  // Auto-resize text to fit container
  useEffect(() => {
    if (!containerRef.current || !textareaRef.current) return
    
    // Always use textarea for measurement (since it's always present)
    const measureElement = textareaRef.current
    
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
  }, [width, height, value, editValue])

  // Handle keyboard-triggered editing
  useEffect(() => {
    if (isEditing && textareaRef.current && editValue.length === 1 && value && value.length > 1) {
      // This was triggered by keyboard input that replaced all text
      // Place cursor after the typed character
      textareaRef.current.setSelectionRange(1, 1)
    }
  }, [isEditing, editValue, value])

  const handleDoubleClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    e.stopPropagation()
    if (!isEditing) {
      setEditingLayer(id)
    }
    // Select all text on double-click
    e.currentTarget.select()
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
    // Let Enter key work naturally for line breaks (same as Note)
  }

  return (
    <foreignObject
      x={x}
      y={y}
      width={width}
      height={height}
      onPointerDown={e => {
        // Prevent dragging when editing
        if (!isEditing) {
          onPointerDown(e, id)
        }
      }}
      style={{
        outline: selectionColor ? `1px solid ${selectionColor}` : 'none',
      }}
    >
      <div 
        ref={containerRef}
        className="h-full w-full flex items-center justify-center p-2 relative overflow-hidden"
      >
        {/* Always render the textarea for natural cursor positioning */}
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={handleTextareaChange}
          onBlur={handleTextareaBlur}
          onKeyDown={handleTextareaKeyDown}
          onDoubleClick={handleDoubleClick}
          onFocus={() => {
            // Enter edit mode when textarea gets focus from click
            if (!isEditing && selectionColor) {
              setEditingLayer(id)
            }
          }}
          onMouseDown={(e) => {
            // Prevent dragging when clicking inside textarea during edit mode
            if (isEditing) {
              e.stopPropagation()
            }
          }}
          readOnly={!isEditing}
          className={cn(
            'resize-none bg-transparent border-none outline-none text-center w-full h-full drop-shadow-md overflow-y-hidden',
            'focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-transparent',
            font.className,
            // Hide cursor and selection when not editing
            !isEditing && 'cursor-text'
          )}
          style={{
            fontSize: `${fontSize}px`,
            color: fill ? colorToCss(fill) : '#000',
            lineHeight: '1.4',
            padding: 0,
            margin: 0,
            // Control caret visibility
            caretColor: isEditing ? (fill ? colorToCss(fill) : '#000') : 'transparent',
          }}
        />
        
        {/* Placeholder text overlay */}
        {(!value || value === '') && !isEditing && (
          <div 
            className={cn(
              'absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 p-2',
              font.className
            )}
            style={{
              fontSize: `${Math.min(fontSize, 24)}px`,
              color: fill ? colorToCss(fill) : '#000',
            }}
          >
            Double-click to edit
          </div>
        )}
        
      </div>
    </foreignObject>
  )
}
