'use client'

import { FormEventHandler, useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogClose,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

import { useRenameModal } from '@/store/use-rename-modal'
import { useUpdateBoard } from '@/hooks/api/use-boards'

export const RenameModal = () => {
  const { isOpen, onClose, initialValues } = useRenameModal()
  const updateBoard = useUpdateBoard(initialValues.id)

  const [title, setTitle] = useState(initialValues.title)

  useEffect(() => {
    setTitle(initialValues.title)
  }, [initialValues.title])

  const onSubmit: FormEventHandler<HTMLFormElement> = e => {
    e.preventDefault()

    updateBoard.mutate(
      { title },
      {
        onSuccess: () => {
          onClose()
        }
      }
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit board title</DialogTitle>
        </DialogHeader>
        <DialogDescription>Enter a new title for this board</DialogDescription>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            disabled={updateBoard.isPending}
            required
            maxLength={60}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Board title"
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button disabled={updateBoard.isPending} type="submit">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
