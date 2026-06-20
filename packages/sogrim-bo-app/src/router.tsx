import {
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
  Outlet,
} from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { ResourceListPage } from "@/pages/resource-list-page";
import { ResourceDetailPage } from "@/pages/resource-detail-page";

const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/$resource", params: { resource: "catalogs" } });
  },
});

const listRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/$resource",
  component: ResourceListPage,
});

const detailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/$resource/$id",
  component: ResourceDetailPage,
});

const routeTree = rootRoute.addChildren([indexRoute, listRoute, detailRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
