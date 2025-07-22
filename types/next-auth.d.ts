import { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      createdAt?: Date
      providers?: string[]
    } & DefaultSession["user"]
  }
  
  interface User {
    id: string
    createdAt?: Date
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string
    accessToken?: string
  }
}