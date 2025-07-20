import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting migration from Clerk to Auth.js...')
  
  // Step 1: Create a default user for existing boards
  const defaultUser = await prisma.user.create({
    data: {
      email: 'migrated@example.com',
      name: 'Migrated User',
      emailVerified: new Date(),
    }
  })
  
  console.log('Created default user:', defaultUser.id)
  
  // Step 2: Update existing boards to use the default user
  const updateResult = await prisma.board.updateMany({
    data: {
      userId: defaultUser.id,
    }
  })
  
  console.log(`Updated ${updateResult.count} boards`)
  
  // Step 3: Update UserFavorite records
  const favoriteUpdate = await prisma.userFavorite.updateMany({
    data: {
      userId: defaultUser.id,
    }
  })
  
  console.log(`Updated ${favoriteUpdate.count} favorites`)
  
  console.log('Migration completed!')
  console.log('Note: You should update these boards with the correct user after they sign in with Auth.js')
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })