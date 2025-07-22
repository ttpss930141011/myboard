'use client'

import { useState, useId } from 'react'
import { signIn } from 'next-auth/react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const id = useId()
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
            <Label htmlFor={id}>Continue with email</Label>
            <div className="flex rounded-md shadow-xs">
              <Input
                id={id}
                className="-me-px flex-1 rounded-e-none shadow-none focus-visible:z-10"
                placeholder="Enter your email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="border-input bg-background text-foreground hover:bg-accent hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 inline-flex items-center rounded-e-md border px-3 text-sm font-medium transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <LoadingSpinner className="h-4 w-4" />
                ) : (
                  'Send'
                )}
              </button>
            </div>
          </div>
          
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
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