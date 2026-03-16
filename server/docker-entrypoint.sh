#!/bin/sh
set -e

echo "Applying database schema..."
npx prisma db push --accept-data-loss

echo "Checking seed..."
NEEDS_SEED=$(node -e "
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.count()
  .then(n => { console.log(n === 0 ? 'yes' : 'no'); })
  .catch(() => console.log('yes'))
  .finally(() => p.\$disconnect());
" 2>/dev/null)

if [ "$NEEDS_SEED" = "yes" ]; then
  echo "Running seed..."
  node dist/prisma/seed.js
else
  echo "Database already seeded, skipping."
fi

exec "$@"
