'use client'

import { Color } from '@/types/canvas'
import { colorToCss } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Hint } from '@/components/hint'
import Image from 'next/image'

interface ColorPickerPopoverProps {
  onChange: (color: Color) => void
  currentColor?: Color
}

const colors: Color[] = [
  { r: 243, g: 82, b: 35 },    // Red
  { r: 255, g: 249, b: 177 },  // Light Yellow
  { r: 68, g: 202, b: 99 },    // Green
  { r: 39, g: 142, b: 237 },   // Blue
  { r: 155, g: 105, b: 245 },  // Purple
  { r: 252, g: 142, b: 42 },   // Orange
  { r: 0, g: 0, b: 0 },        // Black
  { r: 255, g: 255, b: 255 },  // White
  { r: 244, g: 114, b: 182 },  // Pink
  { r: 34, g: 197, b: 94 },    // Emerald
  { r: 168, g: 85, b: 247 },   // Violet
  { r: 251, g: 146, b: 60 },   // Amber
]

export const ColorPickerPopover = ({ onChange, currentColor }: ColorPickerPopoverProps) => {
  return (
    <Popover>
      <Hint label="Color picker">
        <PopoverTrigger asChild>
          <Button
            size="icon"
            variant="board"
            className="relative overflow-hidden"
          >
            {currentColor ? (
              <div
                className="w-6 h-6 rounded border-2 border-white shadow-sm"
                style={{ backgroundColor: colorToCss(currentColor) }}
              />
            ) : (
              <Image
                src="/color.png"
                alt="Color picker"
                width={24}
                height={24}
                className="object-contain"
              />
            )}
          </Button>
        </PopoverTrigger>
      </Hint>
      <PopoverContent className="w-auto p-2" align="start">
        <div className="grid grid-cols-4 gap-1">
          {colors.map((color, index) => (
            <button
              key={index}
              className="w-10 h-10 rounded-md border border-neutral-200 hover:scale-110 transition-transform"
              style={{ backgroundColor: colorToCss(color) }}
              onClick={() => onChange(color)}
              aria-label={`Select color ${index + 1}`}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}