'use client'

import { useEffect, useState } from 'react'

import { RenameModal } from '@/components/modals/rename-modal'
import { SignInModal } from '@/components/modals/signin-modal'
import { useSignInModal } from '@/store/use-signin-modal'

export const ModalProvider = () => {
  const [isMounted, setIsMounted] = useState(false)
  const { isOpen, close } = useSignInModal()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return null

  return (
    <>
      <RenameModal />
      <SignInModal showSignInModal={isOpen} setShowSignInModal={close} />
    </>
  )
}
