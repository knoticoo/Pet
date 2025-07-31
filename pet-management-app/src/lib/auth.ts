import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "checkbox" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          isAdmin: user.isAdmin,
          rememberMe: credentials.rememberMe === 'true'
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    // Default session age: 30 days for remember me, 1 day for regular
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    // JWT tokens expire in 30 days by default, will be overridden per user
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.isAdmin = (user as any).isAdmin
        token.rememberMe = (user as any).rememberMe
        
        // Set different expiration times based on remember me
        const now = Math.floor(Date.now() / 1000)
        if ((user as any).rememberMe) {
          // Remember me: 30 days
          token.exp = now + (30 * 24 * 60 * 60)
        } else {
          // Regular login: 1 day
          token.exp = now + (24 * 60 * 60)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.isAdmin = token.isAdmin as boolean
        session.user.rememberMe = token.rememberMe as boolean
        
        // Set session expiry based on remember me
        if (token.rememberMe) {
          session.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        } else {
          session.expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup"
  },
  // Configure cookies for better persistence
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Will be set dynamically based on remember me
        maxAge: 30 * 24 * 60 * 60 // 30 days default
      }
    }
  }
}