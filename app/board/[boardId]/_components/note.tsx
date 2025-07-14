import { Kalam } from 'next/font/google'
import ContentEditable, { ContentEditableEvent } from 'react-contenteditable'

import { NoteLayer } from '@/types/canvas'
import { cn, colorToCss, getContrastingTextColor } from '@/lib/utils'
import { useCanvasStore } from '@/stores/canvas-store'

const font = Kalam({ subsets: ['latin'], weight: ['400'] })

const calculateFontSize = (width: number, height: number, textLength: number) => {
  const maxFontSize = 96
  const minFontSize = 10
  
  // Calculate area available for text (accounting for padding)
  const effectiveWidth = width - 24 // 12px padding on each side
  const effectiveHeight = height - 24
  const area = effectiveWidth * effectiveHeight
  
  // Calculate characters per line (approximate)
  const avgCharWidth = 0.6 // Average character width ratio
  const charsPerLine = Math.floor(effectiveWidth / (maxFontSize * avgCharWidth))
  
  // Estimate number of lines needed
  const estimatedLines = Math.ceil(textLength / charsPerLine)
  
  // Calculate font size based on available height and number of lines
  let fontSize = Math.min(effectiveHeight / (estimatedLines * 1.4), maxFontSize)
  
  // Adjust font size based on text length
  if (textLength === 0) {
    fontSize = maxFontSize * 0.6
  } else if (textLength < 20) {
    fontSize = Math.min(maxFontSize * 0.8, fontSize)
  } else if (textLength < 50) {
    fontSize = Math.min(maxFontSize * 0.6, fontSize)
  } else if (textLength < 100) {
    fontSize = Math.min(maxFontSize * 0.4, fontSize)
  } else {
    // For longer text, scale down more aggressively
    const scaleFactor = Math.max(0.15, 1 - (textLength / 500))
    fontSize = Math.min(fontSize, maxFontSize * scaleFactor)
  }
  
  return Math.max(fontSize, minFontSize)
}

interface NoteProps {
  id: string
  layer: NoteLayer
  onPointerDown: (e: React.PointerEvent, id: string) => void
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

  const handleContentChange = (e: ContentEditableEvent) => {
    updateLayer(id, { value: e.target.value })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Escape: Exit editing mode
      e.preventDefault()
      ;(e.target as HTMLElement).blur()
    }
    // Let Enter key work naturally for line breaks
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    // Prevent pasting HTML, only paste plain text
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  return (
    <foreignObject
      x={x}
      y={y}
      width={width}
      height={height}
      onPointerDown={e => onPointerDown(e, id)}
      style={{
        outline: selectionColor ? `1px solid ${selectionColor}` : 'none',
        backgroundColor: fill ? colorToCss(fill) : '#000',
      }}
      className="shadow-md drop-shadow-xl"
    >
      <div className="h-full w-full flex items-center justify-center p-3">
        <ContentEditable
          html={value || 'Text'}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          className={cn(
            'text-center outline-none',
            font.className
          )}
          style={{
            fontSize: calculateFontSize(width, height, value?.replace(/<[^>]*>/g, '').length || 4),
            color: fill ? getContrastingTextColor(fill) : '#000',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.4',
            minHeight: '1em',
          }}
        />
      </div>
    </foreignObject>
  )
}
