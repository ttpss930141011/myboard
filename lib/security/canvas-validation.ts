/**
 * Canvas data validation utilities
 * Implements defense-in-depth for canvas JSON data validation
 * Following SOLID principles: Single Responsibility for canvas data security
 */

import { LayerType } from '@/types/canvas'
import { sanitizeLayerText, sanitizeLayerName } from './validation'

// Type guards for runtime validation

/**
 * Validates Color object structure and values
 */
const isValidColor = (color: any): boolean => {
  if (!color || typeof color !== 'object') return false
  
  const { r, g, b } = color
  
  return (
    typeof r === 'number' && r >= 0 && r <= 255 &&
    typeof g === 'number' && g >= 0 && g <= 255 &&
    typeof b === 'number' && b >= 0 && b <= 255
  )
}

/**
 * Validates Point object structure
 */
const isValidPoint = (point: any): boolean => {
  if (!point || typeof point !== 'object') return false
  
  const { x, y } = point
  return typeof x === 'number' && typeof y === 'number'
}

/**
 * Validates basic layer properties shared by all layer types
 */
const hasValidBaseLayerProps = (layer: any): boolean => {
  if (!layer || typeof layer !== 'object') return false
  
  const { type, x, y, width, height } = layer
  
  return (
    typeof type === 'number' &&
    Object.values(LayerType).includes(type) &&
    typeof x === 'number' &&
    typeof y === 'number' &&
    typeof width === 'number' && width > 0 &&
    typeof height === 'number' && height > 0
  )
}

/**
 * Validates Rectangle layer structure
 */
const isValidRectangleLayer = (layer: any): boolean => {
  if (!hasValidBaseLayerProps(layer) || layer.type !== LayerType.Rectangle) {
    return false
  }
  
  const { fill, value } = layer
  
  return (
    isValidColor(fill) &&
    (value === undefined || typeof value === 'string')
  )
}

/**
 * Validates Ellipse layer structure
 */
const isValidEllipseLayer = (layer: any): boolean => {
  if (!hasValidBaseLayerProps(layer) || layer.type !== LayerType.Ellipse) {
    return false
  }
  
  const { fill, value } = layer
  
  return (
    isValidColor(fill) &&
    (value === undefined || typeof value === 'string')
  )
}

/**
 * Validates Text layer structure
 */
const isValidTextLayer = (layer: any): boolean => {
  if (!hasValidBaseLayerProps(layer) || layer.type !== LayerType.Text) {
    return false
  }
  
  const { fill, value } = layer
  
  return (
    isValidColor(fill) &&
    (value === undefined || typeof value === 'string')
  )
}

/**
 * Validates Note layer structure
 */
const isValidNoteLayer = (layer: any): boolean => {
  if (!hasValidBaseLayerProps(layer) || layer.type !== LayerType.Note) {
    return false
  }
  
  const { fill, value } = layer
  
  return (
    isValidColor(fill) &&
    (value === undefined || typeof value === 'string')
  )
}

/**
 * Validates Path layer structure
 */
const isValidPathLayer = (layer: any): boolean => {
  if (!hasValidBaseLayerProps(layer) || layer.type !== LayerType.Path) {
    return false
  }
  
  const { fill, points, value } = layer
  
  // Validate points array
  if (!Array.isArray(points)) return false
  
  const isValidPointsArray = points.every(pointArray => 
    Array.isArray(pointArray) && 
    pointArray.length === 2 && 
    pointArray.every(coord => typeof coord === 'number')
  )
  
  return (
    isValidColor(fill) &&
    isValidPointsArray &&
    (value === undefined || typeof value === 'string')
  )
}

/**
 * Validates Frame layer structure
 */
