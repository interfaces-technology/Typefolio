import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import {
  getAppOrigin,
  getAuthBaseUrl,
  getPasskeyRpId,
  isProductionAuth,
} from "@/lib/auth/config";
import { getDb } from "@/lib/db";
import {
  authAccount,
  authPasskey,
  authSession,
  authUser,
  authVerification,
} from "@/lib/db/schema-auth";
import { sendAuthEmail } from "@/lib/email";
import { deleteAllUserData } from "@/lib/user-data";
import { ensureSubscriptionRow } from "@/lib/entitlements";
import { getOrCreateUserLibrary } from "@/lib/storage";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim().replace(/^['"]|['"]$/g, "");
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

export const auth = betterAuth({
  baseURL: getAuthBaseUrl(),
  secret: requiredEnv("BETTER_AUTH_SECRET"),
  trustedOrigins: [getAppOrigin()],
  advanced: {
    useSecureCookies: isProductionAuth(),
  },
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: {
      user: authUser,
      session: authSession,
      account: authAccount,
      verification: authVerification,
      passkey: authPasskey,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: "Reset your Typefolio password",
        text: `Reset your password:\n\n${url}\n\nIf you did not request this, you can ignore this email.`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendAuthEmail({
        to: user.email,
        subject: "Verify your Typefolio email",
        text: `Verify your email to upload and sync fonts:\n\n${url}\n\nIf you did not create a Typefolio account, you can ignore this message.`,
      });
    },
  },
  socialProviders:
    googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : undefined,
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await ensureSubscriptionRow(user.id);
          await getOrCreateUserLibrary(user.id);
        },
      },
    },
  },
  user: {
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        await deleteAllUserData(user.id);
      },
    },
  },
  plugins: [
    passkey({
      rpID: getPasskeyRpId(),
      rpName: "Typefolio",
      origin: getAuthBaseUrl(),
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
