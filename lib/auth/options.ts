import type { NextAuthOptions } from "next-auth";
import type { Provider } from "next-auth/providers/index";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { getAuthSecret, getOAuthProviderCredentials } from "@/lib/auth/config";
import { saveBookMeUser } from "@/lib/auth/user-store";

const providers: Provider[] = [];
const providerCredentials = getOAuthProviderCredentials();

if (providerCredentials.google) {
  providers.push(
    GoogleProvider({
      clientId: providerCredentials.google.clientId,
      clientSecret: providerCredentials.google.clientSecret,
    }),
  );
}

if (providerCredentials.github) {
  providers.push(
    GitHubProvider({
      clientId: providerCredentials.github.clientId,
      clientSecret: providerCredentials.github.clientSecret,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  secret: getAuthSecret(),
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      await saveBookMeUser({
        email: user.email,
        name: user.name,
        image: user.image,
        provider: account?.provider,
      });

      return true;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.name = session.user.name ?? token.name;
        session.user.email = session.user.email ?? token.email;
      }

      return session;
    },
  },
};
