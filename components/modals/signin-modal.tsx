/**
 * Sign-in modal component with modern design.
 * Implements a clean modal interface for authentication.
 */

'use client'

import { useState, useCallback } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import { GoogleIcon, GitHubIcon } from '@/components/ui/icons'
import { EmailSignInForm } from '@/components/auth/email-signin-form'

interface SignInModalProps {
  showSignInModal: boolean
  setShowSignInModal: (show: boolean) => void
}

/**
 * Modal component for user authentication.
 * Provides OAuth sign-in options in a clean modal interface.
 */
export function SignInModal({
  showSignInModal,
  setShowSignInModal,
}: SignInModalProps) {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)
  const searchParams = useSearchParams()
  const callbackUrl = searchParams?.get('from') || '/'

  const handleSignIn = useCallback(async (provider: 'google' | 'github') => {
    try {
      setLoadingProvider(provider)
      await signIn(provider, { 
        callbackUrl,
        redirect: true,
      })
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error)
      setLoadingProvider(null)
    }
  }, [callbackUrl])

  return (
    <Dialog open={showSignInModal} onOpenChange={setShowSignInModal}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
        <div className="w-full">
          <DialogHeader className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 px-6 py-8 relative">
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent_0%,white_100%)]" />
            <div className="relative">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-xl">
                  <Sparkles className="w-12 h-12 text-white" />
                </div>
              </div>
              <DialogTitle className="text-3xl font-bold text-white text-center mb-2">
                Welcome to MyBoard
              </DialogTitle>
              <DialogDescription className="text-base text-white/90 text-center">
                Sign in to start collaborating
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex flex-col space-y-4 p-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
            <div className="space-y-3">
              <Button
                disabled={loadingProvider !== null || emailLoading}
                variant="outline"
                className={cn(
                  "relative w-full h-12 text-base font-medium",
                  "bg-white dark:bg-gray-900",
                  "hover:bg-gray-50 dark:hover:bg-gray-800",
                  "border-gray-300 dark:border-gray-700",
                  "transition-all duration-200",
                  loadingProvider === 'google' && "opacity-70"
                )}
                onClick={() => handleSignIn('google')}
              >
                {loadingProvider === 'google' ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <GoogleIcon className="mr-2 h-5 w-5" />
                    Continue with Google
                  </>
                )}
              </Button>

              <Button
                disabled={loadingProvider !== null || emailLoading}
                variant="outline"
                className={cn(
                  "relative w-full h-12 text-base font-medium",
                  "bg-gray-800 dark:bg-gray-700",
                  "hover:bg-gray-700 dark:hover:bg-gray-600",
                  "text-white border-gray-700 dark:border-gray-600",
                  "transition-all duration-200",
                  loadingProvider === 'github' && "opacity-70"
                )}
                onClick={() => handleSignIn('github')}
              >
                {loadingProvider === 'github' ? (
                  <LoadingSpinner className="text-white" />
                ) : (
                  <>
                    <GitHubIcon className="mr-2 h-5 w-5" />
                    Continue with GitHub
                  </>
                )}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-950 px-2 text-gray-500 dark:text-gray-400">
                  Or continue with email
                </span>
              </div>
            </div>

            <EmailSignInForm 
              callbackUrl={callbackUrl}
              onLoading={setEmailLoading}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-950 px-2 text-gray-500 dark:text-gray-400">
                  Secure authentication
                </span>
              </div>
            </div>

            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              By signing in, you agree to our{' '}
              <a
                href="/terms"
                className="underline underline-offset-4 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="/privacy"
                className="underline underline-offset-4 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Loading spinner component.
 */
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("h-5 w-5 animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}