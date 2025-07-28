import { memo } from 'react'

import { colorToCss } from '@/lib/utils'
import { FrameLayer } from '@/types/canvas'
import { useCanvasStore } from '@/stores/canvas-store'
import { useLayerEditing } from '@/hooks/use-layer-editing'

interface FrameProps {
  id: string
  layer: FrameLayer
  onPointerDown?: (e: React.PointerEvent, id: string) => void
  selectionColor?: string
  children?: React.ReactNode
}

export const Frame = memo(({
  id,
  layer,
  onPointerDown,
  selectionColor,
  children,
}: FrameProps) => {
  const { x, y, width, height, fill, strokeColor, strokeWidth, name } = layer
  const updateLayer = useCanvasStore(state => state.updateLayer)
  
  // Check if Frame is currently selected
  const isSelected = Boolean(selectionColor)

  // 使用高效能編輯 Hook
  const {
    isEditing,
    editValue,
    inputRef,
    startEditing,
    stopEditing,
    handleKeyDown,
    handleChange,
  } = useLayerEditing({
    id,
    initialValue: name || 'Frame',
    onSave: (value) => updateLayer(id, { name: value || 'Frame' }),
    allowEmpty: false,
    autoSelect: true,
  })

  return (
    <g>
      {/* Frame clip path definition */}
      <defs>
        <clipPath id={`frame-clip-${id}`}>
          <rect x={x} y={y} width={width} height={height} rx={8} ry={8} />
        </clipPath>
      </defs>
      
      {/* Frame background - 使用絕對座標 */}
      <rect
        className="frame-background"
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill ? colorToCss(fill) : 'transparent'}
        stroke={strokeColor ? colorToCss(strokeColor) : '#E5E7EB'}
        strokeWidth={strokeWidth || 2}
        strokeDasharray="6 3"
        rx={8}
        ry={8}
        onPointerDown={onPointerDown ? (e) => onPointerDown(e, id) : undefined}
        style={{
          cursor: 'default',
          filter: selectionColor ? 'drop-shadow(0 0 0 2px ' + selectionColor + ')' : undefined
        }}
      />
      
      {/* Frame label */}
      {(name || isEditing) && (
        <foreignObject 
          x={x + 8} 
          y={y - 24} 
          width={Math.min(200, width - 16)} 
          height={24}
          style={{ pointerEvents: isEditing ? 'auto' : 'none' }}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={handleChange}
              onBlur={stopEditing}
              onKeyDown={handleKeyDown}
              className="bg-white border border-blue-500 rounded px-2 py-0.5 text-xs font-medium text-gray-700 outline-none"
              style={{ 
                width: `${Math.max(60, editValue.length * 7 + 20)}px`,
                maxWidth: '200px',
                height: '20px'
              }}
            />
          ) : (
            <div 
              className="flex items-center h-full"
              onDoubleClick={startEditing}
              style={{ pointerEvents: 'auto', cursor: 'text' }}
            >
              <span className="text-xs font-medium text-gray-600 bg-white px-2 py-0.5 rounded truncate select-none">
                {name}
              </span>
            </div>
          )}
        </foreignObject>
      )}
      
      {/* Frame contents clipped to bounds - children使用絕對座標 */}
      <g className="frame-contents" clipPath={`url(#frame-clip-${id})`}>
        {children}
      </g>
    </g>
  )
})

Frame.displayName = 'Frame'