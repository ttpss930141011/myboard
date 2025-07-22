/**
 * Profile modal component
 * Shows user profile information in a modal
 */

'use client'

import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useProfileModal } from '@/store/use-profile-modal'
import { GoogleIcon, GitHubIcon } from '@/components/ui/icons'
import { Calendar, Clock, Mail } from 'lucide-react'

export function ProfileModal() {
  const { isOpen, close } = useProfileModal()
  const { data: session } = useSession()

  if (!session?.user) return null

  // Format date for display
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    })
  }

  // Get real user data from session
  const memberSince = session.user.createdAt
  const providers = session.user.providers || []

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={session.user.image || ''} />
              <AvatarFallback className="text-2xl">
                {session.user.name?.[0] || session.user.email?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold">{session.user.name || 'User'}</h3>
              <p className="text-sm text-muted-foreground">{session.user.email}</p>
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="mr-1 h-3 w-3" />
                Member since {formatDate(memberSince)}
              </div>
            </div>
          </div>

          {/* Account Information Section */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3">Account Information</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="ml-2">{session.user.email}</span>
                </div>

                <div className="flex items-center text-sm">
                  <span className="text-muted-foreground mr-2">Connected:</span>
                  <div className="flex gap-2">
                    {providers.includes('google') && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <GoogleIcon className="h-3 w-3" />
                        Google
                      </Badge>
                    )}
                    {providers.includes('github') && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <GitHubIcon className="h-3 w-3" />
                        GitHub
                      </Badge>
                    )}
                    {providers.includes('resend') && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Email
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center text-sm">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Last login:</span>
                  <span className="ml-2">Just now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}