const isValidFrameLayer = (layer: any): boolean => {
  if (!hasValidBaseLayerProps(layer) || layer.type !== LayerType.Frame) {
    return false
  }
  
  const { fill, strokeColor, strokeWidth, childIds, name, locked } = layer
  
  return (
    (fill === undefined || isValidColor(fill)) &&
    (strokeColor === undefined || isValidColor(strokeColor)) &&
    (strokeWidth === undefined || (typeof strokeWidth === 'number' && strokeWidth >= 0)) &&
    Array.isArray(childIds) &&
    childIds.every(id => typeof id === 'string') &&
    (name === undefined || typeof name === 'string') &&
    (locked === undefined || typeof locked === 'boolean')
  )
}

/**
 * Validates a single layer object based on its type
 */
const isValidLayer = (layer: any): boolean => {
  if (!layer || typeof layer !== 'object' || typeof layer.type !== 'number') {
    return false
  }
  
  switch (layer.type) {
    case LayerType.Rectangle:
      return isValidRectangleLayer(layer)
    case LayerType.Ellipse:
      return isValidEllipseLayer(layer)
    case LayerType.Text:
      return isValidTextLayer(layer)
    case LayerType.Note:
      return isValidNoteLayer(layer)
    case LayerType.Path:
      return isValidPathLayer(layer)
    case LayerType.Frame:
      return isValidFrameLayer(layer)
    default:
      return false
  }
}

/**
 * Validates canvas data structure
 * @param canvasData - Raw canvas data from client
 * @returns boolean indicating if canvas data is valid
 */
export const isValidCanvasData = (canvasData: any): boolean => {
  if (!canvasData || typeof canvasData !== 'object') {
    return false
  }
  
  const { layers, layerIds } = canvasData
  
  // Validate layerIds array
  if (!Array.isArray(layerIds)) {
    return false
  }
  
  if (!layerIds.every(id => typeof id === 'string' && id.length > 0)) {
    return false
  }
  
  // Validate layers object
  if (!layers || typeof layers !== 'object') {
    return false
  }
  
  // Check each layer in the layers object
  for (const [layerId, layer] of Object.entries(layers)) {
    if (typeof layerId !== 'string' || layerId.length === 0) {
      return false
    }
    
    if (!isValidLayer(layer)) {
      return false
    }
  }
  
  // Validate that all layerIds exist in layers object
  for (const layerId of layerIds) {
    if (!(layerId in layers)) {
      return false
    }
  }
  
  return true
}

/**
 * Sanitizes canvas data by cleaning layer text content
 * @param canvasData - Canvas data to sanitize
 * @returns Sanitized canvas data
 */
export const sanitizeCanvasData = (canvasData: any): any => {
  if (!isValidCanvasData(canvasData)) {
    throw new Error('Invalid canvas data structure')
  }
  
  const sanitizedLayers: Record<string, any> = {}
  
  // Sanitize each layer's text content
  for (const [layerId, layer] of Object.entries(canvasData.layers)) {
    const sanitizedLayer = { ...layer }
    
    // Sanitize text content based on layer type
    if (layer && typeof layer === 'object') {
      const typedLayer = layer as any
      
      if (typedLayer.value && typeof typedLayer.value === 'string') {
        sanitizedLayer.value = sanitizeLayerText(typedLayer.value)
      }
      
      if (typedLayer.name && typeof typedLayer.name === 'string') {
        sanitizedLayer.name = sanitizeLayerName(typedLayer.name)
      }
    }
    
    sanitizedLayers[layerId] = sanitizedLayer
  }
  
  return {
    layers: sanitizedLayers,
    layerIds: [...canvasData.layerIds] // Create a copy
  }
}

/**
 * Validates and sanitizes canvas data in one operation
 * @param canvasData - Raw canvas data from client
 * @returns Sanitized canvas data or throws error
 */
export const validateAndSanitizeCanvasData = (canvasData: any): any => {
  if (!isValidCanvasData(canvasData)) {
    throw new Error('Invalid canvas data: structure validation failed')
  }
  
  return sanitizeCanvasData(canvasData)
}