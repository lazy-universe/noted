# Notes App

Welcome to the Notes App! This project is a high-performance, markdown-based knowledge management system designed to serve as a robust platform for maintaining and navigating your personal knowledge base.

## Project Structure

This is a monorepo structured into two main components:

- **`/frontend`**: The user interface. A visually premium, mobile-responsive web application built with React and Vite.
- **`/backend`**: The data API and sync engine. A robust Node.js/Express service that watches your markdown files and synchronizes them with a PostgreSQL database.

## Prerequisites

Before setting up the project, ensure you have the following installed:
- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/) (used for workspace management)
- [PostgreSQL](https://www.postgresql.org/) (running locally or remotely)

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd notes-app
   ```

2. **Install dependencies:**
   From the root of the project, run:
   ```bash
   pnpm install
   ```

3. **Set up the Database:**
   Ensure PostgreSQL is running and create a database for the app. You will need to configure your environment variables in the `backend` directory.

4. **Run the Development Servers:**
   You can start both the frontend and backend in development mode.
   
   To start the backend:
   ```bash
   cd backend
   pnpm run dev
   ```
   
   To start the frontend:
   ```bash
   cd frontend
   pnpm run dev
   ```

## Documentation

For more detailed technical specifications and features of each component, please refer to their respective README files:
- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)
