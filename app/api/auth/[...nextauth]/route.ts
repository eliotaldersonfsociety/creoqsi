import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const { email, password } = credentials ?? {}

        if (!email || !password) return null

        const result = await db.execute({
          sql: "SELECT * FROM users WHERE email = ?",
          args: [email],
        })

        const row = result.rows[0]
        if (!row || !row.password?.value) return null

        const isValid = await bcrypt.compare(password, row.password.value)
        if (!isValid) return null

        // NextAuth espera que id sea string
        return {
          id: row.id?.value ?? "",
          name: row.name?.value ?? "",
          email: row.email?.value ?? "",
          lastname: row.lastname?.value ?? "",
          phone: row.phone?.value ?? "",
          address: row.address?.value ?? "",
          house_apt: row.house_apt?.value ?? "",
          city: row.city?.value ?? "",
          state: row.state?.value ?? "",
          postal_code: row.postal_code?.value ?? "",
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
          name: user.name,
          email: user.email,
          lastname: user.lastname,
          phone: user.phone,
          address: user.address,
          house_apt: user.house_apt,
          city: user.city,
          state: user.state,
          postal_code: user.postal_code,
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          name: token.name,
          email: token.email,
          lastname: token.lastname,
          phone: token.phone,
          address: token.address,
          house_apt: token.house_apt,
          city: token.city,
          state: token.state,
          postal_code: token.postal_code,
        }
      }
      return session
    },
  },
})

export { handler as GET, handler as POST }
