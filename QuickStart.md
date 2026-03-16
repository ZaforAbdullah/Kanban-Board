# QuickStart — Run the Kanban App Locally

Get the fully working app running in under 5 minutes using Docker Compose.

---

## Prerequisites

| Tool           | Min version | Install link                              |
|----------------|-------------|-------------------------------------------|
| Docker Desktop | 24+         | https://www.docker.com/products/docker-desktop |
| Docker Compose | v2 (included with Docker Desktop) | — |
| Node.js        | 20+ (only for local dev without Docker)  | https://nodejs.org |

---

## Step 1 — Clone / Navigate to project root

```bash
# If you just downloaded the files, navigate to the project root
cd ExpressPrisma

# Verify the structure
ls
# Should show: client/  server/  docker-compose.yml  .env.example  README.md  CLAUDE.md  QuickStart.md
```

---

## Step 2 — Create your `.env` file

```bash
cp .env.example .env
```

The defaults work out of the box for local Docker Compose. For production, **change `JWT_SECRET`** to a long random string.

---

## Step 3 — Build and start all services

```bash
docker compose up --build
```

This will:
1. Pull `postgres:16-alpine`
2. Build the `backend` image (installs deps, compiles TypeScript, generates Prisma client)
3. Build the `frontend` image (installs deps, runs `next build`)
4. Start all three containers
5. Run Prisma migrations automatically (`prisma migrate deploy`)
6. Seed the database with demo boards and a demo user (first run only)

> **First build takes 3–5 minutes** — subsequent starts are near-instant.

---

## Step 4 — Open the app

| Service   | URL                              |
|-----------|----------------------------------|
| Frontend  | http://localhost:3000            |
| GraphQL   | http://localhost:4000/graphql    |
| DB        | `localhost:5432` (kanban/kanbanpass) |

**Demo credentials:**
```
Email:    demo@kanban.app
Password: demo1234
```

---

## Step 5 — Explore

- Log in → you'll see 3 pre-seeded boards: Platform Launch, Marketing Plan, Roadmap
- Click any board to see its columns and tasks
- Drag tasks between columns
- Click a task card to view subtasks, edit, or delete
- Use the header "+ Add Task" button
- Toggle dark/light mode in the sidebar
- Create new boards with the sidebar "+ Create New Board" button

---

## Stopping the app

```bash
# Stop all containers (keeps DB data)
docker compose down

# Stop and remove all data (fresh start)
docker compose down -v
```

---

## Local Development (without Docker)

For a faster feedback loop during development:

### 1. Set up the server

```bash
cd server
cp ../.env.example .env
# Edit .env: set DATABASE_URL=postgresql://kanban:kanbanpass@localhost:5432/kanban
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed      # seeds demo data
npm run dev             # starts at http://localhost:4000
```

### 2. Set up the client (new terminal)

```bash
cd client
cp ../.env.example .env.local
# Edit .env.local: set NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
npm install
npm run dev             # starts at http://localhost:3000
```

---

## Running Tests

### Server tests (no database required)

```bash
cd server
npm install
npm test
# or with coverage:
npm run test:coverage
```

### Client tests

```bash
cd client
npm install
npm test
```

---

## Prisma Commands (server only)

```bash
# View DB in browser GUI
cd server && npx prisma studio

# Create a new migration after schema change
npx prisma migrate dev --name <migration-name>

# Apply migrations in production/Docker
npx prisma migrate deploy

# Re-seed
npx prisma db seed
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000/4000/5432 already in use | Stop other services or change ports in `docker-compose.yml` |
| DB connection refused | Wait for `kanban_db` to be healthy: `docker compose ps` |
| `prisma generate` errors | Run `npm install` first inside `server/` |
| White screen / auth loop | Clear `localStorage` in DevTools and reload |
| `NEXT_PUBLIC_GRAPHQL_URL` not working | Ensure it's set before `docker compose build` — it's baked in at build time |
