import getStroke from 'perfect-freehand'

import { getSvgPathFromStroke } from '@/lib/utils'

interface PathProps {
  x: number
  y: number
  points: number[][]
  fill: string
  onPointerDown?: (e: React.PointerEvent) => void
  stroke?: string
}

export const Path = ({
  x,
  y,
  points,
  fill,
  onPointerDown,
  stroke,
}: PathProps) => {
  // Calculate the bounding box for the path
  let minX = 0, minY = 0, maxX = 0, maxY = 0
  
  if (points.length > 0) {
    minX = maxX = points[0][0]
    minY = maxY = points[0][1]
    
    points.forEach(([px, py]) => {
      minX = Math.min(minX, px)
      maxX = Math.max(maxX, px)
      minY = Math.min(minY, py)
      maxY = Math.max(maxY, py)
    })
  }
  
  // Add padding for stroke width and easier selection
  const padding = 10
  
  return (
    <g style={{ transform: `translate(${x}px, ${y}px)` }}>
      {/* Invisible rectangle for capturing pointer events in the entire bounding box */}
      <rect
        x={minX - padding}
        y={minY - padding}
        width={maxX - minX + 2 * padding}
        height={maxY - minY + 2 * padding}
        fill="transparent"
        onPointerDown={onPointerDown}
      />
      {/* The actual path */}
      <path
        className="drop-shadow-md"
        d={getSvgPathFromStroke(
          getStroke(points, {
            size: 16,
            thinning: 0.5,
            smoothing: 0.5,
            streamline: 0.5,
          })
        )}
        fill={fill}
        stroke={stroke}
        strokeWidth={1}
        pointerEvents="none"
      />
    </g>
  )
}
