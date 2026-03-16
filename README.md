# Kanban Task Management App

A full-stack, production-ready Kanban board web application. Built with a modern TypeScript stack, JWT authentication, and fully containerized with Docker.

**[Live Demo →](https://nextjs-kanban-board-project.vercel.app/)**

---

## Tech Stack

| Layer        | Technology                                              |
|--------------|---------------------------------------------------------|
| **Frontend** | Next.js 14, React 18, TypeScript, PrimeReact, PrimeFlex |
| **API**      | GraphQL via Apollo Server v4 + Express                  |
| **Auth**     | JWT (RS256 via `jsonwebtoken` + `bcryptjs`)             |
| **Database** | PostgreSQL 16 + Prisma ORM                              |
| **DnD**      | `@hello-pangea/dnd` (maintained react-beautiful-dnd fork) |
| **Testing**  | Jest, React Testing Library, jest-mock-extended          |
| **Infra**    | Docker + Docker Compose (multi-stage builds)            |

---

## Features

- **Boards** — Create, edit, delete Kanban boards
- **Columns** — Named columns with custom colour indicators
- **Tasks** — Full CRUD with title, description, subtasks, and status
- **Subtasks** — Checkbox toggle with progress bar visualization
- **Drag & Drop** — Move tasks between columns and reorder within columns
- **Dark / Light Theme** — Toggle stored in `localStorage`
- **JWT Auth** — Register / login; all board data is user-scoped
- **Responsive** — Mobile, tablet, and desktop layouts
- **Accessible** — ARIA labels, keyboard navigation, focus management

---

## Architecture

```
kanban-app/
├── client/          Next.js frontend (Pages Router)
│   └── src/
│       ├── components/  Reusable UI (layout, board, modals)
│       ├── contexts/    AuthContext + ThemeContext
│       ├── graphql/     Apollo queries & mutations
│       ├── lib/         Apollo client config, auth helpers
│       ├── pages/       Next.js pages (auth + board routes)
│       ├── styles/      Global CSS with CSS custom properties
│       └── types/       Shared TypeScript interfaces
│
├── server/          Express + Apollo Server backend
│   ├── prisma/      Prisma schema, migrations, seed
│   └── src/
│       ├── middleware/  JWT extraction
│       ├── resolvers/   auth, board, task resolvers
│       ├── schema/      GraphQL type definitions
│       └── utils/       JWT sign/verify, bcrypt helpers
│
└── docker-compose.yml  Orchestrates db + backend + frontend
```

---

## GraphQL Schema Overview

```graphql
type Query  { me, boards, board(id), task(id) }
type Mutation {
  register, login          # Auth
  createBoard, updateBoard, deleteBoard
  createTask, updateTask, deleteTask, moveTask
  toggleSubtask
}
```

---

## Environment Variables

| Variable                   | Service   | Description                              | Default                          |
|----------------------------|-----------|------------------------------------------|----------------------------------|
| `DATABASE_URL`             | backend   | Prisma PostgreSQL connection string      | —                                |
| `JWT_SECRET`               | backend   | Secret for signing JWTs                  | (required in production)         |
| `JWT_EXPIRES_IN`           | backend   | Token expiry                             | `7d`                             |
| `CORS_ORIGIN`              | backend   | Allowed origin for CORS                  | `http://localhost:3000`          |
| `NEXT_PUBLIC_GRAPHQL_URL`  | frontend  | GraphQL endpoint (browser-visible)       | `http://localhost:4000/graphql`  |
| `POSTGRES_USER`            | db        | PostgreSQL user                          | `kanban`                         |
| `POSTGRES_PASSWORD`        | db        | PostgreSQL password                      | `kanbanpass`                     |
| `POSTGRES_DB`              | db        | Database name                            | `kanban`                         |

---

## Contribution Guidelines

1. Fork → branch (`feat/my-feature`) → PR against `main`
2. Follow TypeScript strict mode — no `any` casts without justification
3. Write or update tests for changed behavior
4. Follow existing naming conventions
5. Commits must be conventional: `feat:`, `fix:`, `chore:`, `docs:`
