import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/** Creates and configures the TanStack router with scroll restoration and preloading. */
export function getRouter() {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent", // Preload on hover
  });

  return router;
}

// Type declaration for router
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
