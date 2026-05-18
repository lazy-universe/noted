# Noted.

**A high-performance, self-hosted knowledge base that synchronizes local Markdown files into a relational PostgreSQL engine with bi-directional linking.**

[![Deploy Backend](https://github.com/lazy-universe/notes-app/actions/workflows/deploy-backend.yml/badge.svg)](https://github.com/lazy-universe/notes-app/actions/workflows/deploy-backend.yml)
[![Deploy Frontend](https://github.com/lazy-universe/notes-app/actions/workflows/deploy-frontend.yml/badge.svg)](https://github.com/lazy-universe/notes-app/actions/workflows/deploy-frontend.yml)

## Why this project?

Most "notes apps" are either simple CRUD wrappers around a database or document-based systems that make relational queries (like backlinks) expensive. **Noted** treats your local Markdown files as the Single Source of Truth (SSOT) but projects them into a relational PostgreSQL schema.

This allows you to keep the portability and longevity of flat Markdown files while gaining the querying power of a production-grade relational database—enabling features like real-time backlink discovery and complex tag-based filtering.

## Key Features

- **Markdown Sync Engine**: Real-time watching of your filesystem. Add, edit, or delete a file, and the database updates in milliseconds.
- **Relational Knowledge Graph**: Notes, folders, tags, and links are stored in a normalized SQL schema.
- **Bi-directional Linking**: Automatic extraction of `[[wiki-links]]` to build a navigable graph of information.
- **Real-time Updates**: Uses Server-Sent Events (SSE) to push sync notifications to the browser immediately.
- **Frontmatter Support**: Rich metadata parsing via YAML frontmatter, stored as `JSONB` for flexible querying.
- **Self-Hosted Infrastructure**: Optimized for deployment on private hardware via Tailscale and Systemd.

## Architecture Overview

```mermaid
graph TD
    subgraph Local Machine
        FS[Markdown Filesystem]
    end

    subgraph Backend Server
        Watcher[Chokidar Watcher]
        Parser[Markdown-it / Gray-Matter]
        Sync[Sync Engine]
        API[Express REST API]
        SSE[SSE Stream]
        DB[(PostgreSQL)]
    end

    subgraph Client
        SPA[React SPA]
    end

    FS -->|File Events| Watcher
    Watcher -->|Raw Data| Parser
    Parser -->|Structured Data| Sync
    Sync -->|SQL Transaction| DB
    Sync -->|Notify| SSE
    SSE -->|Update UI| SPA
    SPA -->|Fetch| API
    API -->|Query| DB
```

### The Sync Cycle
1. **Watch**: `chokidar` monitors a target directory for `.md` changes.
2. **Parse**: `markdown-it` extracts content, while `gray-matter` pulls YAML metadata. A custom regex pass identifies internal wiki-links.
3. **Persist**: An atomic PostgreSQL transaction updates the note, refreshes junction tables for tags and links, and handles slug collisions.
4. **Broadcast**: An SSE event is fired to all connected clients, triggering a targeted UI refresh.

## Tech Stack

- **Backend**: TypeScript, Express.js, PostgreSQL
- **Parsing**: `markdown-it`, `gray-matter`, `chokidar`
- **Frontend**: TypeScript, React, Vite
- **Observability**: `pino` (structured logging)
- **Deployment**: Tailscale (Secure Networking), GitHub Actions (CI/CD), Systemd

## Monorepo Structure

```text
.
├── backend/            # Express server & Sync engine
│   ├── src/db/         # SQL schema & connection pool
│   ├── src/services/   # File watching & parsing logic
│   └── src/routes/     # REST & SSE endpoints
├── frontend/           # React SPA
│   └── src/            # Dark-mode UI & custom history routing
├── scripts/            # Deployment automation
└── .github/workflows/  # Tailscale-enabled CI/CD pipelines
```

## Local Setup

### Prerequisites
- Node.js (pnpm preferred)
- PostgreSQL instance

### Environment Variables
Create a `.env` file in the `backend/` directory:
```env
PORT=3001
DATABASE_URL=postgres://user:pass@localhost:5432/notes
NOTES_DIR=/path/to/your/markdown/vault
```

### Running Locally
```bash
# Install dependencies
pnpm install

# Start development environment
pnpm dev
```

## Deployment Setup

This project is designed for high-security, self-hosted environments.

1. **Secure Access**: The deployment server sits behind a **Tailscale** mesh network. CI/CD runners connect via the `tailscale/github-action`.
2. **Process Management**: Backend is managed by **Systemd** (`notes-backend.service`), ensuring auto-restart on failure and logging to `journald`.
3. **CI/CD Pipeline**:
    - **Push to main** triggers a GitHub Action.
    - Action connects to the private Tailscale IP via SSH.
    - Runs `scripts/deploy-backend.sh` which pulls code, installs dependencies, builds, and restarts the system service.

## Technical Tradeoffs & Decisions

### 1. Relational vs. Document Store
While many knowledge management systems use Document DBs (like MongoDB or flat files), **Noted** uses **PostgreSQL**. 
- **The Win**: Relational integrity for backlinks and tags. We can query "find all notes that link to X" or "find notes in folder Y with tag Z" using simple JOINs instead of expensive full-text scans.
- **The Cost**: Schema rigidity. Any change to metadata structure requires a DB migration.

### 2. Server-Sent Events (SSE) vs. WebSockets
For real-time updates, we chose **SSE** over WebSockets.
- **Rationale**: The communication is strictly uni-directional (Server -> Client). SSE is lighter, works over standard HTTP, and has automatic reconnection built-in. WebSockets would be overkill for a sync notification system.

### 3. Custom Router vs. React Router
The frontend implements its own navigation logic using the `History API`.
- **Rationale**: Minimal bundle size and maximum control over "wiki-link" interception. Since the app is a single-view system, the overhead of a full routing library wasn't justified.

### 4. Sync Engine Performance
To handle large vaults (1000+ notes), the sync engine uses an **Async Pool** (concurrency limited to 10).
- **Design Decision**: This prevents the backend from exhausting the PostgreSQL connection pool during the initial full-vault scan while maintaining high throughput.

## Implementation Details

### Relational Schema Design
The schema is designed for graph-like traversal:
- `notes`: Primary content with `JSONB` frontmatter for extensibility.
- `folders`: Recursive self-referencing table (`parent_id`) allowing for infinite nesting levels.
- `note_links`: A dedicated junction table for bi-directional references (`from_note_id`, `to_note_id`).
- `tags`: Normalized tags to ensure consistency across the vault.

### Real-time File Watching
We use `chokidar` for low-level OS filesystem events. When a change is detected:
1. The file is read and passed through a custom parsing pipeline.
2. Metadata is extracted.
3. An `UPSERT` operation is performed in PostgreSQL.
4. A small JSON payload is pushed through the SSE stream to notify active clients.

## Limitations

- **Read-Only Interface**: The web UI is for consumption and navigation. Content creation happens in your local filesystem (optimized for Obsidian/VS Code workflows).
- **Single Directory**: The sync engine currently watches a single root directory.
- **Manual Migration**: Database schema updates require manual `psql` execution (migration system planned).

## Future Improvements

- [ ] Graph Visualization (Canvas-based link overview).
- [ ] Full-text search using Postgres `tsvector`.
- [ ] Support for image/asset synchronization.
- [ ] Mobile-native PWA enhancements.
