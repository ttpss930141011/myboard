import { useQuery } from '@tanstack/react-query'
import { useCanvasStore } from '@/stores/canvas-store'

export function useCanvas(boardId: string) {
  return useQuery({
    queryKey: ['canvas', boardId],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}/canvas`)
      if (!res.ok) throw new Error('Failed to fetch canvas')
      const data = await res.json()
      
      // Access the store directly to avoid selector issues with temporal middleware
      const store = useCanvasStore.getState()
      if (store.loadFromDatabase) {
        store.loadFromDatabase(data)
      }
      
      return data
    },
    enabled: !!boardId,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
}