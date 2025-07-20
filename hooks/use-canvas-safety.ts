import { useEffect } from 'react'
import { CanvasState, CanvasMode } from '@/types/canvas'

/**
 * Canvas safety hook - Defensive programming for pointer events
 * 
 * Purpose: Prevent canvas from getting stuck in drag states when browser
 * interrupts pointer events (e.g., native drag & drop)
 * 
 * Design principles:
 * - KISS: Simple solution for a specific problem
 * - YAGNI: Only solves the actual issue we encountered
 * - SRP: Single responsibility - prevent stuck states
 */
export const useCanvasSafety = (
  canvasState: CanvasState,
  setCanvasState: (state: CanvasState) => void
) => {
  // Defensive mechanism: Global pointerup listener
  useEffect(() => {
    const resetDragStates = () => {
      // Only reset states that can get stuck
      if (canvasState.mode === CanvasMode.Translating || 
          canvasState.mode === CanvasMode.Resizing ||
          canvasState.mode === CanvasMode.SelectionNet) {
        setCanvasState({ mode: CanvasMode.None })
      }
    }
    
    // Listen globally to catch events that might not bubble to canvas
    window.addEventListener('pointerup', resetDragStates)
    window.addEventListener('pointercancel', resetDragStates)
    
    return () => {
      window.removeEventListener('pointerup', resetDragStates)
      window.removeEventListener('pointercancel', resetDragStates)
    }
  }, [canvasState.mode, setCanvasState])
  
  // Optional: Development-only timeout protection
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    
    let timeoutId: NodeJS.Timeout
    
    // Set timeout for states that involve dragging
    if (canvasState.mode === CanvasMode.Translating || 
        canvasState.mode === CanvasMode.Resizing ||
        canvasState.mode === CanvasMode.SelectionNet) {
      timeoutId = setTimeout(() => {
        console.warn('[Canvas Safety] State timeout - auto reset from:', canvasState.mode)
        setCanvasState({ mode: CanvasMode.None })
      }, 10000) // 10 seconds timeout
    }
    
    return () => clearTimeout(timeoutId)
  }, [canvasState.mode, setCanvasState])
}