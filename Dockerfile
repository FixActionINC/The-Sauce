# =============================================================================
# The Sauce by Tyrone Jones - Multi-Stage Docker Build
# Target: Node 20 Alpine | pnpm 10.30.2 | Next.js 15 Standalone
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: deps - Install all dependencies using pnpm frozen lockfile
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps

# Enable corepack for pnpm management and activate the pinned version
RUN corepack enable && corepack prepare pnpm@10.30.2 --activate

WORKDIR /app

# Copy dependency manifests first for optimal Docker layer caching.
# Changes to source code will not invalidate the dependency install layer.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy all workspace package.json files so pnpm can resolve the workspace graph
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json

# Install all dependencies (including devDependencies needed for the build stage)
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 2: builder - Generate Prisma client and build the Next.js app
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder

# Enable corepack for pnpm management
RUN corepack enable && corepack prepare pnpm@10.30.2 --activate

WORKDIR /app

# Copy installed node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules

# Copy all source code
COPY . .

# Generate the Prisma client (produces .prisma/client in node_modules)
RUN pnpm --filter web exec prisma generate

# Dummy DATABASE_URL for Prisma client validation during Next.js build.
# Prisma requires this env var to exist at import time. The real connection
# string comes from SSM Parameter Store at runtime.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"

# CDN domain for brand assets. NEXT_PUBLIC_ vars are inlined at build time
# by Next.js, so client components get the correct CDN URL baked in.
ENV NEXT_PUBLIC_CDN_DOMAIN="d289qd9kfgp3a0.cloudfront.net"

# Build the Next.js app (output: standalone mode produces a self-contained server)
# The turbo build will also build dependent packages (shared-types) first
RUN pnpm --filter web build

# ---------------------------------------------------------------------------
# Stage 3: runner - Minimal production image
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Set production environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Create a non-root user for security (matching Next.js conventions)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy the standalone output from the builder stage.
# Next.js standalone mode bundles everything needed to run the app,
# including a minimal node_modules with only production dependencies.
# In a monorepo, the standalone output preserves the workspace directory structure.
COPY --from=builder /app/apps/web/.next/standalone ./

# Copy static assets (JS/CSS bundles, images, etc.) that Next.js serves directly.
# These are NOT included in the standalone output and must be copied separately.
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Copy the public directory (favicon, robots.txt, static images, etc.)
# This is also NOT included in the standalone output.
COPY --from=builder /app/apps/web/public ./apps/web/public

# Copy the Prisma schema and migrations for `prisma migrate deploy` at startup.
# The generated Prisma client is already included in the standalone node_modules.
COPY --from=builder /app/apps/web/prisma ./apps/web/prisma

# Install Prisma CLI at the exact version used by the project.
# npx would download the latest (v7) which has breaking schema changes.
RUN npm install --no-save prisma@6.19.2

# Copy the entrypoint script that handles DB schema sync and starts the server
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Drop to non-root user for runtime security
USER nextjs

EXPOSE 3000

# Use ENTRYPOINT so the container always runs the entrypoint script,
# which handles database setup before starting the Node.js server.
ENTRYPOINT ["/app/entrypoint.sh"]
