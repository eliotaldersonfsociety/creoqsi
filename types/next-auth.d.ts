import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
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
    };
  }

  interface User {
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
}

declare module 'next-auth/jwt' {
  interface JWT {
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
}
