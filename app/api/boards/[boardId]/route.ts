import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { boardId: string } }
) {
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
      orgId: board.orgId,
      authorId: board.authorId,
      authorName: board.authorName,
      imageUrl: board.imageUrl
    })
  } catch (error) {
    console.error('Error fetching board:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const { userId, orgId } = auth()
    if (!userId || !orgId) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    const { title } = await request.json()
    
    if (!title || title.trim().length === 0) {
      return new Response('Title is required', { status: 400 })
    }
    
    if (title.length > 60) {
      return new Response('Title cannot be longer than 60 characters', { status: 400 })
    }
    
    // Verify board belongs to user's org
    const board = await prisma.board.findFirst({
      where: {
        id: params.boardId,
        orgId
      }
    })
    
    if (!board) {
      return new Response('Not found', { status: 404 })
    }
    
    const updated = await prisma.board.update({
      where: { id: params.boardId },
      data: { title: title.trim() }
    })
    
    return NextResponse.json({
      _id: updated.id,
      title: updated.title
    })
  } catch (error) {
    console.error('Error updating board:', error)
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
    
    // Verify board belongs to user's org
    const board = await prisma.board.findFirst({
      where: {
        id: params.boardId,
        orgId
      }
    })
    
    if (!board) {
      return new Response('Not found', { status: 404 })
    }
    
    // Delete board (favorites will cascade delete)
    await prisma.board.delete({
      where: { id: params.boardId }
    })
    
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting board:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}