import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { subscribeWithSelector } from 'zustand/middleware'
import { debounce } from 'lodash'
import { nanoid } from 'nanoid'
import { enableMapSet } from 'immer'
import { 
  Layer, 
  Camera, 
  Color, 
  CanvasMode, 
  CanvasState,
  Point,
  XYWH,
  LayerType,
  Side,
  PathLayer
} from '@/types/canvas'
import { penPointsToPathLayer } from '@/lib/utils'

// Enable Immer MapSet plugin
enableMapSet()

// Constants
const MAX_HISTORY_ENTRIES = 50

// History state for undo/redo
interface HistoryEntry {
  layers: [string, Layer][]
  layerIds: string[]
}

interface HistoryState {
  past: HistoryEntry[]
  future: HistoryEntry[]
}

interface CanvasStore {
  // Canvas state
  layers: Map<string, Layer>
  layerIds: string[]
  
  // History state
  history: HistoryState
  
  // Local state
  camera: Camera
  selectedLayers: string[]
  canvasState: CanvasState
  penColor: Color
  pencilDraft: number[][] | null
  
  // Editing state
  editingLayerId: string | null
  
  // Layer operations
  insertLayer: (layer: Omit<Layer, 'id'>) => void
  updateLayer: (id: string, updates: Partial<Layer>) => void
  deleteLayer: (id: string) => void
  deleteLayers: (ids: string[]) => void
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
  
  // Selection operations
  selectLayers: (ids: string[]) => void
  unselectLayers: () => void
  
  // Canvas operations
  translateLayers: (ids: string[], offset: Point) => void
  resizeLayer: (id: string, bounds: XYWH) => void
  updateLayerColor: (id: string, fill: Color) => void
  
  // Canvas state
  setCanvasState: (state: CanvasState) => void
  setCamera: (camera: Camera) => void
  setPenColor: (color: Color) => void
  setPencilDraft: (draft: number[][] | null) => void
  
  // Path operations
  insertPath: () => void
  continueDrawing: (point: Point, pressure: number) => void
  
  // Persistence
  saveToDatabase: () => void
  loadFromDatabase: (data: any) => void
  
  // History operations
  undo: () => void
  redo: () => void
  saveHistory: () => void
  
  // Editing operations
  setEditingLayer: (id: string | null) => void
  
  // Utilities
  getLayer: (id: string) => Layer | undefined
  getSelectedLayers: () => Layer[]
  findIntersectingLayersWithRectangle: (layerIds: string[], origin: Point, current: Point) => string[]
}

// Helper function to check intersection
function isIntersecting(layer: Layer, rect: XYWH): boolean {
  const { x, y, width, height } = rect
  const layerBounds = {
    left: layer.x,
    right: layer.x + layer.width,
    top: layer.y,
    bottom: layer.y + layer.height
  }
  
  const rectBounds = {
    left: x,
    right: x + width,
    top: y,
    bottom: y + height
  }
  
  return !(
    rectBounds.left > layerBounds.right ||
    rectBounds.right < layerBounds.left ||
    rectBounds.top > layerBounds.bottom ||
    rectBounds.bottom < layerBounds.top
  )
}

