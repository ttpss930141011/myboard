'use client'

import { useCallback, useMemo, useState, useEffect } from 'react'
import { nanoid } from 'nanoid'

import { Info } from './info'
import { Path } from './path'
import { Toolbar } from './toolbar'
import { LayerPreview } from './layer-preview'
import { SelectionBox } from './selection-box'
import { SelectionTools } from './selection-tools'

import {
  colorToCss,
  pointerEventToCanvasPoint,
  resizeBounds,
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
import { Loading } from './loading'

const MAX_LAYERS = 100

interface CanvasProps {
  boardId: string
}

export const Canvas = ({ boardId }: CanvasProps) => {
  const { isLoading } = useCanvas(boardId)
  
  const {
    layers,
    layerIds,
    camera,
    selectedLayers,
    canvasState,
    penColor,
    pencilDraft,
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
    startEditingWithChar,
  } = useCanvasStore()
  
  const { undo, redo, canUndo, canRedo } = useCanvasHistory()
  
  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 0,
    g: 0,
    b: 0,
  })

  useDisableScrollBounce()

  const insertLayerWithPosition = useCallback(
    (
      layerType:
        | LayerType.Ellipse
        | LayerType.Rectangle
        | LayerType.Text
        | LayerType.Note,
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
      }
      
      const size = defaultSizes[layerType] || { width: 100, height: 100 }
      
      insertLayer({
        type: layerType,
        x: position.x,
        y: position.y,
        height: size.height,
        width: size.width,
        fill: lastUsedColor,
      })

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

      translateLayers(selectedLayers, offset)

      setCanvasState({
        mode: CanvasMode.Translating,
        current: point,
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

  const onWheel = useCallback((e: React.WheelEvent) => {
    setCamera({
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY,
    })
  }, [setCamera, camera])

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
        updateSelectionNet(current, canvasState.origin)
      } else if (canvasState.mode === CanvasMode.Translating) {
        translateSelectedLayers(current)
      } else if (canvasState.mode === CanvasMode.Resizing) {
        resizeSelectedLayer(current)
      } else if (canvasState.mode === CanvasMode.Pencil) {
        continueDrawingHandler(current, e)
      }
    },
    [
      camera,
      canvasState,
      resizeSelectedLayer,
      translateSelectedLayers,
      continueDrawingHandler,
      updateSelectionNet,
      startMultiSelection,
    ]
  )

  const onPointerLeave = useCallback(() => {
    // No cursor presence to update in single-user mode
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e, camera)

      if (canvasState.mode === CanvasMode.Inserting) {
        return
      }

      if (canvasState.mode === CanvasMode.Pencil) {
        startDrawing(point, e.pressure)
        return
      }

      setCanvasState({ origin: point, mode: CanvasMode.Pressing })
    },
    [camera, canvasState.mode, setCanvasState, startDrawing]
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const point = pointerEventToCanvasPoint(e, camera)

      if (
        canvasState.mode === CanvasMode.None ||
        canvasState.mode === CanvasMode.Pressing
      ) {
        unselectLayersHandler()
        setCanvasState({
          mode: CanvasMode.None,
        })
      } else if (canvasState.mode === CanvasMode.Pencil) {
        insertPathHandler()
      } else if (canvasState.mode === CanvasMode.Inserting) {
        insertLayerWithPosition(canvasState.layerType, point)
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
    ]
  )

  const onLayerPointerDown = useCallback(
    (e: React.PointerEvent, layerId: string) => {
      if (
        canvasState.mode === CanvasMode.Pencil ||
        canvasState.mode === CanvasMode.Inserting
      ) {
        return
      }

      e.stopPropagation()

      const point = pointerEventToCanvasPoint(e, camera)

      if (!selectedLayers.includes(layerId)) {
        selectLayers([layerId])
      }

      // Save history before starting to translate
      saveHistory()
      setCanvasState({ mode: CanvasMode.Translating, current: point })
    },
    [camera, canvasState.mode, selectedLayers, selectLayers, setCanvasState, saveHistory]
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
      
      // Handle keyboard input for selected Note/Text layers
      if (selectedLayers.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const layer = getLayer(selectedLayers[0])
        
        if (layer && (layer.type === LayerType.Note || layer.type === LayerType.Text)) {
          // Check if it's a printable character (excluding special keys)
          if (e.key.length === 1 && !e.key.match(/[\x00-\x1F\x7F-\x9F]/)) {
            e.preventDefault()
            startEditingWithChar(selectedLayers[0], e.key)
          }
        }
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [undo, redo, selectedLayers, deleteLayers, getLayer, startEditingWithChar])

  if (isLoading) {
    return <Loading />
  }

  return (
    <main className="h-full w-full relative bg-neutral-100 touch-none">
      <Info boardId={boardId} />
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
      <svg
        className="h-[100vh] w-[100vw]"
        onWheel={onWheel}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <g
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px)`,
          }}
        >
          {layerIds.map(layerId => (
            <LayerPreview
              key={layerId}
              id={layerId}
              onLayerPointerDown={onLayerPointerDown}
              selectionColor={layerIdsToColorSelection[layerId]}
            />
          ))}
          <SelectionBox
            onResizeHandlePointerDown={onResizeHandlePointerDown}
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