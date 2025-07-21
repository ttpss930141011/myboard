'use client'

import { useSession } from 'next-auth/react'

import { EmptyOrg } from './_components/empty-org'
import { BoardList } from './_components/board-list'

interface DashboardPageProps {
  searchParams: {
    search?: string
    favorites?: string
  }
}

const DashboardPage = ({ searchParams }: DashboardPageProps) => {
  const { data: session } = useSession()

  return (
    <div className="flex-1 h-[calc(100%-80px)] p-6">
      {!session ? (
        <EmptyOrg />
      ) : (
        <BoardList query={searchParams} />
      )}
    </div>
  )
}

export default DashboardPage
