"use client"

import { signOut } from "next-auth/react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession } from "next-auth/react"
import { LogOut, User, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSignInModal } from "@/store/use-signin-modal"
import { useProfileModal } from "@/store/use-profile-modal"

export function UserMenu() {
  const { data: session } = useSession()
  const { open: openSignInModal } = useSignInModal()
  const { open: openProfileModal } = useProfileModal()
  
  if (!session?.user) {
    return (
      <Button
        onClick={openSignInModal}
        variant="default"
        size="sm"
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
      >
        <LogIn className="h-4 w-4 mr-2" />
        Sign in
      </Button>
    )
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarImage src={session.user.image || ""} />
          <AvatarFallback>
            {session.user.name?.[0] || session.user.email?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start gap-2 p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session.user.image || ""} />
            <AvatarFallback>
              {session.user.name?.[0] || session.user.email?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 leading-none">
            {session.user.name && (
              <p className="font-medium">{session.user.name}</p>
            )}
            {session.user.email && (
              <p className="w-[200px] truncate text-sm text-muted-foreground">
                {session.user.email}
              </p>
            )}
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer"
          onClick={openProfileModal}
        >
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => signOut()}
          className="cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}