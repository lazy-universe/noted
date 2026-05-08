#!/bin/bash
set -e

export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"

echo "🚀 Deploying frontend..."
cd /var/www/notes-app

git pull
pnpm install --frozen-lockfile

cd frontend
pnpm build

echo "✅ Frontend deployment complete"
