#!/bin/bash
set -e

echo "🚀 Deploying backend..."
cd /var/www/notes-app

git pull
pnpm install --frozen-lockfile

cd backend
pnpm build

sudo systemctl restart notes-backend
echo "✅ Backend deployment complete"
