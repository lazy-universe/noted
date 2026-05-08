#!/bin/bash
set -e

echo "🚀 Deploying frontend..."
cd /var/www/notes-app

git pull
pnpm install --frozen-lockfile

cd frontend
pnpm build

echo "✅ Frontend deployment complete"
