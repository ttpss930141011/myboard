'use client'

import { memo } from 'react'

import { Text } from './text'
import { Ellipse } from './ellipse'
import { Rectangle } from './rectangle'
import { Note } from './note'
import { Path } from './path'
import { Frame } from './frame'

import { colorToCss } from '@/lib/utils'
import { LayerType } from '@/types/canvas'
import { useCanvasStore } from '@/stores/canvas-store'

interface LayerPreviewProps {
  id: string
  onLayerPointerDown?: (e: React.PointerEvent, layerId: string) => void
  selectionColor?: string
}

export const LayerPreview = memo(
  ({ id, onLayerPointerDown, selectionColor }: LayerPreviewProps) => {
    const layer = useCanvasStore(state => state.layers.get(id))

    if (!layer) return null

    switch (layer.type) {
      case LayerType.Path:
        return (
          <Path
            key={id}
            points={layer.points}
            onPointerDown={onLayerPointerDown ? (e) => onLayerPointerDown(e, id) : undefined}
            x={layer.x}
            y={layer.y}
            fill={layer.fill ? colorToCss(layer.fill) : '#000'}
            stroke={selectionColor}
          />
        )
      case LayerType.Note:
        return (
          <Note
            id={id}
            layer={layer}
            onPointerDown={onLayerPointerDown}
            selectionColor={selectionColor}
          />
        )
      case LayerType.Text:
        return (
          <Text
            id={id}
            layer={layer}
            onPointerDown={onLayerPointerDown}
            selectionColor={selectionColor}
          />
        )
      case LayerType.Ellipse:
        return (
          <Ellipse
            id={id}
            layer={layer}
            onPointerDown={onLayerPointerDown}
            selectionColor={selectionColor}
          />
        )
      case LayerType.Rectangle:
        return (
          <Rectangle
            id={id}
            layer={layer}
            onPointerDown={onLayerPointerDown}
            selectionColor={selectionColor}
          />
        )
      case LayerType.Frame:
        return (
          <Frame
            id={id}
            layer={layer}
            onPointerDown={onLayerPointerDown}
            selectionColor={selectionColor}
          >
            {/* Recursively render child layers */}
            {layer.childIds.map(childId => (
              <LayerPreview
                key={childId}
                id={childId}
                onLayerPointerDown={onLayerPointerDown}
              />
            ))}
          </Frame>
        )
      default:
        console.warn('Unknown layer type')
        return null
    }
  }
)

LayerPreview.displayName = 'LayerPreview'
