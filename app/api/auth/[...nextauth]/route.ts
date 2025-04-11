import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials ?? {};

        if (!email || !password) return null;

        const result = await db.execute({
          sql: "SELECT * FROM users WHERE email = ? AND password = ?",
          args: [email, password],
        });

        const rows = result.rows as any[];

        if (!rows.length) return null;

        const user = rows[0];

        return {
          id: String(user.id),
          name: user.name,
          lastname: user.lastname,
          email: user.email,
          phone: user.phone,
          address: user.address,
          house_apt: user.house_apt,
          city: user.city,
          state: user.state,
          postal_code: user.postal_code,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({
      token,
      user,
    }: {
      token: JWT;
      user?: Record<string, unknown>;
    }): Promise<JWT> {
      if (user) {
        return { ...token, ...user };
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }): Promise<Session> {
      session.user = token as any;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
