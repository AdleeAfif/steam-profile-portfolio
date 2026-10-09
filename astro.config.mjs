// @ts-check
import { defineConfig, envField, passthroughImageService } from "astro/config";
import node from "@astrojs/node";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

const secret = (/** @type {boolean} */ optional) =>
  envField.string({ context: "server", access: "secret", optional });

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [react()],
  security: { checkOrigin: false },
  session: { driver: "memory" },
  image: { service: passthroughImageService() },
  env: {
    schema: {
      PROFILE_API_URL: secret(false),
      PROFILE_API_ADMIN_URL: secret(false),
      PROFILE_API_KEY: secret(false),
      PROFILE_API_APP: envField.string({ context: "server", access: "secret", default: "steam-portfolio" }),
      SITE_URL: secret(false),
      TRUST_CF_HEADERS: envField.boolean({ context: "server", access: "secret", default: false }),
      PUBLIC_GA_ID: secret(true),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
