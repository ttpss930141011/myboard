import { useCallback } from 'react'
import { Camera, Point } from '@/types/canvas'

const MIN_ZOOM = 0.1
const MAX_ZOOM = 5
const ZOOM_STEP = 1.2

/**
 * Hook for managing zoom functionality
 * Follows Single Responsibility Principle - only handles zoom logic
 */
export const useZoom = () => {
  const calculateZoomAtPoint = useCallback(
    (camera: Camera, center: Point, newZoom: number): Camera => {
      const currentZoom = camera.zoom ?? 1
      const scale = newZoom / currentZoom
      
      return {
        x: center.x - (center.x - camera.x) * scale,
        y: center.y - (center.y - camera.y) * scale,
        zoom: newZoom
      }
    },
    []
  )

  const zoomIn = useCallback(
    (camera: Camera, center?: Point): Camera => {
      const currentZoom = camera.zoom ?? 1
      const newZoom = Math.min(currentZoom * ZOOM_STEP, MAX_ZOOM)
      
      if (center) {
        return calculateZoomAtPoint(camera, center, newZoom)
      }
      
      return { ...camera, zoom: newZoom }
    },
    [calculateZoomAtPoint]
  )

  const zoomOut = useCallback(
    (camera: Camera, center?: Point): Camera => {
      const currentZoom = camera.zoom ?? 1
      const newZoom = Math.max(currentZoom / ZOOM_STEP, MIN_ZOOM)
      
      if (center) {
        return calculateZoomAtPoint(camera, center, newZoom)
      }
      
      return { ...camera, zoom: newZoom }
    },
    [calculateZoomAtPoint]
  )

  const resetZoom = useCallback(
    (camera: Camera): Camera => ({
      ...camera,
      zoom: 1
    }),
    []
  )

  const zoomToFit = useCallback(
    (camera: Camera): Camera => ({
      x: 0,
      y: 0,
      zoom: 1
    }),
    []
  )

  return {
    zoomIn,
    zoomOut,
    resetZoom,
    zoomToFit,
    MIN_ZOOM,
    MAX_ZOOM,
    ZOOM_STEP
  }
}