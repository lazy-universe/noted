# Notes App - Backend

The backend of the Notes App is a robust read-only API and synchronization engine built with Node.js, Express, and PostgreSQL. It treats your local markdown files as the single source of truth and keeps the database perfectly in sync for high-performance querying and graph relationships.

## Technical Specifications

- **Runtime Environment:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL (using `pg`)
- **File System Monitoring:** `chokidar` for real-time markdown file watching
- **Markdown Processing:** `markdown-it` for parsing and `gray-matter` for extracting YAML frontmatter
- **Logging:** `pino` with `pino-pretty` and `pino-roll` for robust, rotated application logging

## Core Features

- **Markdown Sync Engine:** Automatically watches a specified directory for new, modified, or deleted markdown files and synchronizes these changes with the PostgreSQL database.
- **Relational Data Modeling:** Stores notes, folders, tags, and bidirectional links in a structured relational format to support complex queries (e.g., for an Obsidian-like graph interface).
- **Frontmatter Extraction:** Seamlessly parses metadata like tags, aliases, and dates from markdown frontmatter.
- **High-Performance API:** Exposes fast REST endpoints for the frontend to fetch notes, search content, and retrieve knowledge graph linkages.
- **Robust Error Handling:** Comprehensive 404 tracking, missing file resolution, and detailed logging for system stability.

## Development

To start the backend development server with hot-reloading:

```bash
pnpm run dev
```

This will run the server using `nodemon` and `ts-node`.

To build for production:

```bash
pnpm run build
```
