import { defineConfig } from "@neondatabase/config/v1";

export default defineConfig({
  auth: true,
  functions: {
    api: {
      name: "Typefolio API",
      source: "./functions/api.ts",
    },
  },
});
