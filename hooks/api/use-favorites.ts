import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { secureApiClient } from '@/lib/api-client'

export function useFavoriteBoard(boardId: string) {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  
  return useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) throw new Error('Not authenticated')
      
      const res = await secureApiClient.post(`/api/boards/${boardId}/favorite`)
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
      await secureApiClient.delete(`/api/boards/${boardId}/favorite`)
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