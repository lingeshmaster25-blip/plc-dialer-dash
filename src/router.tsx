import { QueryClient } from "@tanstack/react-query";
import { createRouter, createMemoryHistory } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  // Under file:// (packaged Electron build) the URL path is
  // "/C:/Users/.../index.electron.html", which the router can't match
  // against the "/" index route — so it renders 404. Force a memory
  // history starting at "/" in that case. The hosted web build keeps
  // its normal browser history.
  const isFile =
    typeof window !== "undefined" && window.location.protocol === "file:";
  const history = isFile
    ? createMemoryHistory({ initialEntries: ["/"] })
    : undefined;

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    ...(history ? { history } : {}),
  });

  return router;
};
