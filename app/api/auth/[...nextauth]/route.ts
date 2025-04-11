import NextAuth, { NextAuthOptions, User, Session, JWT } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import db from '@/lib/db'; // Ensure this is your database connection

interface CustomUser extends User {
  id: string;
  name: string;
  lastname: string;
  email: string;
  phone: string;
  address: string;
  house_apt: string;
  city: string;
  state: string;
  postal_code: string;
}

interface CustomSession extends Session {
  user: CustomUser;
}

interface CustomJWT extends JWT {
  id: string;
  name: string;
  lastname: string;
  email: string;
  phone: string;
  address: string;
  house_apt: string;
  city: string;
  state: string;
  postal_code: string;
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const { email, password } = credentials ?? {};

        if (!email || !password) {
          return null;
        }

        try {
          const result = await db.execute({
            sql: 'SELECT * FROM users WHERE email = ?',
            args: [email],
          });

          const rows = result.rows as any[];

          if (!rows.length) {
            return null;
          }

          const user = rows[0];
          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (isPasswordValid) {
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
            } as CustomUser;
          } else {
            return null;
          }
        } catch (error) {
          console.error('Database query error:', error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }: { token: CustomJWT; user?: CustomUser }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.lastname = user.lastname;
        token.email = user.email;
        token.phone = user.phone;
        token.address = user.address;
        token.house_apt = user.house_apt;
        token.city = user.city;
        token.state = user.state;
        token.postal_code = user.postal_code;
      }
      return token;
    },
    async session({ session, token }: { session: CustomSession; token: CustomJWT }) {
      session.user = token as CustomUser;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
