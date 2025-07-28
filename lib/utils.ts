import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

import {
  Camera,
  Color,
  Layer,
  LayerType,
  PathLayer,
  Point,
  Side,
  XYWH,
} from '@/types/canvas'

const COLORS = ['#DC2626', '#D97706', '#059669', '#7C3AED', '#DB2777']

// Luminance calculation constants (ITU-R BT.709)
const LUMINANCE_RED_WEIGHT = 0.299
const LUMINANCE_GREEN_WEIGHT = 0.587
const LUMINANCE_BLUE_WEIGHT = 0.114
const LUMINANCE_THRESHOLD = 182

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const connectionIdToColor = (connectionId: number): string =>
  COLORS[connectionId % COLORS.length]

/**
 * Convert screen coordinates to canvas coordinates considering camera transform
 */
export const screenToCanvas = (
  screenX: number,
  screenY: number,
  camera: Camera
): Point => {
  const zoom = camera.zoom ?? 1
  return {
    x: Math.round((screenX - camera.x) / zoom),
    y: Math.round((screenY - camera.y) / zoom),
  }
}

/**
 * Convert canvas coordinates to screen coordinates
 */
export const canvasToScreen = (
  canvasX: number,
  canvasY: number,
  camera: Camera
): Point => {
  const zoom = camera.zoom ?? 1
  return {
    x: Math.round(canvasX * zoom + camera.x),
    y: Math.round(canvasY * zoom + camera.y),
  }
}

/**
 * Convert pointer event to canvas coordinates
 */
export const pointerEventToCanvasPoint = (
  e: React.PointerEvent,
  camera: Camera
): Point => {
  return screenToCanvas(e.clientX, e.clientY, camera)
}

/**
 * Get mouse position relative to an element
 */
export const getRelativePointerPosition = (
  e: React.PointerEvent | MouseEvent,
  element: Element
): Point => {
  const rect = element.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}

export const colorToCss = (color: Color) =>
  `#${color.r.toString(16).padStart(2, '0')}${color.g
    .toString(16)
    .padStart(2, '0')}${color.b.toString(16).padStart(2, '0')}`

export const resizeBounds = (
  bounds: XYWH,
  corner: Side,
  point: Point
): XYWH => {
  const result = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  }

  if ((corner & Side.Left) === Side.Left) {
    result.x = Math.min(point.x, bounds.x + bounds.width)
    result.width = Math.abs(bounds.x + bounds.width - point.x)
  }

  if ((corner & Side.Right) === Side.Right) {
    result.x = Math.min(point.x, bounds.x)
    result.width = Math.abs(point.x - bounds.x)
  }

  if ((corner & Side.Top) === Side.Top) {
    result.y = Math.min(point.y, bounds.y + bounds.height)
    result.height = Math.abs(bounds.y + bounds.height - point.y)
  }

  if ((corner & Side.Bottom) === Side.Bottom) {
    result.y = Math.min(point.y, bounds.y)
    result.height = Math.abs(point.y - bounds.y)
  }

  return result
}

export const findIntersectingLayersWithRectangle = (
  layerIds: readonly string[],
  layers: ReadonlyMap<string, Layer>,
  startPoint: Point,
  endPoint: Point
) => {
  const rect = {
    x: Math.min(startPoint.x, endPoint.x),
    y: Math.min(startPoint.y, endPoint.y),
    width: Math.abs(startPoint.x - endPoint.x),
    height: Math.abs(startPoint.y - endPoint.y),
  }

  const ids = []

  for (const layerId of layerIds) {
    const layer = layers.get(layerId)

    if (layer == null) {
      continue
    }

    const { x, y, height, width } = layer

    if (
      rect.x + rect.width > x &&
      rect.x < x + width &&
      rect.y + rect.height > y &&
      rect.y < y + height
    ) {
      ids.push(layerId)
    }
  }

  return ids
}

export const getContrastingTextColor = (color: Color) => {
  const luminance = 
    LUMINANCE_RED_WEIGHT * color.r + 
    LUMINANCE_GREEN_WEIGHT * color.g + 
    LUMINANCE_BLUE_WEIGHT * color.b

  return luminance > LUMINANCE_THRESHOLD ? 'black' : 'white'
}

export const penPointsToPathLayer = (
  points: number[][],
  color: Color
): PathLayer => {
  if (points.length < 2) {
    throw new Error('Cannot transform points with less than 2 points')
  }

  let left = Number.POSITIVE_INFINITY
  let top = Number.POSITIVE_INFINITY
  let right = Number.NEGATIVE_INFINITY
  let bottom = Number.NEGATIVE_INFINITY

  for (const point of points) {
    const [x, y] = point

    if (left > x) left = x

    if (top > y) top = y

    if (right < x) right = x

    if (bottom < y) bottom = y
  }

  // Account for stroke width and padding to match the rendered path
  const STROKE_SIZE = 16 // from getStroke size parameter
  const PADDING = 10 // from Path component padding
  const offset = STROKE_SIZE / 2 + PADDING

  return {
    type: LayerType.Path,
    x: left - offset,
    y: top - offset,
    width: right - left + offset * 2,
    height: bottom - top + offset * 2,
    fill: color,
    points: points.map(([x, y, pressure]) => [x - left + offset, y - top + offset, pressure]),
  }
}

export const getSvgPathFromStroke = (stroke: number[][]) => {
  if (!stroke.length) return ''

  const pathData = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...stroke[0], 'Q']
  )

  pathData.push('Z')
  return pathData.join(' ')
}

export const isPointInBounds = (point: Point, bounds: XYWH): boolean => {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  )
}

/**
 * Calculate intersection area between two rectangles
 */
export const calculateIntersectionArea = (rect1: XYWH, rect2: XYWH): number => {
  const left = Math.max(rect1.x, rect2.x)
  const right = Math.min(rect1.x + rect1.width, rect2.x + rect2.width)
  const top = Math.max(rect1.y, rect2.y)
  const bottom = Math.min(rect1.y + rect1.height, rect2.y + rect2.height)
  
  if (left >= right || top >= bottom) {
    return 0
  }
  
  return (right - left) * (bottom - top)
}

/**
 * Calculate element overlap ratio with frame (0-1)
 */
export const calculateOverlapRatio = (element: Layer, frame: Layer): number => {
  const elementArea = element.width * element.height
  if (elementArea === 0) return 0
  
  const overlapArea = calculateIntersectionArea(element, frame)
  return overlapArea / elementArea
}

/**
 * Check if element should be frame child (>50% overlap)
 */
export const shouldBeFrameChild = (element: Layer, frame: Layer): boolean => {
  return calculateOverlapRatio(element, frame) > 0.5
}

/**
 * Find best parent frame for element (highest overlap >50%)
 */
export const findBestParentFrame = (
  element: Layer,
  frames: (Layer & { id: string })[]
): (Layer & { id: string }) | null => {
  let bestFrame: (Layer & { id: string }) | null = null
  let maxOverlap = 0.5  // minimum threshold 50%
  
  for (const frame of frames) {
    if (frame.type !== LayerType.Frame) continue
    
    const overlap = calculateOverlapRatio(element, frame)
    if (overlap > maxOverlap) {
      maxOverlap = overlap
      bestFrame = frame
    }
  }
  
  return bestFrame
}
