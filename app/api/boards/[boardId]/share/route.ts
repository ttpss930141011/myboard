import { AuthService } from '@/lib/auth/auth-service'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request, props: { params: Promise<{ boardId: string }> }) {
  const params = await props.params;
  try {
    const user = await AuthService.requireAuth()
    
    const { isPublic } = await request.json()
    
    // Verify the user owns the board
    const board = await prisma.board.findUnique({
      where: { id: params.boardId }
    })
    
    if (!board || board.userId !== user.id) {
      return new Response('Not found', { status: 404 })
    }
    
    // Update sharing settings
    const updatedBoard = await prisma.board.update({
      where: { id: params.boardId },
      data: { isPublic }
    })
    
    return NextResponse.json({
      isPublic: updatedBoard.isPublic,
      shareId: updatedBoard.shareId
    })
  } catch (error) {
    console.error('Error updating share settings:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}