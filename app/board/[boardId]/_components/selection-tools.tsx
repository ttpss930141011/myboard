'use client'

import { memo } from 'react'
import { BringToFront, SendToBack, Trash2 } from 'lucide-react'

import { Hint } from '@/components/hint'
import { Button } from '@/components/ui/button'
import { ColorPickerPopover } from './color-picker-popover'

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
        className="absolute p-2 rounded-xl bg-white shadow-lg border flex items-center gap-1 select-none"
        style={{
          transform: `translate(
            calc(${x}px - 50%),
            calc(${y - 16}px - 100%)
          )`,
        }}
      >
        <ColorPickerPopover onChange={setFill} />
        <div className="flex items-center gap-1 px-1 border-l border-neutral-200">
          <Hint label="Bring to front">
            <Button
              onClick={moveToFront}
              size="icon"
              variant="ghost"
              className="hover:bg-blue-100 hover:text-blue-600"
            >
              <BringToFront className="h-4 w-4" />
            </Button>
          </Hint>
          <Hint label="Send to back">
            <Button
              onClick={moveToBack}
              size="icon"
              variant="ghost"
              className="hover:bg-blue-100 hover:text-blue-600"
            >
              <SendToBack className="h-4 w-4" />
            </Button>
          </Hint>
        </div>
        <div className="flex items-center pl-1 border-l border-neutral-200">
          <Hint label="Delete">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDelete}
              className="hover:bg-red-100 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Hint>
        </div>
      </div>
    )
  }
)

SelectionTools.displayName = 'SelectionTools'