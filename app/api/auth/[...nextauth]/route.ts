import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import db from "@/lib/db";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const { email, password } = credentials ?? {};

        if (!email || !password) {
          throw new Error("Faltan credenciales");
        }

        const result = await db.execute({
          sql: "SELECT * FROM users WHERE email = ?",
          args: [email],
        });

        const user = result.rows[0];
        if (!user || !user.password) {
          throw new Error("Usuario no encontrado");
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          throw new Error("Contraseña inválida");
        }

        return {
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
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.lastname = user.lastname;
        token.phone = user.phone;
        token.address = user.address;
        token.house_apt = user.house_apt;
        token.city = user.city;
        token.state = user.state;
        token.postal_code = user.postal_code;
      }
      return token;
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
      };
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
});

export { handler as GET, handler as POST };
