# Noted. Backend - Engineering Doc

The backend is a high-performance synchronization engine and REST API designed to bridge the gap between a local markdown filesystem and a relational database.

## Tech Stack

- **Runtime:** Node.js (TypeScript)
- **Framework:** Express.js
- **Database:** PostgreSQL (Relational schema for graph data)
- **Watcher:** `chokidar` for real-time FS events
- **Parsing:** `markdown-it` (HTML generation) and `gray-matter` (Frontmatter extraction)
- **Logging:** `pino` with rotation and pretty-printing

## Data Flow & Sync Engine

The core of the backend is the **Sync Engine**, which ensures the PostgreSQL database is an eventually consistent mirror of the markdown filesystem.

1.  **Initialization:** On startup, the server performs a full recursive scan of the `NOTES_DIR`. It upserts all notes and cleans up "orphaned" entries in the DB that no longer exist on disk.
2.  **Watching:** An active `chokidar` instance monitors for `add`, `change`, and `unlink` events.
3.  **Parsing Pipeline:**
    -   **Frontmatter:** Extracts YAML metadata (tags, aliases, custom fields).
    -   **Slugification:** Generates unique slugs based on filenames and folder hierarchy to handle collisions.
    -   **Link Extraction:** Scans for `[[Wiki-style]]` links to populate the `note_links` junction table.
4.  **Relational Storage:** Data is normalized into `folders`, `notes`, `tags`, and `note_links` for efficient querying of relationships.

## Database Schema

- **`folders`**: Self-referencing table for nested directory structures.
- **`notes`**: Stores content, metadata, and generated slugs.
- **`tags` & `note_tags`**: Many-to-many relationship for note organization.
- **`note_links`**: Junction table storing bidirectional relationships between notes (from_note -> to_note).

## API Endpoints

- `GET /api/notes`: Returns a list of all notes with folder context.
- `GET /api/notes/:slug`: Returns detailed note content, rendered HTML, tags, and backlinks.
- `GET /api/notes/events`: Server-Sent Events (SSE) endpoint to notify the frontend of real-time sync updates.
- `GET /health`: Basic health check for monitoring and CI/CD.

## Startup Flow

1.  **Environment Setup**: Loads `.env` and validates `NOTES_DIR`.
2.  **DB Check**: Connects to PostgreSQL.
3.  **Initial Sync**: Runs a full filesystem sync.
4.  **Watcher Start**: Begins real-time monitoring.
5.  **HTTP Start**: Express server begins listening for requests.

## Development

**Install dependencies:**
```bash
pnpm install
```

**Run in development mode:**
```bash
pnpm run dev
```

**Build for production:**
```bash
pnpm run build
```

## Environment Variables

- `PORT`: Server port (default 3000).
- `DATABASE_URL`: PostgreSQL connection string.
- `NOTES_DIR`: Absolute path to your markdown knowledge base.
