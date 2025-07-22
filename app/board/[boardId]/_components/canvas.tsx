'use client'

import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { nanoid } from 'nanoid'

import { Info } from './info'
import { Path } from './path'
import { Toolbar } from './toolbar'
import { LayerPreview } from './layer-preview'
import { SelectionBox } from './selection-box'
import { SelectionTools } from './selection-tools'
import { GridBackground } from './grid-background'
import { CanvasLayers } from './canvas-layers'
import { useZoom } from '@/hooks/use-zoom'
import { useThrottledCallback } from '@/hooks/use-throttled-callback'
import { useCanvasSafety } from '@/hooks/use-canvas-safety'

import {
  colorToCss,
  pointerEventToCanvasPoint,
  resizeBounds,
  isPointInBounds,
} from '@/lib/utils'
import {
  Camera,
  CanvasMode,
  CanvasState,
  Color,
  LayerType,
  Point,
  Side,
  XYWH,
  Layer,
} from '@/types/canvas'
import { useDisableScrollBounce } from '@/hooks/use-disable-scroll-bounce'
import { useCanvasStore, useCanvasHistory } from '@/stores/canvas-store'
import { useCanvas } from '@/hooks/api/use-canvas'
import { useSelectionBounds } from '@/hooks/use-selection-bounds-new'
import { Loading } from './loading'

const MAX_LAYERS = 100

interface CanvasProps {
  boardId: string
  readonly?: boolean
}

