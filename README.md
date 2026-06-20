<div align="center">
  <h1>Sogrim</h1>
  <p>
    <strong>Are you ready to complete your degree?</strong>
  </p>

[![CI](https://github.com/sogrim/technion-sogrim/actions/workflows/on_pr_server_ci.yml/badge.svg)](https://github.com/sogrim/technion-sogrim/actions/workflows/on_pr_server_ci.yml)
[![Latest release](https://img.shields.io/github/v/release/sogrim/technion-sogrim?include_prereleases&label=latest)](https://github.com/sogrim/technion-sogrim/releases)
[![License](https://img.shields.io/github/license/sogrim/technion-sogrim)](LICENSE)
[![Coverage](https://codecov.io/gh/sogrim/technion-sogrim/branch/master/graph/badge.svg)](https://codecov.io/gh/sogrim/technion-sogrim)
[![Homepage](https://img.shields.io/badge/https-sogrim.org-blueviolet)](https://sogrim.org)

![Rust](https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)

</div>

![Sogrim preview](/packages/docs/preview.png)

**Sogrim** is an open-source system that tells Technion students exactly where they
stand on the way to graduation. Paste in your grade sheet and Sogrim audits it against
your catalog — which requirements you've met, what's still missing, and whether you're
ready to close your degree.

It currently supports the faculties of **Computer Science**, **Electrical Engineering**,
**Industrial Engineering & Management**, and **Medicine**.

> **Soon! 💃🏼💃🏼💃🏼** — custom catalog builder, so any institution and faculty can be supported. 🤓

## Features

- **Degree audit** — automatic status against your catalog, broken down by requirement
  bank (mandatory, elective, science, and more).
- **Grade-sheet import** — paste your grade sheet from the Technion portal; Sogrim parses
  the rest.
- **Schedule planner** — build a weekly timetable with conflict and exam-clash detection.
- **Progress at a glance** — credit summaries, GPA, and per-bank progress bars.
- **Manual overrides** — edit grades and courses by hand when you need to.

## Tech stack

<img src="/packages/docs/rrlove.png" alt="React + Rust" align="right" />

- **Backend** — [Rust](https://www.rust-lang.org/) with [Axum](https://github.com/tokio-rs/axum)
  and [tower-http](https://github.com/tower-rs/tower-http), [MongoDB](https://www.mongodb.com/),
  and Google-OAuth JWT auth.
- **Frontend** — [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/),
  [Vite](https://vite.dev/), [Tailwind CSS](https://tailwindcss.com/),
  [TanStack Query & Router](https://tanstack.com/), [Zustand](https://zustand-demo.pmnd.rs/),
  and [AG Grid](https://www.ag-grid.com/).
- **Infrastructure** — [Oracle Cloud](https://www.oracle.com/cloud/) provisioned with
  [Pulumi](https://www.pulumi.com/), and GitHub Actions for CI/CD.

## Getting started

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Bun](https://bun.sh/)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally or a connection URI)

### Backend

```bash
cd packages/server

# Required environment variables (e.g. in a .env file):
#   SOGRIM_URI        MongoDB connection string
#   SOGRIM_CLIENT_ID  Google OAuth client ID
# Optional:
#   SOGRIM_PORT       defaults to 5545
#   SOGRIM_PROFILE    defaults to "debug"

cargo run --bin sogrim-server
```

The API listens on [http://localhost:5545](http://localhost:5545).

### Frontend

```bash
cd packages/sogrim-app-v2

cp .env.example .env   # then set VITE_GOOGLE_CLIENT_ID
bun install
bun run dev
```

The app runs on [http://localhost:3000](http://localhost:3000) and proxies `/api`
requests to the backend on port `5545` — so you can leave `VITE_API_URL` empty for
local development.

## Project structure

```text
technion-sogrim/
├── packages/
│   ├── server/          # Rust + Axum backend & degree-audit engine
│   ├── sogrim-app-v2/   # React 19 frontend (current)
│   ├── sogrim-app/      # Legacy V1 frontend
│   ├── sogrim-bo-app/   # Back-office app (WIP)
│   ├── infra/           # Pulumi (Oracle Cloud) infrastructure as code
│   └── docs/            # Sample catalogs, mocks & assets
└── .github/workflows/   # CI/CD pipelines
```

## Sogrim-BO

**Sogrim-BO** ([`packages/sogrim-bo-app`](/packages/sogrim-bo-app)) — a back-office console
for administrators to inspect catalogs, courses, and users. WIP.

## Contributing

Pull requests are welcome!

1. Open an issue to discuss the change you'd like to make.
2. Fork the repo and create a feature branch from `master`.
3. Make your changes, following the existing code style and conventions.
4. Open a pull request against `master` with a clear description.

Have an idea or found a bug? You can also reach us through our
[feedback form](https://docs.google.com/forms/d/e/1FAIpQLSe7GbkAkIdTgJ3QkGmJMHhkIpjWz_I0ZX608FlxVLeT0cyJJQ/viewform).

## License

[MIT](https://choosealicense.com/licenses/mit/)
