import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const { userId, orgId } = auth()
    if (!userId || !orgId) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    // Verify board exists and belongs to user's org
    const board = await prisma.board.findFirst({
      where: {
        id: params.boardId,
        orgId
      }
    })
    
    if (!board) {
      return new Response('Board not found', { status: 404 })
    }
    
    // Check if already favorited
    const existingFavorite = await prisma.userFavorite.findUnique({
      where: {
        userId_boardId: {
          userId,
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
        userId,
        boardId: params.boardId,
        orgId
      }
    })
    
    return NextResponse.json({
      _id: board.id,
      title: board.title
    })
  } catch (error) {
    console.error('Error favoriting board:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const { userId, orgId } = auth()
    if (!userId || !orgId) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    // Find and delete favorite
    const favorite = await prisma.userFavorite.findUnique({
      where: {
        userId_boardId: {
          userId,
          boardId: params.boardId
        }
      }
    })
    
    if (!favorite) {
      return new Response('Favorite not found', { status: 404 })
    }
    
    await prisma.userFavorite.delete({
      where: {
        id: favorite.id
      }
    })
    
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error unfavoriting board:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}