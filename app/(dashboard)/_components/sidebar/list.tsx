'use client'

import { useSession } from 'next-auth/react'

import { Item } from './item'

export const List = () => {
  const { data: session } = useSession()

  if (!session?.user) return null

  return (
    <ul className="space-y-4">
      <Item
        id={session.user.id}
        name="My Workspace"
        imageUrl="/logo.svg"
      />
    </ul>
  )
}
