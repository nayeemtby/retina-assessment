# Academic Assessment & Leaderboard Engine

A full-stack TypeScript/React monorepo application for managing students, examinations, graded results, and computing high-performance exam leaderboards via MongoDB aggregation pipelines.

---

## 1. Quick Start & Configuration

### Prerequisites
- **Node.js:** v20+ or v24+
- **Package Manager:** `pnpm` (v10+ or v12+)
- **Database:** MongoDB (local daemon or Docker on port `27017`)

### Step 1: Clone & Install Dependencies
```bash
# From the repository root:
pnpm install
```

### Step 2: Configure Environment Variables
Copy the server environment template:
```bash
cp apps/server/.env.example apps/server/.env
```
Default configuration values in `apps/server/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/assessment_db
JWT_SECRET=assessment_jwt_super_secret_key_minimum_32_chars
NODE_ENV=development
```

Ensure your MongoDB service is active:
```bash
systemctl is-active mongod || sudo systemctl start mongod
```

### Step 3: Run Development Servers
Start both the backend API and frontend client concurrently:
```bash
pnpm dev
```
Or start them independently:
```bash
# Terminal 1: Backend API (port 5000)
pnpm dev:server

# Terminal 2: Frontend Web UI (port 5173)
pnpm dev:client
```

### Step 4: Verify Endpoints
- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend API Health:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Running Automated Tests & Typecheck
```bash
# Run Vitest test suite (73 unit and integration tests):
pnpm test

# Run TypeScript typecheck across monorepo:
pnpm typecheck

# Production build:
pnpm build
```

---

## 2. Project Architecture & Directory Outline

The repository is organized as a `pnpm` workspace monorepo enforcing Functional Core / Imperative Shell (FC/IS) boundaries:

```text
.
├── apps/
│   ├── client/                  # Frontend Web SPA (React 19 + Vite)
│   │   ├── src/
│   │   │   ├── api/client.js    # Fetch client unboxing WireResult & injecting auth token
│   │   │   ├── components/      # UI components & tab panels
│   │   │   │   ├── common/      # Badge, ToastContainer, AlertBanner, Pagination
│   │   │   │   └── tabs/        # AuthTab, StudentsTab, ExamsTab, ResultsTab, LeaderboardTab
│   │   │   ├── context/         # AuthContext & ToastContext providers
│   │   │   ├── App.jsx          # Tabbed navigation host
│   │   │   └── App.css          # Modular styling
│   │   └── vite.config.js       # Vite proxy forwarding /api -> http://localhost:5000
│   │
│   └── server/                  # Backend REST API Service (Express + Mongoose + tsx)
│       ├── src/
│       │   ├── auth/            # extractCaller JWT extraction helper
│       │   ├── config/          # Zod-validated environment config (env.ts)
│       │   ├── db/              # Mongoose connection manager & graceful shutdown
│       │   ├── middleware/       # Zod validateRequest & errorHandler middlewares
│       │   ├── models/          # Mongoose Schemas (Admin, Student, Exam, Result)
│       │   ├── operations/      # Colocated FC/IS Operation Trilogies (ADR 016)
│       │   │   ├── auth/        # bootstrap, login, me
│       │   │   ├── students/    # create, list, get, update, delete
│       │   │   ├── exams/       # create, list, get, update, delete
│       │   │   ├── results/     # create, list, get, update, delete
│       │   │   └── leaderboard/ # get (MongoDB aggregation pipeline)
│       │   ├── routes/          # Express route definitions mounting operation shells
│       │   ├── app.ts           # Express application setup
│       │   └── index.ts         # Server bootstrap entrypoint
│       └── tsconfig.json        # NodeNext TypeScript configuration
│
├── packages/
│   └── contracts/               # Shared Wire Serialization & Validation Package
│       ├── src/
│       │   ├── wire.ts          # Discriminated WireResult<T, E> & FailureCodes
│       │   ├── auth.ts          # Zod schemas for Admin auth
│       │   ├── student.ts       # Zod schemas for Student CRUD & pagination query
│       │   ├── exam.ts          # Zod schemas for Exam CRUD & status enum
│       │   ├── result.ts        # Zod schemas for Result recording & mark ranges
│       │   ├── leaderboard.ts   # Zod schemas for Leaderboard projection & params
│       │   └── index.ts         # Public package barrel exports
│       ├── dist/                # Pre-compiled .d.ts declaration files
│       └── package.json         # Workspace package manifest (@project/contracts)
│
├── package.json                 # Monorepo root scripts & tooling
├── pnpm-workspace.yaml          # Workspace package registry
└── pnpm-lock.yaml               # Deterministic dependency lockfile
```

---

## 3. Core Architectural Patterns

1. **Functional Core / Imperative Shell (FC/IS — ADR 006 & ADR 016):**
   - Each mutation/query lives in `src/operations/<domain>/<operation>/`.
   - `core.ts`: Colocates narrow capability `Port` interface, slim Mongoose `Adapter` factory, and pure async `Core` orchestrator.
   - `shell.ts`: Express handler that extracts `caller: AdminProfile | null`, runs Zod validation, executes the core, and serializes `WireResult`.
2. **Authorization in Functional Core (ADR 023):**
   - Express shells never reject requests directly; they only pass `caller = extractCaller(req)`.
   - Cores enforce authorization boundaries (`if (!caller) return wireError(FailureCodes.UNAUTHORIZED)`), enabling 100% testability with zero mock servers.
3. **Strict HTTP 200 OK WireResult (ADR 006 & ADR 012):**
   - All responses return HTTP 200 OK with a discriminated `{ value } | { error }` payload.
   - Preserves dual compatibility with PRD envelope fields (`success`, `data`, `errors`, `pagination`).
4. **Referential Integrity & Conflict Invariants:**
   - Deleting a Student or Exam with associated Result records is blocked with `CONFLICT` (`409`).
   - Updating Exam `totalMarks` downwards below recorded student scores is rejected with `VALIDATION_ERROR` (`400`).
   - Duplicate registration numbers, emails, and student-exam pairs are blocked with `CONFLICT` (`409`).
5. **Leaderboard MongoDB Aggregation Pipeline:**
   - Implemented in `src/operations/leaderboard/get/core.ts`:
     `$match` by exam $\to$ `$lookup` students $\to$ `$unwind` $\to$ `$sort` by marks desc & reg number asc $\to$ `$setWindowFields` rank $\to$ `$project` percentage (rounded to 2 decimals) $\to$ `$facet` count and pagination.

---

## 4. Specification & Document Files

- **[`PRD.md`](./PRD.md):** The comprehensive Product Requirements Document defining executive requirements, ubiquitous domain models, constitutional invariants, API specifications, and acceptance verification scenarios.
- **[`PRD_raw.md`](./PRD_raw.md):** The original source requirements brief outlining administrator access, student management, exam management, result validation, and leaderboard projection rules.
