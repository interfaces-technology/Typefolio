const required = [
  "DATABASE_URL",
  "BLOB_READ_WRITE_TOKEN",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_MARKETING_URL",
] as const;

const recommended = [
  "RESEND_API_KEY",
  "POLAR_ACCESS_TOKEN",
  "POLAR_WEBHOOK_SECRET",
  "POLAR_PRODUCT_ANNUAL",
] as const;

let failed = false;

for (const key of required) {
  const value = process.env[key]?.trim();
  if (!value) {
    console.error(`Missing required env: ${key}`);
    failed = true;
  }
}

for (const key of recommended) {
  const value = process.env[key]?.trim();
  if (!value) {
    console.warn(`Missing recommended env (feature degraded): ${key}`);
  }
}

if (failed) {
  console.error(
    "\nCopy .env.example → .env.local and set values. Generate BETTER_AUTH_SECRET with: openssl rand -base64 32",
  );
  process.exit(1);
}

console.log("Environment OK for Typefolio backend.");
