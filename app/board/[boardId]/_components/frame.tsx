import { memo } from 'react'

import { colorToCss } from '@/lib/utils'
import { FrameLayer } from '@/types/canvas'

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

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Frame background - optional fill */}
      <rect
        className="frame-background"
        x={0}
        y={0}
        width={width}
        height={height}
        fill={fill ? colorToCss(fill) : 'transparent'}
        stroke={strokeColor ? colorToCss(strokeColor) : '#E5E7EB'}
        strokeWidth={strokeWidth || 2}
        strokeDasharray="6 3"
        rx={8}
        ry={8}
        onPointerDown={e => onPointerDown?.(e, id)}
        style={{
          cursor: 'move',
          filter: selectionColor ? 'drop-shadow(0 0 0 2px ' + selectionColor + ')' : undefined
        }}
      />
      
      {/* Frame label */}
      {name && (
        <foreignObject x={8} y={-20} width={width - 16} height={20}>
          <div className="flex items-center">
            <span className="text-xs font-medium text-gray-600 bg-white px-2 py-0.5 rounded truncate">
              {name}
            </span>
          </div>
        </foreignObject>
      )}
      
      {/* Frame contents clipped to bounds */}
      <g className="frame-contents" clipPath={`url(#frame-clip-${id})`}>
        <defs>
          <clipPath id={`frame-clip-${id}`}>
            <rect x={0} y={0} width={width} height={height} rx={8} ry={8} />
          </clipPath>
        </defs>
        {children}
      </g>
    </g>
  )
})

Frame.displayName = 'Frame'