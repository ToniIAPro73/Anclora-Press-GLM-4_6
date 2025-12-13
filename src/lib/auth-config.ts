/**
 * NextAuth Configuration
 * Centralized authentication setup for Anclora Press
 */

import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { db } from './db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // TODO: Replace with actual authentication logic
        // This is a placeholder that allows demo login
        // In production, verify against database with hashed passwords

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        // Demo: Allow any email for now (replace with real auth)
        if (credentials.password === 'demo') {
          return {
            id: credentials.email.split('@')[0],
            email: credentials.email,
            name: credentials.email.split('@')[0]
          }
        }

        throw new Error('Invalid credentials')
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET || 'fallback-dev-secret-not-for-production'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  }
}
