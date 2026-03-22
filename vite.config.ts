import path from "node:path";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";

import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig } from "vite";
import viteCompression from "vite-plugin-compression";
import { VitePWA } from "vite-plugin-pwa";

const MANUAL_CHUNK_RULES = [
  {
    chunk: "react",
    matches: (id: string) =>
      id.includes("node_modules/react/") || id.includes("node_modules/react-dom/"),
  },
  {
    chunk: "convex",
    matches: (id: string) =>
      id.includes("node_modules/convex/") || id.includes("node_modules/@convex-dev/"),
  },
  {
    chunk: "editor",
    matches: (id: string) =>
      id.includes("node_modules/@blocknote/") ||
      id.includes("node_modules/prosemirror") ||
      id.includes("node_modules/@tiptap/") ||
      id.includes("node_modules/platejs") ||
      id.includes("node_modules/@udecode/"),
  },
  {
    chunk: "radix",
    matches: (id: string) => id.includes("node_modules/@radix-ui/"),
  },
  {
    chunk: "date-fns",
    matches: (id: string) => id.includes("node_modules/date-fns/"),
  },
  {
    chunk: "icons",
    matches: (id: string) => id.includes("node_modules/lucide-react/"),
  },
  {
    chunk: "router",
    matches: (id: string) => id.includes("node_modules/@tanstack/"),
  },
  {
    chunk: "dnd",
    matches: (id: string) => id.includes("node_modules/@atlaskit/"),
  },
  {
    chunk: "collab",
    matches: (id: string) =>
      id.includes("node_modules/yjs/") ||
      id.includes("node_modules/y-") ||
      id.includes("node_modules/lib0/") ||
      id.includes("node_modules/@slate-yjs/"),
  },
  {
    chunk: "motion",
    matches: (id: string) => id.includes("node_modules/framer-motion/"),
  },
] as const;

function getManualChunk(id: string) {
  return MANUAL_CHUNK_RULES.find((rule) => rule.matches(id))?.chunk;
}

export default defineConfig(({ mode }) => ({
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", {}]],
      },
    }),
    VitePWA({
      // SERVICE WORKER OWNERSHIP:
      // The app owns its own worker at public/service-worker.js, registered
      // by src/lib/serviceWorker.ts. VitePWA is used ONLY for manifest
      // generation. The plugin-generated /sw.js is a self-destroying stub
      // that does nothing — all caching, push, and offline logic lives in
      // the manually-authored service-worker.js.
      registerType: "autoUpdate",
      injectRegister: false,
      selfDestroying: true,
      includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "Nixelo - Project Management",
        short_name: "Nixelo",
        description: "Collaborative project management platform with real-time editing",
        theme_color: "#3b82f6",
        background_color: "#ffffff",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
    }),
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
    }),
    mode === "analyze"
      ? visualizer({
          open: true,
          filename: "dist/stats.html",
          gzipSize: true,
          brotliSize: true,
        })
      : null,
    mode === "development"
      ? {
          name: "inject-chef-dev",
          transform(code: string, id: string) {
            if (id.includes("main.tsx")) {
              return {
                code: `${code}

/* Added by Vite plugin inject-chef-dev */
window.addEventListener('message', async (message) => {
  if (message.source !== window.parent) return;
  if (message.data.type !== 'chefPreviewRequest') return;

  const worker = await import('https://chef.convex.dev/scripts/worker.bundled.mjs');
  await worker.respondToMessage(message);
});
            `,
                map: null,
              };
            }
            return null;
          },
        }
      : null,
  ].filter(Boolean),
  server: {
    port: 5555,
  },
  preview: {
    port: 5555,
    host: "127.0.0.1",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@convex": path.resolve(__dirname, "./convex"),
      "react-window": path.resolve(__dirname, "node_modules/react-window/dist/react-window.cjs"),
    },
  },
  build: {
    outDir: "dist/client",
    target: "esnext",
    minify: "esbuild",
    sourcemap: mode === "production" ? "hidden" : true,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 500,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks: getManualChunk,
      },
    },
  },
  optimizeDeps: {
    include: ["convex/react", "sonner", "clsx", "tailwind-merge", "remark-gfm"],
    exclude: ["driver.js", "posthog-js"],
  },
}));
