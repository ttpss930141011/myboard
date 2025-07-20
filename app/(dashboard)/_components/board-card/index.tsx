'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { MoreHorizontal } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

import { Actions } from '@/components/actions'
import { Skeleton } from '@/components/ui/skeleton'
import { Footer } from './footer'
import { useFavoriteBoard, useUnfavoriteBoard } from '@/hooks/api/use-favorites'

interface BoardCardProps {
  id: string
  title: string
  authorName: string
  authorId: string
  createdAt: number
  imageUrl: string
  isFavorite: boolean
}

export const BoardCard = ({
  id,
  title,
  authorId,
  authorName,
  createdAt,
  imageUrl,
  isFavorite,
}: BoardCardProps) => {
  const { data: session } = useSession()

  const authorLabel = session?.user?.id === authorId ? 'You' : authorName
  const createdAtLabel = formatDistanceToNow(createdAt, {
    addSuffix: true,
  })

  const favorite = useFavoriteBoard(id)
  const unfavorite = useUnfavoriteBoard(id)

  const toggleFavorite = () => {
    if (isFavorite) {
      unfavorite.mutate()
    } else {
      favorite.mutate()
    }
  }

  return (
    <Link href={`/board/${id}`}>
      <div className="group aspect-[100/127] border rounded-lg flex flex-col justify-between overflow-hidden">
        <div className="relative flex-1 bg-amber-50">
          <Image src={imageUrl} alt={title} fill className="object-fit" />
          <div className="opacity-0 group-hover:opacity-50 transition-opacity h-full w-full bg-amber/40" />
          <Actions id={id} title={title} side="right">
            <button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity px-1 py-0.5 outline-none bg-white rounded-md shadow-sm">
              <MoreHorizontal className="text-amber opacity-75 hover:opacity-100 transition-opacity" />
            </button>
          </Actions>
        </div>
        <Footer
          isFavorite={isFavorite}
          title={title}
          authorLabel={authorLabel}
          createdAtLabel={createdAtLabel}
          onClick={toggleFavorite}
          disabled={favorite.isPending || unfavorite.isPending}
        />
      </div>
    </Link>
  )
}

BoardCard.Skeleton = function BoardCardSkeleton() {
  return (
    <div className="aspect-[100/127] rounded-lg overflow-hidden">
      <Skeleton className="h-full w-full" />
    </div>
  )
}
