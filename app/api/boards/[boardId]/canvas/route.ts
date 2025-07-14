import { auth } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const board = await prisma.board.findUnique({
      where: { id: params.boardId },
      select: { canvasData: true }
    })
    
    if (!board) {
      return new Response('Not found', { status: 404 })
    }
    
    // Return canvas data or empty canvas
    const canvasData = board.canvasData || { layers: {}, layerIds: [] }
    
    return NextResponse.json(canvasData)
  } catch (error) {
    console.error('Error fetching canvas:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { boardId: string } }
) {
  try {
    const { userId, orgId } = auth()
    if (!userId || !orgId) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    const canvasData = await request.json()
    
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
    
    // Update canvas data
    await prisma.board.update({
      where: { id: params.boardId },
      data: { canvasData }
    })
    
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Error saving canvas:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}