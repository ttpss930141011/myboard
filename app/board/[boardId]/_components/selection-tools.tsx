'use client'

import { memo } from 'react'
import { BringToFront, SendToBack, Trash2 } from 'lucide-react'

import { Hint } from '@/components/hint'
import { Button } from '@/components/ui/button'
import { ColorPicker } from './color-picker'

import { Camera, Color } from '@/types/canvas'
import { useCanvasStore } from '@/stores/canvas-store'
import { useSelectionBounds } from '@/hooks/use-selection-bounds-new'

interface SelectionToolsProps {
  isAnimated?: boolean
  setLastUsedColor: (color: Color) => void
}

export const SelectionTools = memo(
  ({ isAnimated = true, setLastUsedColor }: SelectionToolsProps) => {
    const selectedLayers = useCanvasStore(state => state.selectedLayers)
    const camera = useCanvasStore(state => state.camera)
    const bringToFront = useCanvasStore(state => state.bringToFront)
    const sendToBack = useCanvasStore(state => state.sendToBack)
    const deleteLayers = useCanvasStore(state => state.deleteLayers)
    const updateLayerColor = useCanvasStore(state => state.updateLayerColor)

    const selectionBounds = useSelectionBounds()

    if (!selectionBounds) return null

    const x = selectionBounds.x + selectionBounds.width / 2 + camera.x
    const y = selectionBounds.y + camera.y

    const moveToFront = () => {
      selectedLayers.forEach(id => bringToFront(id))
    }

    const moveToBack = () => {
      selectedLayers.forEach(id => sendToBack(id))
    }

    const handleDelete = () => {
      deleteLayers(selectedLayers)
    }

    const setFill = (fill: Color) => {
      setLastUsedColor(fill)
      selectedLayers.forEach(id => updateLayerColor(id, fill))
    }

    return (
      <div
        className="absolute p-3 rounded-xl bg-white shadow-sm border flex select-none"
        style={{
          transform: `translate(
            calc(${x}px - 50%),
            calc(${y - 16}px - 100%)
          )`,
        }}
      >
        <ColorPicker onChange={setFill} />
        <div className="flex flex-col gap-y-0.5">
          <Hint label="Bring to front">
            <Button
              onClick={moveToFront}
              size="icon"
              variant="board"
              className="text-white"
            >
              <BringToFront />
            </Button>
          </Hint>
          <Hint label="Send to back" side="bottom">
            <Button
              onClick={moveToBack}
              size="icon"
              variant="board"
              className="text-white"
            >
              <SendToBack />
            </Button>
          </Hint>
        </div>
        <div className="flex items-center pl-2 ml-2 border-l border-neutral-200">
          <Hint label="Delete">
            <Button size="icon" variant="board" onClick={handleDelete}>
              <Trash2 />
            </Button>
          </Hint>
        </div>
      </div>
    )
  }
)

SelectionTools.displayName = 'SelectionTools'