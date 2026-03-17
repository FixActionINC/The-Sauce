# The Sauce by Tyrone Jones - E-Commerce Website

## Architecture
- **Monorepo**: Turborepo + pnpm workspaces
- **Frontend**: Next.js 15 (App Router, TypeScript) in `apps/web/`
- **Database**: Prisma + PostgreSQL (RDS in production)
- **Admin Panel**: Custom, built into `apps/web/` under `/admin`
- **Styling**: Tailwind CSS v4 (CSS-based config, NOT tailwind.config.ts)
- **Payments**: Square Checkout (hosted payment links, PCI compliant)
- **State**: Zustand for cart (persisted to localStorage)
- **Deploy**: Docker Compose (Nginx + Next.js) on AWS EC2

## Development Commands
```
pnpm dev              # Start Next.js dev server (:3000)
pnpm build            # Build all apps
pnpm lint             # Lint all apps
pnpm type-check       # TypeScript check all apps
npx prisma db push    # Push schema changes (dev only)
npx prisma migrate deploy  # Apply migrations (production)
npx prisma studio     # Browse database in browser
npx prisma db seed    # Seed the database
```

## Key Conventions
- **All pages are Server Components** unless they need client interactivity (cart, forms)
- **Tailwind v4**: Theme defined in `apps/web/src/app/globals.css` via `@theme {}`, NOT in tailwind.config.ts
- **Service Layer**: ALL database calls go through `src/lib/services/` (never import `db` directly in pages/actions)
- **API Facade**: `src/lib/api/` re-exports from services for backward compatibility
- **Server Actions**: `src/lib/actions/` handle auth + Zod validation + service calls + revalidation
- **Payments**: Server-side price lookup only. Never trust client-sent prices. Square SDK v44.
- **Types**: Shared interfaces in `packages/shared-types/`
- **Rendering**: Layouts use `force-dynamic` (RDS unavailable at build time). Server actions call `revalidatePath` for data cache invalidation. On-demand revalidation available via `/api/revalidate`.

## Prisma Conventions
- Import the `db` singleton from `@/lib/db` (never instantiate `new PrismaClient()` directly)
- After schema changes, run `npx prisma db push` to sync the database (dev)
- Use `npx prisma migrate deploy` in production (not `db push`)
- Use `npx prisma generate` after changing the schema to regenerate the client
- Keep seed data in `prisma/seed.ts`
- PostgreSQL via `DATABASE_URL`; Prisma Decimal requires `Number()` conversion for component props

## Brand
- **Colors**: Red (#C41E1E), Orange (#E85D24), Gold (#E7B261), Cream (#F5F0E8), Surface (#0A0A0A)
- **Design**: Dark backgrounds, bold typography, high-contrast CTAs
- **Reference**: mikeshothoney.com layout patterns

## Security Rules
- All API inputs validated with Zod
- Square webhook signatures verified via HMAC-SHA256 (`x-square-hmacsha256-signature` header)
- Environment variables: no `NEXT_PUBLIC_` prefix for secrets
- `ADMIN_SECRET` must be set in production (fail-fast, no dev fallback)
- Admin routes protected with HMAC-SHA256 signed cookie authentication
- Docker: `cap_drop: ALL`, `no-new-privileges`, non-root user

## File Structure
```
apps/web/src/app/              # Next.js pages (App Router)
apps/web/src/app/(public)/     # Customer-facing pages
apps/web/src/app/(admin)/admin/  # Admin panel pages
apps/web/src/components/       # React components
apps/web/src/lib/              # Utilities, Prisma client, helpers
apps/web/src/lib/db.ts         # Prisma client singleton
apps/web/src/lib/square.ts     # Square client singleton
apps/web/src/lib/services/     # Service layer (all DB operations)
apps/web/src/lib/actions/      # Server actions (auth + validation + service calls)
apps/web/src/lib/api/          # API facade (re-exports from services)
apps/web/src/stores/           # Zustand stores
apps/web/prisma/               # Prisma schema, migrations, seed
packages/shared-types/         # Shared TypeScript interfaces
docker/nginx/                  # Nginx reverse proxy config
terraform/                     # AWS infrastructure (VPC, EC2, RDS, ECR, S3, CloudFront, DynamoDB, SSM)
```
