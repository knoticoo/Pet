import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      isAdmin: boolean
      rememberMe?: boolean
    }
  }

  interface User {
    isAdmin: boolean
    rememberMe?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isAdmin: boolean
    rememberMe?: boolean
  }
}