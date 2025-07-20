import { shallow } from 'zustand/shallow'
import { useCanvasStore } from '@/stores/canvas-store'
import { Layer, XYWH } from '@/types/canvas'

function boundingBox(layers: Layer[]): XYWH | null {
  const first = layers[0]

  if (!first) {
    return null
  }

  let left = first.x
  let right = first.x + first.width
  let top = first.y
  let bottom = first.y + first.height

  for (let i = 1; i < layers.length; i++) {
    const { x, y, width, height } = layers[i]

    if (left > x) {
      left = x
    }

    if (right < x + width) {
      right = x + width
    }

    if (top > y) {
      top = y
    }

    if (bottom < y + height) {
      bottom = y + height
    }
  }

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  }
}

export const useSelectionBounds = () => {
  const selection = useCanvasStore(state => state.selectedLayers, shallow)
  const layers = useCanvasStore(state => state.layers)

  return boundingBox(
    selection
      .map(id => layers.get(id))
      .filter((layer): layer is Layer => layer !== undefined)
  )
}