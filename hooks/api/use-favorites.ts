import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

export function useFavoriteBoard(boardId: string) {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  
  return useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) throw new Error('Not authenticated')
      
      const res = await fetch(`/api/boards/${boardId}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!res.ok) {
        const error = await res.text()
        throw new Error(error || 'Failed to favorite board')
      }
      
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      toast.success('Added to favorites!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to favorite board')
    },
  })
}

export function useUnfavoriteBoard(boardId: string) {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/boards/${boardId}/favorite`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        throw new Error('Failed to unfavorite board')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      toast.success('Removed from favorites!')
    },
    onError: () => {
      toast.error('Failed to unfavorite board')
    },
  })
}