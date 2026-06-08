import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "path";

const ROOT_SPA = path.resolve(__dirname, "./src/routes/__root.spa.tsx");

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      target: "react",
      autoCodeSplitting: true,
    }),
    // Force every import that resolves to src/routes/__root.tsx
    // to be served by src/routes/__root.spa.tsx instead. This is the
    // only reliable way to swap the auto-generated route tree's root
    // for the SPA build — Vite's string-form alias never matches the
    // absolute path the router plugin writes, so the original __root
    // (with its SSR `shellComponent` rendering <html><body>) was
    // being bundled and recursed at runtime.
    {
      name: "swap-root-route-for-spa",
      enforce: "pre",
      resolveId(source) {
        if (/(^|\/)routes\/__root(\.tsx?)?$/.test(source) &&
            !source.endsWith("__root.spa") &&
            !source.endsWith("__root.spa.tsx")) {
          return ROOT_SPA;
        }
        return null;
      },
    },
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist-spa",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "index.electron.html"),
    },
  },
  base: "./",
});
