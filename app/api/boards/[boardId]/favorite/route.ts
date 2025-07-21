import { AuthService } from '@/lib/auth/auth-service'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request: Request, props: { params: Promise<{ boardId: string }> }) {
  const params = await props.params;
  try {
    const user = await AuthService.requireAuth()
    
    // Verify board exists and belongs to user
    const board = await prisma.board.findFirst({
      where: {
        id: params.boardId,
        userId: user.id
      }
    })
    
    if (!board) {
      return new Response('Board not found', { status: 404 })
    }
    
    // Check if already favorited
    const existingFavorite = await prisma.userFavorite.findUnique({
      where: {
        userId_boardId: {
          userId: user.id,
          boardId: params.boardId
        }
      }
    })
    
    if (existingFavorite) {
      return new Response('Board already favorited', { status: 400 })
    }
    
    // Create favorite
    await prisma.userFavorite.create({
      data: {
        userId: user.id,
        boardId: params.boardId
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error favoriting board:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ boardId: string }> }) {
  const params = await props.params;
  try {
    const user = await AuthService.requireAuth()
    
    // Verify board exists and belongs to user
    const board = await prisma.board.findFirst({
      where: {
        id: params.boardId,
        userId: user.id
      }
    })
    
    if (!board) {
      return new Response('Board not found', { status: 404 })
    }
    
    // Delete favorite
    await prisma.userFavorite.deleteMany({
      where: {
        userId: user.id,
        boardId: params.boardId
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unfavoriting board:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}