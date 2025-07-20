import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { AUTH_ROUTES } from '@/lib/constants'

export const EmptyOrg = () => (
  <div className="h-full flex flex-col items-center justify-center">
    <Image src="/elements.svg" alt="Empty" height={200} width={200} />
    <h2 className="text-2xl font-semibold mt-6">Welcome to Board</h2>
    <p className="text-muted-foreground text-sm mt-2">
      Sign in to get started
    </p>
    <div className="mt-6">
      <Button size="lg" asChild>
        <Link href={AUTH_ROUTES.SIGN_IN}>Sign in</Link>
      </Button>
    </div>
  </div>
)
