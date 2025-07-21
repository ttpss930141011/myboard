import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Board {
  _id: string
  _creationTime: number
  title: string
  orgId: string
  authorId: string
  authorName: string
  imageUrl: string
  isFavorite?: boolean
}

export function useBoards(options?: { search?: string, favorites?: boolean }) {
  const { data: session } = useSession()
  
  return useQuery<Board[]>({
    queryKey: ['boards', session?.user?.id, options],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(options?.search && { search: options.search }),
        ...(options?.favorites && { favorites: 'true' })
      })
      
      const res = await fetch(`/api/boards?${params}`)
      if (!res.ok) throw new Error('Failed to fetch boards')
      return res.json()
    },
    enabled: !!session?.user?.id,
  })
}

export function useBoard(boardId: string) {
  return useQuery<Board>({
    queryKey: ['board', boardId],
    queryFn: async () => {
      const res = await fetch(`/api/boards/${boardId}`)
      if (!res.ok) throw new Error('Failed to fetch board')
      return res.json()
    },
    enabled: !!boardId,
  })
}

export function useCreateBoard() {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const router = useRouter()
  
  return useMutation({
    mutationFn: async ({ title }: { title: string }) => {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      
      if (!res.ok) {
        const error = await res.text()
        throw new Error(error || 'Failed to create board')
      }
      
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['boards', session?.user?.id] })
      toast.success('Board created!')
      router.push(`/board/${data._id}`)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create board')
    },
  })
}

export function useUpdateBoard(boardId: string) {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  
  return useMutation({
    mutationFn: async ({ title }: { title: string }) => {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      
      if (!res.ok) {
        const error = await res.text()
        throw new Error(error || 'Failed to update board')
      }
      
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      queryClient.invalidateQueries({ queryKey: ['boards', session?.user?.id] })
      toast.success('Board updated!')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update board')
    },
  })
}

export function useDeleteBoard(boardId: string) {
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const router = useRouter()
  
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/boards/${boardId}`, {
        method: 'DELETE',
      })
      
      if (!res.ok) {
        throw new Error('Failed to delete board')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', session?.user?.id] })
      toast.success('Board deleted!')
      router.push('/')
    },
    onError: () => {
      toast.error('Failed to delete board')
    },
  })
}