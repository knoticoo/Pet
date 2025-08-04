import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"



interface ExtendedToken {
  sub?: string
  isAdmin?: boolean
  rememberMe?: boolean
  exp?: number
}



export const authOptions = {
  adapter: PrismaAdapter(prisma),
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
    strategy: "jwt" as const,
    // Increase session max age and make it more persistent
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
  jwt: {
    // JWT tokens expire in 30 days by default
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.sub = user.id
        token.isAdmin = user.isAdmin
        token.rememberMe = user.rememberMe
        
        // Set different expiration times based on remember me
        const now = Math.floor(Date.now() / 1000)
        if (user.rememberMe) {
          // Remember me: 30 days
          token.exp = now + (30 * 24 * 60 * 60)
        } else {
          // Regular login: 7 days (increased from 1 day)
          token.exp = now + (7 * 24 * 60 * 60)
        }
      }
      
      // Refresh token if it's close to expiring (within 1 day)
      if (token.exp && typeof token.exp === 'number') {
        const now = Math.floor(Date.now() / 1000)
        const timeUntilExpiry = token.exp - now
        const oneDayInSeconds = 24 * 60 * 60
        
        if (timeUntilExpiry < oneDayInSeconds) {
          // Extend token expiry
          if (token.rememberMe) {
            token.exp = now + (30 * 24 * 60 * 60)
          } else {
            token.exp = now + (7 * 24 * 60 * 60)
          }
        }
      }
      
      return token
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async session({ session, token }: { session: any; token: ExtendedToken }) {
      if (session.user && token) {
        session.user.id = token.sub
        session.user.isAdmin = token.isAdmin
        session.user.rememberMe = token.rememberMe
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    signOut: "/auth/signin"
  },
  // Configure cookies for better persistence, especially on mobile
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Longer cookie expiry for better persistence on mobile
        maxAge: 30 * 24 * 60 * 60 // 30 days
      }
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60
      }
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60
      }
    }
  },
  // Improve mobile session handling
  useSecureCookies: process.env.NODE_ENV === 'production'
}