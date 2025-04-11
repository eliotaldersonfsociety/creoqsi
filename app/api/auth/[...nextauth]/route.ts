import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import db from "@/lib/db";
import { NextAuthOptions } from "next-auth";

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("Authorize function started");
        const { email, password } = credentials ?? {};

        if (!email || !password) {
          console.log("Missing email or password");
          return null;
        }

        try {
          console.log("Attempting to execute database query");
          const result = await db.execute({
            sql: "SELECT * FROM users WHERE email = ? AND password = ?",
            args: [email, password],
          });

          const rows = result.rows as any[];

          if (!rows.length) {
            console.log("No user found with the provided credentials");
            return null;
          }

          const user = rows[0];
          console.log("User found:", user);

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
        } catch (error) {
          console.error("Database query error:", error);
          return null;
        }
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
    async jwt({ token, user }) {
      if (user) {
        console.log("JWT callback - adding user to token");
        return { ...token, ...user };
      }
      console.log("JWT callback - returning token");
      return token;
    },
    async session({ session, token }) {
      console.log("Session callback - adding token to session");
      session.user = token as any;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
