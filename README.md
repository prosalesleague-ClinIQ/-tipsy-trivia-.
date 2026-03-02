# 🍺 Tipsy Trivia

A Jackbox-style multiplayer trivia party game. One central host screen, everyone plays on their phones. Features "bizarre but true" sourced fun facts, an AI-generated comedian host, dynamic scoring modes, and zero friction.

## 🚀 Quick Start (Docker)

The fastest way to run the entire stack locally:

```bash
# 1. Copy the environment variables
cp .env.example .env

# 2. Build and start services
docker-compose up --build -d

# 3. Seed the database with the initial question packs (optional)
docker-compose exec server pnpm run seed
```

- **Main Game (Host & Phone):** [http://localhost:5173](http://localhost:5173) (if running locally without Docker) or `http://localhost:3000` (Docker)
- **Admin Panel:** `http://localhost:3000/admin` (Password: `T1psY_Adm1n_!1`)

## 🛠️ Local Development (Without Docker)

This project uses `pnpm` workspaces. Start by running:
```bash
pnpm install
```

### Terminal 1: Backend Server
```bash
cd server
pnpm install
pnpm dev
# Note: SQLite DB is auto-initialized on first run
```

### Terminal 2: Frontend Client
```bash
cd client
pnpm install
pnpm dev
```

### Seed Database
To load the starter packs containing verified questions with fun-fact punchlines:
```bash
pnpm --filter server seed
```

## 🎮 Game Modes
1. **Three-Round Trivia:** 3 rounds of 10 questions. Points scale with round and difficulty. Speed bonuses reward fast answers.
2. **Rapid Fire:** Fast-paced endurance. Streak multipliers build up points, but getting a question wrong incurs a penalty (optional).
3. **Jeopardy Board:** 5x5 grid of categories. 1 Daily Double. Hidden Final Question requiring wager strategy.
4. **Legacy Ladder:** Answer correctly to climb. Three strikes and you're out. Earn bonus strikes via Ad Rewards.

## 🧠 Technology Stack
- **Monorepo:** pnpm workspaces
- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, TypeScript
- **Backend:** Node.js, Express, Socket.io, TypeScript
- **Database:** SQLite (via better-sqlite3) + Drizzle ORM
- **Deployment:** Docker & Docker Compose (Client served via Nginx, proxying websockets)

## 🕵️ Data Strategy & Fun Facts
Questions require rigorous sourcing. Every pack inside `server/data/packs` contains questions with:
- `explanation`: The documented truth.
- `hook_line`: A provocative teaser displayed by the host.
- `why_weird`: A comedic punchline summarizing why the fact breaks our expectations.
- `source_url`: Verifiable sources (mandatory 2-source rule for "Genius" difficulty).
- `fact_hash`: Deterministic SHA-256 hash preventing duplicate facts across separate packs.

## 🧑‍💻 Admin Panel
Upload custom `.json` question packs conforming to the `Pack` schema directly through the admin panel at `/admin`. Validation checks will reject malformed content or unverified sources.

## 🎨 Design System
Dark mode, glassmorphism, aggressive gradients (`#7C3AED` Purple, `#0D9488` Teal, `#F59E0B` Gold). Accessibility supported via scalable typography (`font-display: Outfit`, `font-body: Nunito`) and shape-based answer indicators.
