#!/bin/bash
set -e

export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"

echo "🚀 Deploying backend..."
cd /var/www/notes-app

git pull
pnpm install --frozen-lockfile

cd backend
pnpm build

sudo systemctl restart notes-backend
echo "✅ Backend deployment complete"
