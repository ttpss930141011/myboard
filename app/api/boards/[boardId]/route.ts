import { AuthService } from '@/lib/auth/auth-service'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { sanitizeUserInput, isValidTextContent } from '@/lib/security/validation'

export async function GET(request: Request, props: { params: Promise<{ boardId: string }> }) {
  const params = await props.params;
  try {
    const board = await prisma.board.findUnique({
      where: { id: params.boardId }
    })
    
    if (!board) {
      return new Response('Not found', { status: 404 })
    }
    
    return NextResponse.json({
      _id: board.id,
      _creationTime: board.createdAt.getTime(),
      title: board.title,
      authorId: board.userId,
      authorName: board.authorName,
      imageUrl: board.imageUrl
    })
  } catch (error) {
    console.error('Error fetching board:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export async function PATCH(request: Request, props: { params: Promise<{ boardId: string }> }) {
  const params = await props.params;
  try {
    const user = await AuthService.requireAuth()
    
    const { title } = await request.json()
    
    if (!title || title.trim().length === 0) {
      return new Response('Title is required', { status: 400 })
    }
    
    // Validate and sanitize title input
    if (!isValidTextContent(title, 60)) {
      return new Response('Title must be 1-60 characters', { status: 400 })
    }
    
    const sanitizedTitle = sanitizeUserInput(title.trim())
    
    // Verify the user owns the board
    const board = await prisma.board.findUnique({
      where: { id: params.boardId }
    })
    
    if (!board || board.userId !== user.id) {
      return new Response('Not found', { status: 404 })
    }
    
    const updatedBoard = await prisma.board.update({
      where: { id: params.boardId },
      data: { title: sanitizedTitle }
    })
    
    return NextResponse.json({
      _id: updatedBoard.id,
      _creationTime: updatedBoard.createdAt.getTime(),
      title: updatedBoard.title,
      authorId: updatedBoard.userId,
      authorName: updatedBoard.authorName,
      imageUrl: updatedBoard.imageUrl
    })
  } catch (error) {
    console.error('Error updating board:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ boardId: string }> }) {
  const params = await props.params;
  try {
    const user = await AuthService.requireAuth()
    
    // Verify the user owns the board
    const board = await prisma.board.findUnique({
      where: { id: params.boardId }
    })
    
    if (!board || board.userId !== user.id) {
      return new Response('Not found', { status: 404 })
    }
    
    await prisma.board.delete({
      where: { id: params.boardId }
    })
    
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting board:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}