export const useCanvasStore = create<CanvasStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      layers: new Map(),
      layerIds: [],
      history: { past: [], future: [] },
      camera: { x: 0, y: 0, zoom: 1 },
      selectedLayers: [],
      canvasState: { mode: CanvasMode.None },
      penColor: { r: 0, g: 0, b: 0 },
      pencilDraft: null,
      editingLayerId: null,
      
      insertLayer: (layer) => {
        get().saveHistory()
        set(state => {
          const id = nanoid()
          const newLayer = { ...layer, id } as Layer
          state.layers.set(id, newLayer)
          
          // Smart layer ordering: Frames go to back, others to front
          if (layer.type === LayerType.Frame) {
            state.layerIds.unshift(id) // Add to beginning (back)
          } else {
            state.layerIds.push(id) // Add to end (front)
          }
          
          // Select the new layer
          state.selectedLayers = [id]
        })
        // Auto-save
        get().saveToDatabase()
      },
      
      updateLayer: (id, updates) => {
        get().saveHistory()
        set(state => {
          const layer = state.layers.get(id)
          if (layer) {
            state.layers.set(id, { ...layer, ...updates } as Layer)
          }
        })
        get().saveToDatabase()
      },
      
      deleteLayer: (id) => {
        get().saveHistory()
        set(state => {
          state.layers.delete(id)
          state.layerIds = state.layerIds.filter(layerId => layerId !== id)
          state.selectedLayers = state.selectedLayers.filter(layerId => layerId !== id)
        })
        get().saveToDatabase()
      },
      
      deleteLayers: (ids) => {
        get().saveHistory()
        set(state => {
          ids.forEach(id => {
            state.layers.delete(id)
          })
          state.layerIds = state.layerIds.filter(id => !ids.includes(id))
          state.selectedLayers = state.selectedLayers.filter(id => !ids.includes(id))
        })
        get().saveToDatabase()
      },
      
      bringToFront: (id) => {
        get().saveHistory()
        set(state => {
          const index = state.layerIds.indexOf(id)
          if (index !== -1) {
            state.layerIds.splice(index, 1)
            state.layerIds.push(id)
          }
        })
        get().saveToDatabase()
      },
      
      sendToBack: (id) => {
        get().saveHistory()
        set(state => {
          const index = state.layerIds.indexOf(id)
          if (index !== -1) {
            state.layerIds.splice(index, 1)
            state.layerIds.unshift(id)
          }
        })
        get().saveToDatabase()
      },
      
      selectLayers: (ids) => set(state => {
        state.selectedLayers = ids
      }),
      
      unselectLayers: () => set(state => {
        state.selectedLayers = []
      }),
      
      translateLayers: (ids, offset) => {
        set(state => {
          // Collect all layers to translate (including Frame children)
          const layersToTranslate = new Set<string>()
          
          ids.forEach(id => {
            layersToTranslate.add(id)
            
            // If this is a Frame, also include its children
            const layer = state.layers.get(id)
            if (layer && layer.type === LayerType.Frame) {
              layer.childIds.forEach(childId => {
                layersToTranslate.add(childId)
              })
            }
          })
          
          // Translate all collected layers
          layersToTranslate.forEach(id => {
            const layer = state.layers.get(id)
            if (layer) {
              state.layers.set(id, {
                ...layer,
                x: layer.x + offset.x,
                y: layer.y + offset.y
              })
            }
          })
        })
        get().saveToDatabase()
      },
      
      resizeLayer: (id, bounds) => {
        set(state => {
          const layer = state.layers.get(id)
          if (layer) {
            state.layers.set(id, {
              ...layer,
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height
            })
          }
        })
        get().saveToDatabase()
      },
      
      updateLayerColor: (id, fill) => {
        get().saveHistory()
        set(state => {
          const layer = state.layers.get(id)
          if (layer) {
            state.layers.set(id, {
              ...layer,
              fill
            })
          }
        })
        get().saveToDatabase()
      },
      
      setCanvasState: (canvasState) => set(state => {
        state.canvasState = canvasState
      }),
      
      setCamera: (camera) => set(state => {
        state.camera = camera
      }),
      
      setPenColor: (color) => set(state => {
        state.penColor = color
      }),
      
      setPencilDraft: (draft) => set(state => {
        state.pencilDraft = draft
      }),
      
      insertPath: () => {
        const pencilDraft = get().pencilDraft
        const currentPenColor = get().penColor  // 在 set 之前獲取當前顏色
        
        if (!pencilDraft || pencilDraft.length < 2) {
          set(state => {
            state.pencilDraft = null
          })
          return
        }
        
        get().saveHistory()
        set(state => {
          const id = nanoid()
          const layer = penPointsToPathLayer(pencilDraft, currentPenColor)
          
          state.layers.set(id, layer)
          state.layerIds.push(id)
          state.pencilDraft = null
          state.selectedLayers = [id]
        })
        
        get().saveToDatabase()
      },
      
      continueDrawing: (point, pressure) => set(state => {
        if (state.pencilDraft && state.canvasState.mode === CanvasMode.Pencil) {
          state.pencilDraft.push([point.x, point.y, pressure])
        }
      }),
      
      // Debounced save to database
      saveToDatabase: debounce(async () => {
        const state = get()
        const canvasData = {
          layers: Object.fromEntries(state.layers),
          layerIds: state.layerIds,
        }
        
        // Get boardId from URL
        const boardId = window.location.pathname.split('/').pop()
        if (!boardId) return
        
        try {
          await fetch(`/api/boards/${boardId}/canvas`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(canvasData),
          })
        } catch (error) {
          console.error('Failed to save canvas:', error)
        }
      }, 1000),
      
      loadFromDatabase: (data) => set(state => {
        state.layers = new Map(Object.entries(data.layers || {}))
        state.layerIds = data.layerIds || []
      }),
      
      saveHistory: () => set(state => {
        const currentState: HistoryEntry = {
          layers: Array.from(state.layers.entries()),
          layerIds: [...state.layerIds]
        }
        state.history.past.push(currentState)
        // Limit history entries
        if (state.history.past.length > MAX_HISTORY_ENTRIES) {
          state.history.past.shift()
        }
        // Clear future when new action is taken
        state.history.future = []
      }),
      
      undo: () => set(state => {
        if (state.history.past.length === 0) return
        
        const previousState = state.history.past.pop()
        if (!previousState) return
        
        // Save current state to future
        const currentState: HistoryEntry = {
          layers: Array.from(state.layers.entries()),
          layerIds: [...state.layerIds]
        }
        state.history.future.unshift(currentState)
        
        // Restore previous state
        state.layers = new Map(previousState.layers)
        state.layerIds = previousState.layerIds
      }),
      
      redo: () => set(state => {
        if (state.history.future.length === 0) return
        
        const nextState = state.history.future.shift()
        if (!nextState) return
        
        // Save current state to past
        const currentState: HistoryEntry = {
          layers: Array.from(state.layers.entries()),
          layerIds: [...state.layerIds]
        }
        state.history.past.push(currentState)
        
        // Restore next state
        state.layers = new Map(nextState.layers)
        state.layerIds = nextState.layerIds
      }),
      
      setEditingLayer: (id) => set(state => {
        state.editingLayerId = id
      }),
      
      getLayer: (id) => get().layers.get(id),
      
      getSelectedLayers: () => {
        const state = get()
        return state.selectedLayers
          .map(id => state.layers.get(id))
          .filter(Boolean) as Layer[]
      },
      
      findIntersectingLayersWithRectangle: (layerIds, origin, current) => {
        const state = get()
        const intersecting: string[] = []
        
        const rect = {
          x: Math.min(origin.x, current.x),
          y: Math.min(origin.y, current.y),
          width: Math.abs(current.x - origin.x),
          height: Math.abs(current.y - origin.y),
        }
        
        // Early exit for zero-size rectangle
        if (rect.width === 0 || rect.height === 0) {
          return intersecting
        }
        
        // Use for...of for potential early optimization in future
        for (const id of layerIds) {
          const layer = state.layers.get(id)
          if (!layer || !isIntersecting(layer, rect)) {
            continue
          }
          
          // Frame dual-state logic: only include frames that are already selected
          if (layer.type === LayerType.Frame) {
            const isFrameSelected = state.selectedLayers.includes(id)
            if (isFrameSelected) {
              // Selected frames participate in range selection
              intersecting.push(id)
            }
            // Unselected frames are ignored, allowing selection to pass through to children
          } else {
            // Non-frame layers are always included if intersecting
            intersecting.push(id)
          }
        }
        
        return intersecting
      }
    }))
  )
)

// Undo/redo hooks
export const useCanvasHistory = () => {
  const undo = useCanvasStore(state => state.undo)
  const redo = useCanvasStore(state => state.redo)
  const history = useCanvasStore(state => state.history)
  
  return {
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0
  }
}