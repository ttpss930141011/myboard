import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useOrganization } from '@clerk/nextjs'
import { toast } from 'sonner'

export function useFavoriteBoard(boardId: string) {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  
  return useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error('No organization')
      
      const res = await fetch(`/api/boards/${boardId}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: organization.id }),
      })
      
      if (!res.ok) {
        const error = await res.text()
        throw new Error(error || 'Failed to favorite board')
      }
      
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', organization?.id] })
      toast.success('Added to favorites!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to favorite board')
    },
  })
}

export function useUnfavoriteBoard(boardId: string) {
  const queryClient = useQueryClient()
  const { organization } = useOrganization()
  
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
      queryClient.invalidateQueries({ queryKey: ['boards', organization?.id] })
      toast.success('Removed from favorites!')
    },
    onError: () => {
      toast.error('Failed to unfavorite board')
    },
  })
}