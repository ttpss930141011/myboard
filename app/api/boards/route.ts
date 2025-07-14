import { auth, currentUser } from '@clerk/nextjs'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { userId, orgId } = auth()
    if (!userId || !orgId) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const favorites = searchParams.get('favorites')
    
    let boards
    
    if (favorites === 'true') {
      boards = await prisma.board.findMany({
        where: {
          orgId,
          favorites: {
            some: { userId }
          }
        },
        include: {
          favorites: {
            where: { userId }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else if (search) {
      boards = await prisma.board.findMany({
        where: {
          orgId,
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        include: {
          favorites: {
            where: { userId }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    } else {
      boards = await prisma.board.findMany({
        where: { orgId },
        include: {
          favorites: {
            where: { userId }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    }
    
    // Transform to match existing format
    const transformedBoards = boards.map(board => ({
      _id: board.id,
      _creationTime: board.createdAt.getTime(),
      title: board.title,
      orgId: board.orgId,
      authorId: board.authorId,
      authorName: board.authorName,
      imageUrl: board.imageUrl,
      isFavorite: board.favorites.length > 0
    }))
    
    return NextResponse.json(transformedBoards)
  } catch (error) {
    console.error('Error fetching boards:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId, orgId } = auth()
    const user = await currentUser()
    
    if (!userId || !orgId || !user) {
      return new Response('Unauthorized', { status: 401 })
    }
    
    const { title } = await request.json()
    
    if (!title || title.trim().length === 0) {
      return new Response('Title is required', { status: 400 })
    }
    
    if (title.length > 60) {
      return new Response('Title cannot be longer than 60 characters', { status: 400 })
    }
    
    const images = [
      '/placeholders/1.svg',
      '/placeholders/2.svg',
      '/placeholders/3.svg',
      '/placeholders/4.svg',
      '/placeholders/5.svg',
      '/placeholders/6.svg',
      '/placeholders/7.svg',
      '/placeholders/8.svg',
      '/placeholders/9.svg',
      '/placeholders/10.svg',
    ]
    
    const randomImage = images[Math.floor(Math.random() * images.length)]
    
    const board = await prisma.board.create({
      data: {
        title: title.trim(),
        orgId,
        authorId: userId,
        authorName: user.firstName || 'User',
        imageUrl: randomImage,
        canvasData: {
          layers: {},
          layerIds: []
        }
      }
    })
    
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
    console.error('Error creating board:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}