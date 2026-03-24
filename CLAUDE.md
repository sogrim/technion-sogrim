# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sogrim is an open-source system that checks academic degree completion status for Technion (currently Faculty of Computer Science). It's a monorepo with a Rust backend and React/TypeScript frontend.

## Repository Structure

- `packages/server/` — Rust backend (Actix-web + MongoDB)
- `packages/sogrim-app/` — React frontend (TypeScript + MUI + MobX)
- `packages/sogrim-bo-app/` — Back-office admin app (WIP, mostly empty)
- `packages/docs/` — Documentation and API specs

## Build & Development Commands

### Backend (Rust)

All commands run from the repo root using `--manifest-path`:

```bash
# Build
cargo build --manifest-path packages/server/Cargo.toml

# Run (requires .env with IP, PORT, URI, CLIENT_ID)
cargo run --manifest-path packages/server/Cargo.toml

# Test
cargo test --manifest-path packages/server/Cargo.toml

# Run a single test
cargo test --manifest-path packages/server/Cargo.toml <test_name>

# Format check (CI enforced)
cargo fmt --manifest-path packages/server/Cargo.toml --all -- --check

# Format fix
cargo fmt --manifest-path packages/server/Cargo.toml --all

# Lint (CI enforced, warnings are errors)
cargo clippy --manifest-path packages/server/Cargo.toml --all-targets -- -D warnings
```

### Frontend (React)

```bash
# Install dependencies
npm install --prefix packages/sogrim-app

# Dev server
npm start --prefix packages/sogrim-app

# Build
npm run build --prefix packages/sogrim-app

# Test
npm test --prefix packages/sogrim-app

# Format
npm run pretty --prefix packages/sogrim-app
```

## Backend Architecture

The server follows a layered architecture: **API → Core (business logic) → DB**.

- `src/api/` — HTTP handlers organized by role: `students.rs`, `admins.rs`, `owners.rs`
- `src/core/` — Business logic, especially the degree computation engine
  - `core/degree_status/` — Computes whether a student has completed their degree (`compute_status.rs`, `compute_bank.rs`, `preprocessing.rs`, `postprocessing.rs`, `overflow.rs`)
  - `core/bank_rule/` — Rule engine for validating different types of course requirements (mandatory, elective, specialization, sport, etc.)
  - `core/credit_transfer_graph.rs` — Course dependency/credit transfer using petgraph
  - `core/parser.rs` — Parses course data from UG system format
- `src/db/` — MongoDB data access layer
- `src/middleware/` — Auth (JWT via Google OAuth), CORS, logging
- `src/resources/` — Domain models: `user.rs` (roles/permissions), `catalog.rs`, `course.rs`
- `src/config.rs` — Compile-time config via `env!()` macros (loaded from `.env` by `build.rs`)
- `src/consts.rs` — Hebrew-language constants for course bank names and requirements

### Key patterns

- Environment variables (`IP`, `PORT`, `URI`, `CLIENT_ID`, optional `PROFILE`) are embedded at **compile time** via `build.rs` + `env!()`. A `.env` file is needed for local dev but not in CI/production where env vars are set directly.
- Three permission scopes: `Student`, `Admin`, `Owner` — routes are grouped under `/students`, `/admins`, `/owners`.
- Tests use the `jsonwebtoken-google` crate's `test-helper` feature for mock auth.

## Frontend Architecture

- **State management:** MobX stores (`RootStore`, `DataStore`, `AuthStore`, `UiStore`)
- **Data fetching:** React Query with Axios
- **UI:** Material-UI (MUI v5) with RTL (Hebrew) support via stylis-plugin-rtl
- **Routing:** React Router v6
- **Auth:** Google OAuth with JWT

## CI/CD

GitHub Actions runs on PRs touching `packages/server/`:
1. `cargo test`
2. `cargo fmt --check`
3. `cargo clippy -- -D warnings`

Code coverage via `cargo tarpaulin` (nightly) on pushes to master, reported to Codecov.

## Contributing

Branch from `development`, PR back to `development`. Open an issue first to discuss changes.
