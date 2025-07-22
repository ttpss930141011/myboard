'use client'

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useSignInModal } from '@/store/use-signin-modal'

export const EmptyOrg = () => {
  const { open: openSignInModal } = useSignInModal()

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <Image src="/elements.svg" alt="Empty" height={200} width={200} />
      <h2 className="text-2xl font-semibold mt-6">Welcome to MyBoard</h2>
      <p className="text-muted-foreground text-sm mt-2">
        Sign in to get started
      </p>
      <div className="mt-6">
        <Button 
          size="lg" 
          onClick={openSignInModal}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          Sign in
        </Button>
      </div>
    </div>
  )
}
