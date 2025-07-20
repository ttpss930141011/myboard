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

export const pointerEventToCanvasPoint = (
  e: React.PointerEvent,
  camera: Camera
) => {
  // Support zoom with backward compatibility
  const zoom = camera.zoom ?? 1
  return {
    x: Math.round((e.clientX - camera.x) / zoom),
    y: Math.round((e.clientY - camera.y) / zoom),
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
