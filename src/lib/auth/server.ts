import { createNeonAuth } from "@neondatabase/auth/next/server";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim().replace(/^['"]|['"]$/g, "");
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

export const auth = createNeonAuth({
  baseUrl: requiredEnv("NEON_AUTH_BASE_URL"),
  cookies: {
    secret: requiredEnv("NEON_AUTH_COOKIE_SECRET"),
  },
});
