'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmailSignInFormProps {
  callbackUrl?: string
  className?: string
  onLoading?: (loading: boolean) => void
}

/**
 * Reusable email sign-in form component following SOLID principles.
 * Single responsibility: Handle email authentication only.
 */
export function EmailSignInForm({ 
  callbackUrl = '/', 
  className,
  onLoading 
}: EmailSignInFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    onLoading?.(true)

    try {
      const result = await signIn('resend', {
        email,
        callbackUrl,
        redirect: false,
      })

      if (result?.error) {
        setError('Failed to send sign-in email. Please try again.')
      } else if (result?.ok) {
        // Show success message
        setSuccess(true)
        setError(null)
        setEmail('')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
      onLoading?.(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      {!success ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Sign in with Email
              </>
            )}
          </Button>
        </>
      ) : (
        <div className="text-center py-4">
          <p className="text-green-600 dark:text-green-400 font-medium">
            Check your email!
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            We sent a sign-in link to {email}
          </p>
        </div>
      )}
    </form>
  )
}

/**
 * Loading spinner component.
 * Extracted to follow DRY principle.
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