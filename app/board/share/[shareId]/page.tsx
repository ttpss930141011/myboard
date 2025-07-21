import { Canvas } from "@/app/board/[boardId]/_components/canvas"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"

interface SharePageProps {
  params: Promise<{ shareId: string }>
}

export default async function SharePage(props: SharePageProps) {
  const params = await props.params;
  const board = await prisma.board.findUnique({
    where: { 
      shareId: params.shareId,
      isPublic: true 
    }
  })

  if (!board) {
    notFound()
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b bg-white">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">{board.title}</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Read-only mode</span>
            <div className="h-2 w-2 rounded-full bg-orange-500" />
          </div>
        </div>
      </div>
      <div className="flex-1">
        <Canvas 
          boardId={board.id}
          readonly
        />
      </div>
    </div>
  )
}