export const Canvas = ({ boardId, readonly = false }: CanvasProps) => {
  const { isLoading } = useCanvas(boardId)
  const svgRef = useRef<SVGSVGElement>(null)
  const rafRef = useRef<number>(0)
  const { zoomIn, zoomOut, resetZoom } = useZoom()
  
  // Track window dimensions for grid background
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 })
  
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])
  
  const {
    layers,
    layerIds,
    camera,
    selectedLayers,
    canvasState,
    penColor,
    pencilDraft,
    editingLayerId,
    insertLayer,
    updateLayer,
    deleteLayer,
    deleteLayers: deleteLayersFromStore,
    selectLayers,
    unselectLayers,
    translateLayers,
    resizeLayer,
    setCanvasState,
    setCamera,
    setPenColor,
    setPencilDraft,
    insertPath,
    continueDrawing,
    bringToFront,
    sendToBack,
    findIntersectingLayersWithRectangle,
    saveHistory,
    getLayer,
    setEditingLayer,
  } = useCanvasStore()
  
  const { undo, redo, canUndo, canRedo } = useCanvasHistory()
  const selectionBounds = useSelectionBounds()
  
  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 0,
    g: 0,
    b: 0,
  })

  useDisableScrollBounce()
  
  // Add defensive programming for pointer events
  useCanvasSafety(canvasState, setCanvasState)

  const insertLayerWithPosition = useCallback(
    (
      layerType:
        | LayerType.Ellipse
        | LayerType.Rectangle
        | LayerType.Text
        | LayerType.Note
        | LayerType.Frame,
      position: Point
    ) => {
      if (layerIds.length >= MAX_LAYERS) {
        return
      }

      const defaultSizes = {
        [LayerType.Note]: { width: 200, height: 200 },
        [LayerType.Rectangle]: { width: 100, height: 100 },
        [LayerType.Ellipse]: { width: 100, height: 100 },
        [LayerType.Text]: { width: 100, height: 100 },
        [LayerType.Frame]: { width: 400, height: 300 },
      }
      
      const size = defaultSizes[layerType] || { width: 100, height: 100 }
      
      const baseLayer = {
        type: layerType,
        x: position.x,
        y: position.y,
        height: size.height,
        width: size.width,
        fill: lastUsedColor,
      }
      
      // Add frame-specific properties
      if (layerType === LayerType.Frame) {
        insertLayer({
          ...baseLayer,
          childIds: [],
          name: 'Frame',
          fill: undefined, // Frames typically don't have fill by default
        } as any) // Type assertion needed due to union type
      } else {
        insertLayer(baseLayer)
      }

      setCanvasState({ mode: CanvasMode.None })
    },
    [insertLayer, lastUsedColor, layerIds.length, setCanvasState]
  )

  const translateSelectedLayers = useCallback(
    (point: Point) => {
      if (canvasState.mode !== CanvasMode.Translating) {
        return
      }

      const offset = {
        x: point.x - canvasState.current.x,
        y: point.y - canvasState.current.y,
      }

      // Use specific layerIds if provided, otherwise use selectedLayers
      const layersToMove = canvasState.layerIds || selectedLayers
      translateLayers(layersToMove, offset)

      setCanvasState({
        mode: CanvasMode.Translating,
        current: point,
        layerIds: canvasState.layerIds, // Preserve layerIds if they were set
      })
    },
    [canvasState, selectedLayers, translateLayers, setCanvasState]
  )

  const unselectLayersHandler = useCallback(() => {
    if (selectedLayers.length > 0) {
      unselectLayers()
    }
  }, [selectedLayers.length, unselectLayers])

  const updateSelectionNet = useCallback(
    (current: Point, origin: Point) => {
      setCanvasState({
        mode: CanvasMode.SelectionNet,
        origin,
        current,
      })

      const ids = findIntersectingLayersWithRectangle(
        layerIds,
        origin,
        current
      )

      selectLayers(ids)
    },
    [findIntersectingLayersWithRectangle, layerIds, selectLayers, setCanvasState]
  )

  // Throttled version for better performance during selection
  const updateSelectionNetThrottled = useThrottledCallback(
    updateSelectionNet,
    16 // ~60fps
  )

  const startDrawing = useCallback(
    (point: Point, pressure: number) => {
      setPencilDraft([[point.x, point.y, pressure]])
      setPenColor(lastUsedColor)
    },
    [lastUsedColor, setPencilDraft, setPenColor]
  )

  const continueDrawingHandler = useCallback(
    (point: Point, e: React.PointerEvent) => {
      if (
        canvasState.mode !== CanvasMode.Pencil ||
        e.buttons !== 1 ||
        pencilDraft == null
      ) {
        return
      }

      continueDrawing(point, e.pressure)
    },
    [canvasState.mode, pencilDraft, continueDrawing]
  )

  const insertPathHandler = useCallback(() => {
    insertPath()
  }, [insertPath])

  const resizeSelectedLayer = useCallback(
    (point: Point) => {
      if (canvasState.mode !== CanvasMode.Resizing) {
        return
      }

      const bounds = resizeBounds(
        canvasState.initialBounds,
        canvasState.corner,
        point
      )

      resizeLayer(selectedLayers[0], bounds)
    },
    [canvasState, selectedLayers, resizeLayer]
  )

  const onResizeHandlePointerDown = useCallback(
    (corner: Side, initialBounds: XYWH) => {
      // Save history before starting to resize
      saveHistory()
      setCanvasState({
        mode: CanvasMode.Resizing,
        initialBounds,
        corner,
      })
    },
    [setCanvasState, saveHistory]
  )

  // Throttled camera update using requestAnimationFrame
  const setThrottledCamera = useCallback((newCamera: Camera) => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }
    rafRef.current = requestAnimationFrame(() => {
      setCamera(newCamera)
    })
  }, [setCamera])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  // Handle wheel events with zoom support
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const svg = svgRef.current
      if (!svg) return
      
      const target = e.target as Node
      if (!svg.contains(target)) return
      
      e.preventDefault()
      e.stopPropagation()
      
      if (e.ctrlKey || e.metaKey) {
        const rect = svg.getBoundingClientRect()
        const center = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        }
        
        const newCamera = e.deltaY < 0 
          ? zoomIn(camera, center)
          : zoomOut(camera, center)
        setThrottledCamera(newCamera)
      } else {
        setThrottledCamera({
          x: camera.x - e.deltaX,
          y: camera.y - e.deltaY,
          zoom: camera.zoom ?? 1
        })
      }
    }
    
    document.addEventListener('wheel', handleWheel, { passive: false, capture: true })
    
    return () => {
      document.removeEventListener('wheel', handleWheel, { capture: true })
    }
  }, [zoomIn, zoomOut, setThrottledCamera, camera])

  const startMultiSelection = useCallback(
    (current: Point, origin: Point) => {
      if (
        Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) >
        5
      ) {
        setCanvasState({
          mode: CanvasMode.SelectionNet,
          origin,
          current,
        })
      }
    },
    [setCanvasState]
  )

  const onPointerMove = useMemo(
    () => (e: React.PointerEvent) => {
      e.preventDefault()

      const current = pointerEventToCanvasPoint(e, camera)

      if (canvasState.mode === CanvasMode.Pressing) {
        startMultiSelection(current, canvasState.origin)
      } else if (canvasState.mode === CanvasMode.SelectionNet) {
        updateSelectionNetThrottled(current, canvasState.origin)
      } else if (canvasState.mode === CanvasMode.Translating) {
        translateSelectedLayers(current)
      } else if (canvasState.mode === CanvasMode.Resizing) {
        resizeSelectedLayer(current)
      } else if (canvasState.mode === CanvasMode.Pencil) {
        continueDrawingHandler(current, e)
      } else if (canvasState.mode === CanvasMode.Panning) {
        // Calculate screen-space delta from the original mouse position
        const deltaX = e.clientX - canvasState.origin.x
        const deltaY = e.clientY - canvasState.origin.y
        
        // Update camera based on the initial camera state plus delta
        setThrottledCamera({
          x: canvasState.startCamera.x + deltaX,
          y: canvasState.startCamera.y + deltaY,
          zoom: canvasState.startCamera.zoom ?? 1
        })
      } else if (canvasState.mode === CanvasMode.PotentialDrag) {
        // Check if movement exceeds threshold
        const distance = Math.abs(current.x - canvasState.origin.x) + Math.abs(current.y - canvasState.origin.y)
        if (distance > 5) {
          // Start actual dragging - specify which layer(s) to move
          saveHistory()
          if (canvasState.wasSelected) {
            // If layer was already selected, drag all selected layers
            setCanvasState({ mode: CanvasMode.Translating, current })
          } else {
            // If layer wasn't selected, drag only this layer without selecting it
            setCanvasState({ 
              mode: CanvasMode.Translating, 
              current,
              layerIds: [canvasState.layerId]
            })
          }
        }
      }
    },
    [
      camera,
      canvasState,
      resizeSelectedLayer,
      translateSelectedLayers,
      continueDrawingHandler,
      updateSelectionNetThrottled,
      startMultiSelection,
      saveHistory,
      setCanvasState,
      setThrottledCamera,
    ]
  )

  const onPointerLeave = useCallback(() => {
    // No cursor presence to update in single-user mode
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e, camera)

      // Right-click for panning
      if (e.button === 2) {
        e.preventDefault()
        setCanvasState({ 
          mode: CanvasMode.Panning,
          origin: { x: e.clientX, y: e.clientY },  // Store screen coordinates
          startCamera: { ...camera }  // Store initial camera state
        })
        return
      }

      if (canvasState.mode === CanvasMode.Inserting) {
        return
      }

      if (canvasState.mode === CanvasMode.Pencil) {
        startDrawing(point, e.pressure)
        return
      }

      // Check if we're clicking within the selection bounds
      if (selectionBounds && selectedLayers.length > 0 && isPointInBounds(point, selectionBounds)) {
        // Save history before starting to drag
        saveHistory()
        // Start translating mode for all selected layers
        setCanvasState({ 
          mode: CanvasMode.Translating, 
          current: point,
          layerIds: selectedLayers // Explicitly set which layers to move
        })
        return
      }

      setCanvasState({ origin: point, mode: CanvasMode.Pressing })
    },
    [camera, canvasState.mode, setCanvasState, startDrawing, selectionBounds, selectedLayers, saveHistory]
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e, camera)

      if (
        canvasState.mode === CanvasMode.None ||
        canvasState.mode === CanvasMode.Pressing
      ) {
        // Only unselect if not editing text
        if (!editingLayerId) {
          unselectLayersHandler()
        }
        setCanvasState({
          mode: CanvasMode.None,
        })
      } else if (canvasState.mode === CanvasMode.SelectionNet) {
        setCanvasState({
          mode: CanvasMode.None,
        })
      } else if (canvasState.mode === CanvasMode.Pencil) {
        insertPathHandler()
      } else if (canvasState.mode === CanvasMode.Panning) {
        setCanvasState({
          mode: CanvasMode.None,
        })
      } else if (canvasState.mode === CanvasMode.Inserting) {
        insertLayerWithPosition(canvasState.layerType, point)
      } else if (canvasState.mode === CanvasMode.Translating) {
        // End translation mode
        setCanvasState({
          mode: CanvasMode.None,
        })
      } else if (canvasState.mode === CanvasMode.Resizing) {
        // End resizing mode
        setCanvasState({
          mode: CanvasMode.None,
        })
      } else if (canvasState.mode === CanvasMode.PotentialDrag) {
        // This was a click, not a drag
        const layer = getLayer(canvasState.layerId)
        
        if (!canvasState.wasSelected) {
          // Select the layer if it wasn't selected
          selectLayers([canvasState.layerId])
        } else if (layer && (layer.type === LayerType.Text || layer.type === LayerType.Note)) {
          // Enter edit mode if clicking on already selected text/note
          setEditingLayer(canvasState.layerId)
        }
        
        setCanvasState({
          mode: CanvasMode.None,
        })
      } else {
        setCanvasState({
          mode: CanvasMode.None,
        })
      }
    },
    [
      camera,
      canvasState,
      setCanvasState,
      insertLayerWithPosition,
      unselectLayersHandler,
      insertPathHandler,
      editingLayerId,
      getLayer,
      selectLayers,
      setEditingLayer,
    ]
  )

  const onLayerPointerDown = useCallback(
    (e: React.PointerEvent, layerId: string) => {
      // Ignore right-click on layers
      if (e.button === 2) {
        return
      }
      
      if (
        canvasState.mode === CanvasMode.Pencil ||
        canvasState.mode === CanvasMode.Inserting
      ) {
        return
      }

      e.stopPropagation()

      const point = pointerEventToCanvasPoint(e, camera)

      // Enter PotentialDrag mode instead of immediately translating
      setCanvasState({ 
        mode: CanvasMode.PotentialDrag, 
        layerId,
        origin: point,
        wasSelected: selectedLayers.includes(layerId)
      })
    },
    [camera, canvasState.mode, selectedLayers, setCanvasState]
  )

  const layerIdsToColorSelection = useMemo(() => {
    const layerIdsToColorSelection: Record<string, string> = {}

    // In single-user mode, all selections use the same color
    for (const layerId of selectedLayers) {
      layerIdsToColorSelection[layerId] = '#000000'
    }

    return layerIdsToColorSelection
  }, [selectedLayers])

  const deleteLayers = useCallback(() => {
    deleteLayersFromStore(selectedLayers)
  }, [deleteLayersFromStore, selectedLayers])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Skip if target is an input element
      const target = e.target as HTMLElement
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') {
        return
      }
      
      switch (e.key) {
        case 'z': {
          if (e.ctrlKey || e.metaKey) {
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
            return
          }
          break
        }
        case 'Delete':
        case 'Backspace': {
          if (selectedLayers.length > 0) {
            deleteLayers()
            return
          }
          break
        }
      }
      
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [undo, redo, selectedLayers, deleteLayers, getLayer])

  if (isLoading) {
    return <Loading />
  }

  return (
    <main className="h-full w-full relative bg-neutral-100 touch-none">
      <Info boardId={boardId} />
      {!readonly && (
        <>
          <Toolbar
            canvasState={canvasState}
            setCanvasState={setCanvasState}
            canUndo={canUndo}
            canRedo={canRedo}
            undo={undo}
            redo={redo}
          />
          <SelectionTools
            isAnimated={false}
            setLastUsedColor={setLastUsedColor}
          />
        </>
      )}
      <svg
        ref={svgRef}
        className="h-[100vh] w-[100vw] touch-none"
        style={{
          cursor: canvasState.mode === CanvasMode.Panning 
            ? 'grabbing' 
            : canvasState.mode === CanvasMode.Pencil 
              ? 'crosshair'
              : canvasState.mode === CanvasMode.Translating
                ? 'move'
                : canvasState.mode === CanvasMode.SelectionNet
                  ? 'crosshair'
                  : canvasState.mode === CanvasMode.Resizing
                    ? 'nwse-resize'
                    : 'default'
        }}
        onPointerMove={readonly ? undefined : onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={readonly ? undefined : onPointerDown}
        onPointerUp={readonly ? undefined : onPointerUp}
        onDragStart={(e) => e.preventDefault()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <GridBackground
          camera={camera}
          width={dimensions.width}
          height={dimensions.height}
        />
        
        <g
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.zoom ?? 1})`,
          }}
        >
          <CanvasLayers
            layerIds={layerIds}
            onLayerPointerDown={readonly ? undefined : onLayerPointerDown}
            layerIdsToColorSelection={layerIdsToColorSelection}
          />
          <SelectionBox
            onResizeHandlePointerDown={readonly ? undefined : onResizeHandlePointerDown}
          />
          {canvasState.mode === CanvasMode.SelectionNet &&
            canvasState.current != null && (
              <rect
                className="fill-blue-500/5 stroke-blue-500 stroke-1"
                x={Math.min(canvasState.origin.x, canvasState.current.x)}
                y={Math.min(canvasState.origin.y, canvasState.current.y)}
                width={Math.abs(canvasState.origin.x - canvasState.current.x)}
                height={Math.abs(canvasState.origin.y - canvasState.current.y)}
              />
            )}
          {pencilDraft != null && pencilDraft.length > 0 && (
            <Path
              points={pencilDraft}
              fill={colorToCss(penColor)}
              x={0}
              y={0}
            />
          )}
        </g>
      </svg>
    </main>
  )
}