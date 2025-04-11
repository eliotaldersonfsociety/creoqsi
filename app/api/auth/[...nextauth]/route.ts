import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import db from "@/lib/db"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const { email, password } = credentials ?? {}

        if (!email || !password) return null

        const result = await db.execute({
          sql: "SELECT * FROM users WHERE email = ?",
          args: [email],
        })

        const user = result.rows[0]
        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) return null

        // Aseguramos que todo sea string (o undefined, que es aceptado)
        return {
          id: String(user.id ?? ""),
          name: String(user.name ?? ""),
          email: String(user.email ?? ""),
          lastname: String(user.lastname ?? ""),
          phone: String(user.phone ?? ""),
          address: String(user.address ?? ""),
          house_apt: String(user.house_apt ?? ""),
          city: String(user.city ?? ""),
          state: String(user.state ?? ""),
          postal_code: String(user.postal_code ?? ""),
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        token.lastname = user.lastname
        token.phone = user.phone
        token.address = user.address
        token.house_apt = user.house_apt
        token.city = user.city
        token.state = user.state
        token.postal_code = user.postal_code
      }
      return token
    },
    async session({ session, token }) {
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
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
