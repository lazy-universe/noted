# Noted. Backend

A high-performance, event-driven synchronization engine that mirrors local Markdown files to a PostgreSQL database.

## 🚀 Key Features

- **Real-time Sync**: Uses `chokidar` to watch your markdown directory and sync changes instantly.
- **Wiki-links Support**: Automatically extracts `[[Link]]` syntax and builds a relational graph in the database.
- **Live Sync (SSE)**: Implements Server-Sent Events to push refresh triggers to the frontend the moment a file is saved.
- **Production Hardened**: 
  - **Concurrency Control**: Processes large batches of files (like folder moves) in controlled pools to avoid OS file descriptor limits.
  - **Slug Collision Handling**: Automatically manages duplicate filenames across different folders by appending prefixes.
  - **Observability**: Structured JSON logging with automatic rotation and 7-day retention via `pino`.

## 🛠 Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Logging**: Pino & Pino-roll
- **Parsing**: gray-matter (Frontmatter) & Markdown-it (HTML rendering)

## ⚙️ Configuration

Create a `.env` file in the root directory:

```env
PORT=3000
NOTES_DIR=/path/to/your/notes
LOG_DIR=logs

# Database
DB_USER=krish
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=notes_db
```

## 📦 Installation

```bash
# Install dependencies
pnpm install

# Initialize database
psql -h localhost -p 5433 -U krish -d notes_db -f src/db/init.sql

# Start development server
pnpm dev
```

## 📂 API Endpoints

- `GET /api/notes`: List all notes.
- `GET /api/notes/:slug`: Get detailed note content (with rendered HTML, tags, and backlinks).
- `GET /api/notes/events`: SSE stream for real-time update triggers.
