# Sogrim Back Office (`sogrim-bo-app`)

A **view-only** admin console for inspecting Sogrim's core data — **Catalogs**,
**Courses** and **Users** — in a modern master-detail UI with a raw‑JSON toggle.

> Status: **WIP**, view‑only. Edit/admin actions will be added later; the app is
> built around a generic _resource registry_ so new entities and actions slot in
> without rework. Runs **locally** for now; deployment is out of scope.

It reuses the design system, Google auth and API client of
[`sogrim-app-v2`](../sogrim-app-v2) so it looks and behaves consistently
(RTL/Hebrew, Tailwind v4 theme, the 4‑palette system, light/dark).

## What you can do

- Browse each entity in a searchable, sortable table (the **list**).
- Open a record (the **detail**) and flip between:
  - **Overview** — humanized, labelled fields grouped into cards (em‑dash for
    empty values, copy‑to‑clipboard on ids/values).
  - **JSON** — the raw document in a collapsible tree with one‑click copy.
- `Cmd/Ctrl‑K` command palette to jump between entities.

## Security model (why there is no API key)

The repo is **public**, and a single‑page app cannot keep a secret — anything
shipped to the browser is readable by anyone. So access is **not** gated by a key
baked into this app. Instead:

- The back office logs in with **Google** (the same OAuth client id as the main
  app) and sends the resulting JWT on every request.
- The **server verifies the token and enforces a per‑user allowlist**: every
  back‑office endpoint requires `Permissions::Admin` (or higher), checked against
  the `Users` collection by the verified Google identity. This is the existing,
  proven authorization mechanism in `packages/server`.
- The UI only _reflects_ this — hiding views from unauthorized users is a UX nicety,
  **the server is the security boundary**. A user with a valid Google login but
  without the `Admin` role gets an "access restricted" screen.

To use the back office locally you therefore need a user document whose
`permissions` is `Admin` or `Owner` (there is no self‑service promotion yet — set
it directly in your local/dev database).

No secrets live in this package. `VITE_GOOGLE_CLIENT_ID` is a public client id.
Keep real values in `.env.local` (git‑ignored); commit only `.env.example`.

## Running locally

Prereqs: Node 20+, the Sogrim server running locally on `:5545`
(see [`packages/server`](../server)) against a database that contains your
`Admin`/`Owner` user.

```bash
npm install
cp .env.example .env.local      # set VITE_GOOGLE_CLIENT_ID
npm run dev                      # http://localhost:3001
```

### No backend? Use mock mode

For pure UI work you can run against built‑in fixtures with no server and no login:

```bash
echo "VITE_USE_MOCKS=true" >> .env.local
npm run dev
```

## Scripts

| Script           | What it does                          |
| ---------------- | ------------------------------------- |
| `npm run dev`     | Vite dev server on `:3001`            |
| `npm run build`   | Type‑check + production build          |
| `npm run lint`    | ESLint                                 |
| `npm test`        | Vitest (run once)                      |
| `npm run test:watch` | Vitest watch mode                  |

## Architecture

- `src/resources/registry.ts` — the heart: each entity declares its label, icon,
  id accessor, list columns and detail field‑groups. Views are generic and driven
  by this registry.
- `src/data/` — a data provider that talks to the real API or returns mock
  fixtures (`VITE_USE_MOCKS`).
- `src/lib/api.ts` — typed wrappers over the server's read‑only back‑office
  endpoints (`/api/admins/{catalogs,courses,users}`).
- `src/components/bo/` — generic building blocks (`DataTable`, `ResourceDetail`,
  `Overview`, `JsonView`, `Field`, `CopyButton`).
- `src/components/{ui,layout,auth,common}` — design system reused from `sogrim-app-v2`.
