# Noted. Frontend

A premium, minimalist knowledge management interface built with React and TypeScript.

## ✨ Features

- **Premium UI**: A sleek, dark-mode aesthetic featuring glassmorphism, smooth transitions, and Inter typography.
- **Live Sync**: Subscribes to backend events (SSE) to automatically refresh the UI when files are modified on disk.
- **Smartphone Ready**: Fully responsive drawer-based navigation for a seamless mobile experience.
- **Wiki-link Graph**: Dedicated "Backlinks" section to navigate between related notes.
- **Folder Support**: Visualizes your note hierarchy with folder tags and "eyebrow" metadata.

## 🎨 Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Vanilla CSS (Modern CSS3 variables & animations)
- **Icons**: Custom SVG-based minimalist icon set

## 📦 Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The frontend includes a built-in proxy to the backend at `http://localhost:3000`.

## 📱 Responsive Design

The application uses modern CSS media queries to provide:
- A floating hamburger menu for small screens.
- Auto-closing sidebar on mobile after selection.
- Optimized typography and padding for touch devices.

## 🛠 Development

```bash
# Run linter
pnpm lint

# Build for production
pnpm build
```
