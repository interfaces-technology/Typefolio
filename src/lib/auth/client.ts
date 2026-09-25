"use client";

import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL:
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:43123",
  plugins: [passkeyClient()],
});
