'use client'

import Image from 'next/image'
import Link from 'next/link'

import { Hint } from '@/components/hint'

interface ItemProps {
  id: string
  name: string
  imageUrl: string
}

export const Item = ({ id, name, imageUrl }: ItemProps) => {
  return (
    <div className="aspect-square relative border-2 border-white rounded-[8px] p-[1px] opacity-100">
      <Hint label={name} side="right" align="start" sideOffset={18}>
        <Link href="/">
          <Image
            alt={name}
            src={imageUrl}
            width={32}
            height={32}
            className="rounded-[5px] w-full h-full cursor-pointer"
          />
        </Link>
      </Hint>
    </div>
  )
}
