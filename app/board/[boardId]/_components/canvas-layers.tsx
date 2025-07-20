'use client'

import { memo } from 'react'
import { LayerPreview } from './layer-preview'

interface CanvasLayersProps {
  layerIds: string[]
  onLayerPointerDown: (e: React.PointerEvent, layerId: string) => void
  layerIdsToColorSelection: Record<string, string>
}

/**
 * Optimized canvas layers component
 * Follows Single Responsibility Principle - only handles layer rendering
 * Uses React.memo for performance optimization
 */
const CanvasLayersComponent = ({ 
  layerIds, 
  onLayerPointerDown, 
  layerIdsToColorSelection 
}: CanvasLayersProps) => {
  return (
    <>
      {layerIds.map(layerId => (
        <LayerPreview
          key={layerId}
          id={layerId}
          onLayerPointerDown={onLayerPointerDown}
          selectionColor={layerIdsToColorSelection[layerId]}
        />
      ))}
    </>
  )
}

export const CanvasLayers = memo(CanvasLayersComponent, (prevProps, nextProps) => {
  // Deep comparison for arrays and objects
  const layerIdsEqual = prevProps.layerIds.length === nextProps.layerIds.length &&
    prevProps.layerIds.every((id, index) => id === nextProps.layerIds[index])
  
  const selectionEqual = Object.keys(prevProps.layerIdsToColorSelection).length === 
    Object.keys(nextProps.layerIdsToColorSelection).length &&
    Object.keys(prevProps.layerIdsToColorSelection).every(
      key => prevProps.layerIdsToColorSelection[key] === nextProps.layerIdsToColorSelection[key]
    )
  
  return layerIdsEqual && 
         selectionEqual && 
         prevProps.onLayerPointerDown === nextProps.onLayerPointerDown
})

CanvasLayers.displayName = 'CanvasLayers'