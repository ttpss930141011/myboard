'use client'

import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCreateBoard } from '@/hooks/api/use-boards'

interface NewBoardButtonProps {
  orgId: string
  disabled?: boolean
}

export const NewBoardButton = ({ orgId, disabled }: NewBoardButtonProps) => {
  const createBoard = useCreateBoard()

  const onClick = () => {
    createBoard.mutate({ title: 'Untitled' })
  }

  return (
    <button
      disabled={createBoard.isPending || disabled}
      onClick={onClick}
      className={cn(
        'col-span-1 aspect-[100/127] bg-amber rounded-lg hover:bg-amber/80 flex flex-col items-center justify-center gap-2 py-6',
        (createBoard.isPending || disabled) && 'opacity-75 hover:bg-amber cursor-not-allowed'
      )}
    >
      <Plus className="h-12 w-12 text-white stroke-1.5" />
      <p className="text-base text-white font-medium">New board</p>
    </button>
  )
}
