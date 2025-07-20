'use client'

import { useEffect, useState } from 'react'
import { Link2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { DropdownMenuContentProps } from '@radix-ui/react-dropdown-menu'

import { ConfirmModal } from '@/components/confirm-modal'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

import { useRenameModal } from '@/store/use-rename-modal'
import { useDeleteBoard } from '@/hooks/api/use-boards'

interface ActionsProps {
  children: React.ReactNode
  side?: DropdownMenuContentProps['side']
  sideOffset?: DropdownMenuContentProps['sideOffset']
  id: string
  title: string
}

export const Actions = ({
  children,
  side,
  sideOffset,
  id,
  title,
}: ActionsProps) => {
  const { onOpen } = useRenameModal()
  const deleteBoard = useDeleteBoard(id)
  const [origin, setOrigin] = useState("")
  
  useEffect(() => {
    // Only access window on client side
    setOrigin(window.location.origin)
  }, [])

  const onCopyLink = () => {
    if (!origin) return
    
    navigator.clipboard
      .writeText(`${origin}/board/${id}`)
      .then(() => toast.success('Link copied'))
      .catch(() => toast.error('Failed to copy link'))
  }

  const onDelete = () => {
    deleteBoard.mutate()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        onClick={e => e.stopPropagation()}
        side={side}
        sideOffset={sideOffset}
        className="w-60"
      >
        <DropdownMenuItem onClick={onCopyLink} className="p-3 cursor-pointer">
          <Link2 className="h-4 w-4 mr-2" />
          Copy board link
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onOpen(id, title)}
          className="p-3 cursor-pointer"
        >
          <Pencil className="h-4 w-4 mr-2" />
          Rename
        </DropdownMenuItem>
        <ConfirmModal
          header="Delete board?"
          description="This will delete the board and all of its contents."
          disabled={deleteBoard.isPending}
          onConfirm={onDelete}
        >
          <Button
            variant="ghost"
            className="p-3 cursor-pointer text-sm w-full justify-start font-normal"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </ConfirmModal>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
