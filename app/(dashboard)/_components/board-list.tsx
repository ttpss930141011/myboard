'use client'

import { useBoards } from '@/hooks/api/use-boards'
import { BoardCard } from './board-card'
import { EmptySearch } from './empty-search'
import { EmptyBoards } from './empty-boards'
import { EmptyFavorites } from './empty-favorites'
import { NewBoardButton } from './new-board-button'

interface BoardListProps {
  query: {
    search?: string
    favorites?: string
  }
}

export const BoardList = ({ query }: BoardListProps) => {
  const { data, isLoading } = useBoards({
    search: query.search,
    favorites: query.favorites === 'true',
  })

  if (isLoading) {
    return (
      <div>
        <h2 className="text-3xl">
          {query.favorites ? 'Favorite boards' : 'Team boards'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 mt-8 pb-10">
          <NewBoardButton disabled />
          <BoardCard.Skeleton />
          <BoardCard.Skeleton />
          <BoardCard.Skeleton />
          <BoardCard.Skeleton />
        </div>
      </div>
    )
  }

  if (!data?.length && query.search) {
    return <EmptySearch />
  }

  if (!data?.length && query.favorites) {
    return <EmptyFavorites />
  }

  if (!data?.length) {
    return <EmptyBoards />
  }

  return (
    <div>
      <h2 className="text-3xl">
        {query.favorites ? 'Favorite boards' : 'Team boards'}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5 mt-8 pb-10">
        <NewBoardButton />
        {data?.map(board => (
          <BoardCard
            key={board._id}
            id={board._id}
            title={board.title}
            imageUrl={board.imageUrl}
            authorId={board.authorId}
            authorName={board.authorName}
            createdAt={board._creationTime}
            isFavorite={board.isFavorite || false}
          />
        ))}
      </div>
    </div>
  )
}
