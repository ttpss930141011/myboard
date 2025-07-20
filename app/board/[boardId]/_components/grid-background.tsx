'use client'

import { Camera } from '@/types/canvas'

interface GridBackgroundProps {
  camera: Camera
  width: number
  height: number
}

/**
 * Grid background component for canvas
 * Follows Single Responsibility Principle - only handles grid rendering
 */
export const GridBackground = ({ camera, width, height }: GridBackgroundProps) => {
  const zoom = camera.zoom ?? 1
  const gridSize = 50
  const scaledGridSize = gridSize * zoom

  // Calculate grid offset based on camera position
  const offsetX = camera.x % scaledGridSize
  const offsetY = camera.y % scaledGridSize

  // Calculate how many grid lines we need
  const horizontalLines = Math.ceil(height / scaledGridSize) + 1
  const verticalLines = Math.ceil(width / scaledGridSize) + 1

  return (
    <g className="pointer-events-none">
      <defs>
        <pattern
          id="grid"
          x={offsetX}
          y={offsetY}
          width={scaledGridSize}
          height={scaledGridSize}
          patternUnits="userSpaceOnUse"
        >
          <line
            x1="0"
            y1="0"
            x2={scaledGridSize}
            y2="0"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2={scaledGridSize}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="url(#grid)"
      />
    </g>
  )
}