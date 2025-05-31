import { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      company?: string
      image?: string
      twoFactorEnabled?: boolean
      requiresTwoFactor?: boolean
      provider?: string
      providerId?: string
      // テスト用プロパティ追加
      department?: string
      plan?: string
      features?: string[]
      limits?: {
        teamMembers: number
        reports: number
        storage: number
      }
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email: string
    name: string
    company?: string
    image?: string
    twoFactorEnabled?: boolean
    requiresTwoFactor?: boolean
    provider?: string
    providerId?: string
    // テスト用プロパティ追加
    department?: string
    plan?: string
    features?: string[]
    limits?: {
      teamMembers: number
      reports: number
      storage: number
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    email: string
    name: string
    company?: string
    twoFactorEnabled?: boolean
    requiresTwoFactor?: boolean
    provider?: string
    providerId?: string
    // テスト用プロパティ追加
    department?: string
    plan?: string
    features?: string[]
    limits?: {
      teamMembers: number
      reports: number
      storage: number
    }
  }
}