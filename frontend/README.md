# Noted. Frontend - UI Doc

The frontend is a responsive React application designed for high-speed navigation and consumption of a markdown-based knowledge graph.

## Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Vanilla CSS (Modern CSS variables and flex/grid layout)

## Key Features

- **Knowledge Graph Navigation:** Supports bidirectional link navigation (backlinks) and wiki-style internal links.
- **Real-time Updates:** Uses Server-Sent Events (SSE) to listen for backend sync events, automatically refreshing the UI when markdown files are edited on disk.
- **Clean Reading Experience:** Focuses on typography and readability, with a mobile-responsive sidebar for quick access.
- **Browser History Integration:** Full support for `pushState` and `popstate`, allowing users to use back/forward buttons naturally within the SPA.

## Folder Structure

- `src/components/`: Reusable UI components.
- `src/App.tsx`: Main application logic, state management, and API integration.
- `src/types.ts`: Shared TypeScript interfaces for Note and NoteDetail objects.
- `src/App.css`: Modern, variable-driven styling system.

## API Integration

The frontend communicates with the backend via:
1.  **REST API**: Standard `fetch` calls to retrieve lists and specific note details.
2.  **Server-Sent Events (SSE)**: A persistent connection to `/api/notes/events` that triggers a UI refresh whenever the backend sync engine detects a change.
3.  **Wiki-Link Interception**: Clicks on links within the rendered markdown are intercepted and handled by the React router logic to prevent full page reloads.

## Development

**Install dependencies:**
```bash
pnpm install
```

**Run development server:**
```bash
pnpm run dev
```

**Production Build:**
```bash
pnpm run build
```

**Preview Production Build:**
```bash
pnpm run preview
```
