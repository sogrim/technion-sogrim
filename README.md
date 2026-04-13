<div align="center">

# סוגרים — Sogrim

**Open-source degree tracking & schedule planning for Technion students**

[![CI](https://github.com/sogrim/technion-sogrim/actions/workflows/on_pr_server_ci.yml/badge.svg)](https://github.com/sogrim/technion-sogrim/actions/workflows/on_pr_server_ci.yml)
![Latest Release](https://img.shields.io/github/v/release/sogrim/technion-sogrim?include_prereleases&label=latest)
![License](https://img.shields.io/github/license/sogrim/technion-sogrim)
[![Homepage](https://img.shields.io/badge/https-sogrim.org-blueviolet)](https://sogrim.org)
![Rust](https://img.shields.io/badge/Rust-000000?logo=rust&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)


</div>

---

**Sogrim** (סוגרים — *"closing"* in Hebrew, as in *closing your degree*) helps Technion students answer two questions:

1. **Have I met all my degree requirements?**
2. **What should my schedule look like next semester?**

It currently supports **Computer Science**, **Data Science**, and **Medicine** faculties.

## ✨ Features

### 📋 Degree Planner (מעקב תואר)

- **One-click import** — paste your grade sheet from Technion's UG portal
- **Automatic degree status** — computes progress against your catalog requirements
- **Requirement banks** — track mandatory, elective, science, and other categories separately
- **Visual progress** — progress bars, credit summaries, and GPA calculation
- **Semester management** — semester-by-semester course view with inline editing
- **Smart validation** — duplicate detection and prerequisite awareness

### 🗓️ Timetable Builder (מערכת שעות)

- **Visual weekly schedule** — drag-and-drop course placement
- **Rich course search** — filter by faculty, credits, days, and exam dates
- **Multiple drafts** — build and compare different schedule options
- **Conflict detection** — time overlaps are highlighted automatically
- **Group selection** — choose between course sections and recitation groups
- **Exam timeline** — see your exam schedule at a glance
- **Custom events** — add personal commitments to your schedule
- **Dark mode** — full dark theme support

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS 4, [shadcn/ui](https://ui.shadcn.com) |
| **Routing & Data** | TanStack Router, TanStack Query |
| **Tables** | AG Grid Community |
| **State** | Zustand |
| **Auth** | Google Identity Services (One Tap) |
| **Backend** | Rust, [Axum](https://github.com/tokio-rs/axum), tower-http |
| **Database** | MongoDB |
| **Infra** | Oracle Cloud VM, GitHub Actions CI/CD, [Pulumi](https://www.pulumi.com) IaC |

The frontend is fully **RTL** (right-to-left) and **responsive** — mobile users get a bottom navigation bar, desktop users get a sidebar.

## 📂 Project Structure

```
technion-sogrim/
├── packages/
│   ├── sogrim-app-v2/       # Frontend — React 19 + Vite + shadcn
│   │   └── src/
│   │       ├── components/  # UI components (planner, timetable, settings, auth, etc.)
│   │       ├── hooks/       # Custom React hooks
│   │       ├── stores/      # Zustand state stores
│   │       ├── types/       # TypeScript type definitions
│   │       ├── lib/         # Utilities
│   │       └── data/        # Static data & constants
│   ├── server/              # Backend — Rust + Axum
│   │   └── src/
│   │       ├── api/         # HTTP route handlers
│   │       ├── core/        # Degree computation engine
│   │       ├── db/          # MongoDB data access
│   │       ├── middleware/   # Auth & request middleware
│   │       ├── bin/          # CLI binary entry points
│   │       ├── sap/         # Course catalog parsing
│   │       └── resources/   # Static resources
│   ├── sogrim-app/           # V1 frontend (legacy)
│   ├── sogrim-bo-app/        # Back-office app
│   ├── infra/               # Pulumi infrastructure as code
│   └── docs/                # Documentation & plans
├── .github/workflows/       # CI/CD pipelines
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Node.js](https://nodejs.org/) (v20+)
- [MongoDB](https://www.mongodb.com/try/download/community) (running locally or a connection URI)

### Backend

```bash
cd packages/server
# Create .env with required variables (see config.rs for details):
# SOGRIM_URI=mongodb://... SOGRIM_CLIENT_ID=... SOGRIM_PROFILE=dev
cargo run
```

### Frontend

```bash
cd packages/sogrim-app-v2
npm install
npm run dev             # starts Vite dev server with API proxy
```

The frontend dev server proxies `/api` requests to the backend. Open [http://localhost:3000](http://localhost:3000) to see the app.

### Build for Production

```bash
# Frontend
cd packages/sogrim-app-v2
npm run build           # outputs to dist/

# Backend
cd packages/server
cargo build --release
```

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Open an issue** to discuss the change you'd like to make
2. **Fork the repo** and create a feature branch from `master`
3. **Make your changes** — follow the existing code style and conventions
4. **Submit a pull request** with a clear description

You can also share ideas or report bugs via our [feedback form](https://docs.google.com/forms/d/e/1FAIpQLSe7GbkAkIdTgJ3QkGmJMHhkIpjWz_I0ZX608FlxVLeT0cyJJQ/viewform).

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/) — Copyright (c) 2022 Sogrim.org
