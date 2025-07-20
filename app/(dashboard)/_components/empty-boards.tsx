'use client'

import Image from 'next/image'
import { useOrganization } from '@clerk/nextjs'

import { Button } from '@/components/ui/button'
import { useCreateBoard } from '@/hooks/api/use-boards'

export const EmptyBoards = () => {
  const { organization } = useOrganization()
  const createBoard = useCreateBoard()

  const onClick = () => {
    if (!organization) return

    createBoard.mutate({ title: 'Untitled' })
  }

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <Image src="/note.svg" height={110} width={110} alt="Empty" />
      <h2 className="text-2xl font-semibold mt-6">Create your first board!</h2>
      <p className="text-muted-foreground textg-sm mt-2">
        Start by creating a board for your organization
      </p>
      <div className="mt-6">
        <Button disabled={createBoard.isPending} onClick={onClick} size="lg">
          Create board
        </Button>
      </div>
    </div>
  )
}
