'use client'

import { SearchInput } from './search-input'
import { UserMenu } from './user-menu'

export const Navbar = () => {
  return (
    <div className="flex items-center gap-x-4 p-5">
      <div className="flex-1">
        <SearchInput />
      </div>
      <UserMenu />
    </div>
  )
}
