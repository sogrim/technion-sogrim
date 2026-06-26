import { createRouter, createRoute, createRootRoute, redirect, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { PlannerPage } from "@/components/planner/planner-page";
import { SettingsPage } from "@/components/settings/settings-page";
import { FaqPage } from "@/components/faq/faq-page";
import { TimetablePage } from "@/components/timetable/timetable-page";
import { ContactPage } from "@/components/contact/contact-page";

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
    throw redirect({ to: "/planner" });
  },
});

const plannerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/planner",
  component: PlannerPage,
  validateSearch: (search: Record<string, unknown>): { tab?: "requirements" | "semesters" | "exemptions" } => {
    const tab = search.tab;
    if (tab === "requirements" || tab === "semesters" || tab === "exemptions") {
      return { tab };
    }
    return {};
  },
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: SettingsPage,
});

const timetableRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/timetable",
  component: TimetablePage,
});

const faqRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/faq",
  component: FaqPage,
});

const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/contact",
  component: ContactPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  plannerRoute,
  settingsRoute,
  timetableRoute,
  faqRoute,
  contactRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
