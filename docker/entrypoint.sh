#!/bin/sh
set -e

# =============================================================================
# The Sauce - Container Entrypoint
# Handles database schema sync and starts the Next.js standalone server.
# =============================================================================

# Apply any pending Prisma migrations to the PostgreSQL database.
# Uses `migrate deploy` (NOT `db push`) because this is a production environment.
# `db push` is a development tool that can cause data loss by dropping columns/tables.
# `migrate deploy` only applies pending migrations and will never modify or drop data.
# Failure here is non-fatal so the container can still start and serve
# traffic even if migrations have issues (allows manual intervention).
cd /app/apps/web
npx prisma@6.19.2 migrate deploy 2>&1 || echo "Warning: prisma migrate deploy did not complete successfully (non-fatal)"

# Start the Next.js standalone server.
# Using exec replaces the shell process with node, so signals (SIGTERM, etc.)
# are forwarded directly to the Node.js process for graceful shutdown.
cd /app
exec node apps/web/server.js
