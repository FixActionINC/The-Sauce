# Security Architecture Specification
## The Sauce - E-Commerce Platform

**Version:** 2.0
**Date:** 2026-02-27
**Classification:** Internal - Confidential
**Stack:** Next.js 15 (App Router) | Prisma + PostgreSQL (RDS) | Square Checkout | Docker + Nginx | AWS (EC2, RDS, S3, CloudFront, DynamoDB, SSM)

---

## Table of Contents

1. [Threat Model](#1-threat-model)
2. [Nginx Security Configuration](#2-nginx-security-configuration)
3. [Next.js Security](#3-nextjs-security)
4. [Square Payment Security](#4-square-payment-security)
5. [Authentication and Authorization](#5-authentication-and-authorization)
6. [Image Upload Security](#6-image-upload-security)
7. [Docker Security](#7-docker-security)
8. [Infrastructure Security](#8-infrastructure-security)
9. [Secrets Management](#9-secrets-management)
10. [Security Checklist](#10-security-checklist)

---

## 1. Threat Model

### 1.1 System Architecture Overview

```
                        Internet
                           |
                    [AWS Security Groups]
                    Inbound: 80, 443 only
                           |
                   +-------+-------+
                   |    Nginx      |
                   |  :80 / :443   |
                   |  TLS term     |
                   |  Rate limit   |
                   |  Sec headers  |
                   +-------+-------+
                           |
                   [internal Docker network]
                           |
                   +-------+-------+
                   |   Next.js     |
                   |   :3000       |
                   |   App Router  |
                   |   API routes  |
                   |   Server acts |
                   +--+----+----+--+
                      |    |    |
          +-----------+    |    +------------+
          |                |                 |
   [RDS PostgreSQL]   [S3 + CloudFront]  [Square API]
    Private subnet     Product images     Hosted payment
    Prisma ORM         OAC-signed         links (SDK v44)
                       HTTPS only
          |
   [SSM Param Store]   [DynamoDB]
    All secrets          Sessions table
    VPC endpoints        TTL expiration
```

All application containers run on a single EC2 instance (t3.small). Nginx is the
sole public-facing service. RDS sits in private subnets with no public access.

### 1.2 Data Classification

| Data Type | Classification | Storage Location | Protection |
|-----------|---------------|------------------|------------|
| Payment card numbers | **PCI Restricted** | Never stored (Square handles) | N/A -- never touches our systems |
| Square access token | **Secret** | SSM Parameter Store (SecureString) | Encrypted at rest (KMS) + in transit |
| Square webhook signature key | **Secret** | SSM Parameter Store (SecureString) | Encrypted at rest (KMS) + in transit |
| Admin credentials | **Secret** | PostgreSQL (bcrypt hashed) | Hashed, never reversible |
| ADMIN_SECRET (HMAC key) | **Secret** | SSM Parameter Store (SecureString) | Encrypted at rest (KMS) + in transit |
| DATABASE_URL | **Secret** | SSM Parameter Store (SecureString) | Encrypted at rest (KMS) + in transit |
| Customer email addresses | **Confidential - PII** | PostgreSQL (RDS) | Encrypted at rest (AES-256) + in transit |
| Customer names | **Confidential - PII** | PostgreSQL (RDS) | Encrypted at rest (AES-256) + in transit |
| Customer shipping addresses | **Confidential - PII** | PostgreSQL (RDS) | Encrypted at rest (AES-256) + in transit |
| Order history | **Confidential** | PostgreSQL (RDS) | Encrypted at rest + in transit |
| Product catalog | **Public** | PostgreSQL (RDS) | In transit only |
| Product images | **Public** | S3 (private bucket, served via CloudFront) | Encrypted at rest (SSE-S3) |
| Admin session tokens | **Confidential** | HTTP-only signed cookies | HMAC-SHA256 signed, TLS in transit |

### 1.3 Attack Surfaces

#### Surface 1: Nginx Reverse Proxy (External-facing)

| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| DDoS / volumetric attack | High | High | Rate limiting (10r/s general, 5r/s API), AWS Security Groups |
| TLS downgrade / MITM | Medium | Critical | TLS 1.2+ only, HSTS, strong ciphers |
| Path traversal via malformed URLs | Medium | High | Block `.git`, `.env`, `.sql`, `.sh` extensions |
| Clickjacking | Medium | Medium | X-Frame-Options: DENY, CSP frame-ancestors |
| MIME type sniffing | Low | Medium | X-Content-Type-Options: nosniff |

#### Surface 2: Next.js Application (API Routes + Server Actions)

| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| Cross-Site Scripting (XSS) | High | High | CSP in next.config.ts, React auto-escaping |
| Injection via API routes | Medium | Critical | Zod input validation, Prisma parameterized queries |
| SSRF via image URLs | Medium | High | `remotePatterns` in next.config.ts (allowlist) |
| Price manipulation | High | High | Server-side price lookup from DB, never trust client |
| Sensitive data in client bundles | Medium | High | Service layer is server-only, `server-only` package |
| Information disclosure in errors | Medium | Medium | Generic client errors, detailed server logs |

#### Surface 3: Square Integration

| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| Webhook spoofing | Medium | Critical | HMAC-SHA256 signature verification with timing-safe comparison |
| Price manipulation (client-side) | High | High | Server-side price lookup, ad-hoc line items built from DB |
| Replay attacks on webhooks | Medium | High | Idempotency check (getOrderBySquareOrderId) |
| Square key exposure | Low | Critical | Keys in SSM Parameter Store, lazy-initialized client |

#### Surface 4: PostgreSQL (RDS)

| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| SQL injection | Low | Critical | Prisma ORM (parameterized queries only) |
| Unauthorized network access | Low | Critical | Private subnet, rds_sg allows only web_sg |
| Unencrypted data at rest | Low | High | `storage_encrypted = true` (RDS AES-256) |
| Credential theft | Medium | Critical | SSM Parameter Store, no plaintext on disk |

#### Surface 5: Docker / Host Infrastructure

| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| Container escape | Low | Critical | Non-root user, cap_drop ALL, no-new-privileges |
| Vulnerable base images | High | High | node:20-alpine, regular updates |
| SSH brute force on EC2 | High | Critical | Restricted CIDR in ssh_sg, key-only auth |
| Secrets in image layers | Medium | Critical | Multi-stage build, dummy DATABASE_URL at build time |

### 1.4 Trust Boundaries

```
Trust Boundary 1: Internet <-> Nginx
  - All input is untrusted
  - TLS termination point
  - Rate limiting enforcement point

Trust Boundary 2: Nginx <-> Next.js
  - Internal Docker network ("internal" bridge)
  - Nginx validates and forwards clean requests
  - Next.js still validates all input (defense in depth)

Trust Boundary 3: Next.js <-> PostgreSQL (RDS)
  - EC2 connects to RDS via private subnet
  - rds_sg only allows inbound from web_sg
  - All queries parameterized via Prisma

Trust Boundary 4: Next.js <-> Square API
  - Outbound HTTPS only
  - Access token in SSM, lazy-loaded at runtime
  - Webhook signatures verified server-side

Trust Boundary 5: Next.js <-> S3 / CloudFront
  - S3 bucket is private (all public access blocked)
  - CloudFront OAC signs requests to S3
  - EC2 writes to S3 via IAM instance profile
```

---

## 2. Nginx Security Configuration

### 2.1 Main Nginx Configuration

Located at `docker/nginx/nginx.conf`:

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Body size limit (10MB for image uploads)
    client_max_body_size 10m;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_min_length 256;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml text/javascript image/svg+xml;

    include /etc/nginx/conf.d/*.conf;
}
```

### 2.2 Site Configuration

Located at `docker/nginx/conf.d/default.conf`:

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;

# HTTP -> HTTPS redirect (except ACME challenges)
server {
    listen 80;
    server_name jonesingforsauce.com www.jonesingforsauce.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name jonesingforsauce.com www.jonesingforsauce.com;

    # TLS (Let's Encrypt via certbot)
    ssl_certificate /etc/letsencrypt/live/jonesingforsauce.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jonesingforsauce.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Main application - rate limited at 10r/s
    location / {
        limit_req zone=general burst=20 nodelay;
        proxy_pass http://app:3000;
        # ... proxy headers
    }

    # API routes - stricter rate limiting at 5r/s
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://app:3000;
        # ... proxy headers
    }

    # Webhooks - NO rate limiting (Square needs reliable delivery)
    location /api/webhooks/ {
        proxy_pass http://app:3000;
        # ... proxy headers
    }

    # Static assets - long-lived immutable cache (1 year)
    location /_next/static/ {
        proxy_pass http://app:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
        # Security headers must be repeated (Nginx does not inherit)
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-Frame-Options "DENY" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    }
}
```

**Key design decisions:**

| Decision | Rationale |
|----------|-----------|
| Webhooks exempt from rate limiting | Square must deliver reliably; signature verification provides security instead |
| 10r/s general, 5r/s API | Balance between usability and abuse prevention for a small site |
| Security headers repeated in static block | Nginx does not inherit `add_header` from parent blocks when child blocks define their own |
| HSTS max-age 1 year | Standard recommendation; `includeSubDomains` covers all subdomains |

---

## 3. Next.js Security

### 3.1 Content Security Policy

CSP is configured in `apps/web/next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: "/((?!admin).*)",   // All public routes (admin excluded)
      headers: [
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
            "font-src 'self' fonts.gstatic.com",
            "img-src 'self' data: blob: https:",
            "connect-src 'self'",
            "frame-src 'none'",
          ].join("; "),
        },
      ],
    },
  ];
}
```

The admin panel is excluded because rich text editors and other admin tools
require more permissive CSP directives.

### 3.2 Middleware (Edge Runtime)

Located at `apps/web/src/middleware.ts`:

The middleware runs on the Edge runtime and protects all `/admin/*` routes:

1. Unauthenticated requests to `/admin/*` are redirected to `/admin/login`
2. Already-authenticated users hitting `/admin/login` are redirected to `/admin`
3. Session tokens are verified using the Web Crypto API (`SubtleCrypto`)

```typescript
export const config = {
  matcher: ["/admin/:path*"],
};
```

The Edge-compatible verification module (`src/lib/auth-edge.ts`) uses
`crypto.subtle.importKey` and `crypto.subtle.sign` instead of Node.js
`crypto.createHmac`, since Next.js middleware runs on the Edge runtime which
does not support Node.js-only APIs.

### 3.3 Image Remote Patterns

```typescript
images: {
  remotePatterns: [
    { protocol: "https", hostname: "jonesingforsauce.com", pathname: "/**" },
    { protocol: "https", hostname: "*.cloudfront.net", pathname: "/**" },
  ],
},
```

Only our domain and CloudFront CDN are allowed as image sources. This prevents
SSRF via the Next.js image optimization endpoint.

### 3.4 Build Configuration

```typescript
output: "standalone",
```

All pages use `force-dynamic` (either explicitly or by using dynamic features
like `cookies()`). This is because the RDS database is not available at Docker
build time -- the build stage uses a dummy `DATABASE_URL` for Prisma client
validation only.

### 3.5 Service Layer Architecture

All database operations go through the service layer at `src/lib/services/`.
This centralizes data access patterns and keeps security logic in one place:

| Service | Responsibility |
|---------|---------------|
| `product.service.ts` | Product CRUD, stock verification, checkout product validation |
| `order.service.ts` | Order persistence, lookup by Square order ID (idempotency) |
| `checkout.service.ts` | Zod validation, server-side price lookup, Square payment link creation |
| `image.service.ts` | File type/size validation, S3 upload/delete, primary image management |
| `contact.service.ts` | Contact form message persistence |
| `settings.service.ts` | Site settings read/update |
| `auth.service.ts` | Admin user lookup, password hashing/verification |

Pages and server actions never import `db` directly. The API facade at
`src/lib/api/` re-exports from services for backward compatibility.

---

## 4. Square Payment Security

### 4.1 Square Client Initialization

Located at `apps/web/src/lib/square.ts`:

```typescript
let _client: SquareClient | null = null;

export function getSquareClient(): SquareClient {
  if (!_client) {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("SQUARE_ACCESS_TOKEN is not set.");
    }
    _client = new SquareClient({
      token: accessToken,
      environment:
        process.env.SQUARE_ENVIRONMENT === "production"
          ? SquareEnvironment.Production
          : SquareEnvironment.Sandbox,
    });
  }
  return _client;
}
```

The client is **lazy-initialized** so that the build step does not fail when
`SQUARE_ACCESS_TOKEN` is unavailable (during static page generation in CI).
At runtime, the getter throws immediately if the token is missing.

### 4.2 Checkout Flow (Server-Side Price Enforcement)

Located at `apps/web/src/lib/services/checkout.service.ts`:

1. Client sends `{ squareVariationId, quantity }[]` -- no prices
2. Items are validated with Zod (`z.array(lineItemSchema).min(1).max(50)`)
3. Items are deduplicated by `squareVariationId`
4. `verifyCheckoutProducts()` checks each product against the database:
   - Is the product active?
   - Is there sufficient stock?
5. Line items are built server-side using **prices from the database**
6. A Square payment link is created with `client.checkout.paymentLinks.create()`
7. An idempotency key (`crypto.randomUUID()`) prevents duplicate charges
8. The client receives only the hosted checkout URL

**The client never sends prices.** The checkout service looks up every price
from PostgreSQL and builds ad-hoc line items with `basePriceMoney` set from the
database.

### 4.3 Webhook Signature Verification

Located at `apps/web/src/app/api/webhooks/square/route.ts`:

```typescript
export const runtime = "nodejs"; // Required for crypto module

function verifySquareSignature(
  rawBody: string,
  signature: string,
  signatureKey: string,
  webhookUrl: string,
): boolean {
  const payload = webhookUrl + rawBody;
  const expectedSignature = createHmac("sha256", signatureKey)
    .update(payload)
    .digest("base64");

  try {
    const sigBuffer = Buffer.from(signature, "base64");
    const expectedBuffer = Buffer.from(expectedSignature, "base64");
    if (sigBuffer.length !== expectedBuffer.length) return false;
    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}
```

**How Square webhook signing works:**

1. Square concatenates `webhookUrl + rawBody`
2. Square signs with HMAC-SHA256 using the signature key
3. The base64-encoded signature is sent in the `x-square-hmacsha256-signature` header
4. We recompute the HMAC and compare using `crypto.timingSafeEqual`

**Required environment variables** (from SSM):

| Variable | SSM Type | Purpose |
|----------|----------|---------|
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | SecureString | HMAC key for signature verification |
| `SQUARE_WEBHOOK_URL` | String | The registered webhook endpoint URL |

### 4.4 Webhook Event Handling

The webhook handler processes `payment.updated` events:

1. Only `COMPLETED` payments are processed (other statuses are skipped)
2. **Idempotency**: `getOrderBySquareOrderId(squareOrderId)` checks if the order
   already exists before creating a new one
3. The full order is fetched from Square API to get line items and shipping info
4. Stock is decremented for each line item (matched by product name)
5. An `Order` + `OrderItem` records are persisted to PostgreSQL
6. Errors during order persistence are logged but do not cause a 500 response --
   the payment was already captured, and orders can be reconciled from the
   Square Dashboard

### 4.5 PCI Compliance

Because we use **Square hosted payment links** (not embedded card forms), we
fall under the simplest PCI compliance level:

- Card data **never touches our servers** -- Square handles all card interactions
- Our servers never see card numbers, CVV, or expiry dates
- We store only the Square order ID and payment ID (not card data)
- HTTPS is enforced everywhere (Nginx TLS termination + HSTS)
- Square access tokens are stored in SSM Parameter Store, not in code or on disk

---

## 5. Authentication and Authorization

### 5.1 Admin Authentication

Located at `apps/web/src/lib/auth.ts`:

**Mechanism:** HMAC-SHA256 signed cookies (not JWTs, not session table lookup)

```
Token format: base64url(JSON payload) + "." + hex(HMAC-SHA256 signature)
```

**Session payload:**

```typescript
interface SessionPayload {
  userId: number;  // AdminUser.id from PostgreSQL
  exp: number;     // Expiration timestamp (ms since epoch)
}
```

**Cookie configuration:**

| Property | Value | Purpose |
|----------|-------|---------|
| `httpOnly` | `true` | Prevents JavaScript access (XSS mitigation) |
| `secure` | `true` (production) | Only sent over HTTPS |
| `sameSite` | `lax` | CSRF protection for same-site requests |
| `maxAge` | 7 days | Session duration |
| `path` | `/` | Available to all routes |

**Secret management:**

```typescript
function getSecret(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ADMIN_SECRET environment variable is required in production.");
    }
    _secret = "dev-secret-change-in-production";  // Dev-only fallback
  }
  // ...
}
```

In production, the application **fails fast** if `ADMIN_SECRET` is not set.
In development, a local-only fallback is used for convenience. The secret is
lazy-initialized (cached after first call) to avoid reading env vars repeatedly.

**Timing-safe comparison:**

```typescript
const sigBuffer = Buffer.from(signature, "hex");
const expectedBuffer = Buffer.from(expectedSig, "hex");
if (sigBuffer.length !== expectedBuffer.length) return null;
if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;
```

### 5.2 Edge-Compatible Verification

Located at `apps/web/src/lib/auth-edge.ts`:

Next.js middleware runs on the Edge runtime, which does not support Node.js
`crypto`. The edge module reimplements HMAC-SHA256 verification using the
Web Crypto API:

- `crypto.subtle.importKey("raw", ...)` imports the HMAC key
- `crypto.subtle.sign("HMAC", key, data)` computes the signature
- A custom `timingSafeCompare()` prevents timing attacks by XOR-comparing bytes

### 5.3 Admin Route Protection

| Layer | Protection |
|-------|-----------|
| Middleware | Redirects unauthenticated requests to `/admin/login` |
| API routes | `getSession()` check returns 401 if not authenticated |
| Server actions | `getSession()` check before any mutation |

All admin API routes (`/api/admin/*`) and server actions verify the session
cookie before processing the request.

### 5.4 Password Storage

Admin passwords are hashed using bcrypt (via `auth.service.ts`) and stored in
the `AdminUser.passwordHash` column. Plaintext passwords are never stored or logged.

---

## 6. Image Upload Security

### 6.1 Upload Flow

Located at `apps/web/src/app/api/admin/images/route.ts` and
`apps/web/src/lib/services/image.service.ts`:

```
Admin browser -> POST /api/admin/images (FormData)
  -> getSession() auth check
  -> validateImageFile() type + size check
  -> uploadToS3() -> S3 bucket (private)
  -> Create ProductImage record in PostgreSQL with CDN URL
  -> Return { id, url, alt, isPrimary, sortOrder }
```

### 6.2 File Validation

```typescript
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
```

| Check | Enforcement |
|-------|------------|
| File type | Whitelist: JPEG, PNG, WebP, AVIF only |
| File size | Maximum 5 MB |
| Authentication | `getSession()` required on all image endpoints |

### 6.3 S3 Storage

Located at `apps/web/src/lib/s3.ts`:

- **Bucket**: Private, all public access blocked
- **Key pattern**: `products/{productId}/{uuid}.{ext}`
- **Content-Type**: Set from the uploaded file's MIME type
- **Cache-Control**: `public, max-age=31536000, immutable`
- **Serving**: Via CloudFront CDN with Origin Access Control (OAC)

The S3 client uses IAM instance profile credentials (no access keys in code).
The bucket name and CloudFront domain come from environment variables that are
populated from SSM Parameter Store at deploy time.

### 6.4 CloudFront Configuration

From `terraform/cdn.tf`:

| Setting | Value | Purpose |
|---------|-------|---------|
| Origin Access Control | OAC (sigv4) | Only CloudFront can read from S3 |
| Viewer protocol policy | `redirect-to-https` | All image traffic is encrypted |
| Allowed methods | GET, HEAD only | Read-only image serving |
| Cache policy | CachingOptimized (AWS managed) | Long TTLs, high cache hit ratio |
| Price class | PriceClass_100 | US/Canada/Europe edges only |
| HTTP version | HTTP/2 + HTTP/3 | Performance |

---

## 7. Docker Security

### 7.1 Docker Compose

Located at `docker-compose.yml`:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    env_file:
      - .env                      # Populated from SSM by deploy.sh
    security_opt:
      - no-new-privileges:true    # Prevent privilege escalation
    cap_drop:
      - ALL                       # Drop all Linux capabilities
    expose:
      - "3000"                    # Internal only -- not exposed to host
    networks:
      - internal
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/"]

  nginx:
    image: nginx:1.27-alpine
    ports:
      - "80:80"                   # Public-facing
      - "443:443"                 # Public-facing
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/conf.d:/etc/nginx/conf.d:ro
      - certbot-webroot:/var/www/certbot:ro
      - certbot-certs:/etc/letsencrypt:ro
    networks:
      - internal

  certbot:
    image: certbot/certbot
    # Runs renewal check every 12 hours
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done'"
```

**Key hardening measures:**

| Measure | Container | Purpose |
|---------|-----------|---------|
| `cap_drop: ALL` | app | Removes all Linux capabilities |
| `no-new-privileges:true` | app | Prevents setuid escalation |
| Non-root user (UID 1001) | app | Dockerfile creates `nextjs` user |
| Internal network only | app | Port 3000 not bound to host |
| Read-only config volumes | nginx | `:ro` flag prevents modification |
| Single bridge network | all | All containers on `internal` network |

### 7.2 Dockerfile (Multi-Stage Build)

Located at `Dockerfile`:

```dockerfile
# Stage 1: deps - Install dependencies
FROM node:20-alpine AS deps
RUN corepack enable && corepack prepare pnpm@10.30.2 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY packages/*/package.json ./packages/*/
RUN pnpm install --frozen-lockfile

# Stage 2: builder - Generate Prisma client and build Next.js
FROM node:20-alpine AS builder
# Dummy DATABASE_URL for Prisma client validation during build.
# The real connection string comes from SSM at runtime.
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN pnpm --filter web exec prisma generate
RUN pnpm --filter web build

# Stage 3: runner - Minimal production image
FROM node:20-alpine AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/prisma ./apps/web/prisma
COPY docker/entrypoint.sh /app/entrypoint.sh
USER nextjs
EXPOSE 3000
ENTRYPOINT ["/app/entrypoint.sh"]
```

**Security properties of the multi-stage build:**

| Property | Implementation |
|----------|---------------|
| No source code in final image | Only standalone output, static assets, and public dir |
| No devDependencies in final image | Standalone bundles only production deps |
| Non-root execution | `USER nextjs` (UID 1001) |
| Dummy DATABASE_URL | Real URL never in image layers; provided at runtime from SSM |
| Frozen lockfile | `pnpm install --frozen-lockfile` ensures reproducible installs |
| Exec form entrypoint | `ENTRYPOINT ["/app/entrypoint.sh"]` prevents shell injection |

### 7.3 Container Entrypoint

Located at `docker/entrypoint.sh`:

```bash
#!/bin/sh
set -e

# Apply pending Prisma migrations (non-fatal -- allows manual intervention)
cd /app/apps/web
npx prisma migrate deploy 2>/dev/null || echo "Warning: migrate deploy did not complete"

# Start Next.js with exec (signals forwarded for graceful shutdown)
cd /app
exec node apps/web/server.js
```

Uses `exec` to replace the shell process with Node.js, ensuring SIGTERM from
Docker is forwarded directly to the Node.js process for graceful shutdown.

---

## 8. Infrastructure Security

### 8.1 AWS Architecture (Terraform)

All infrastructure is defined in `terraform/` and follows least-privilege principles.

#### VPC Layout

From `terraform/vpc.tf`:

```
VPC: 10.0.0.0/16
  Public subnet:   10.0.1.0/24   (AZ[0]) -- EC2 instance
  Private subnet A: 10.0.10.0/24 (AZ[0]) -- RDS
  Private subnet B: 10.0.11.0/24 (AZ[1]) -- RDS (multi-AZ requirement)
```

No NAT gateway -- private subnets are fully isolated. RDS does not need
outbound internet access.

#### Security Groups

From `terraform/security.tf`:

| Security Group | Inbound Rules | Purpose |
|---------------|---------------|---------|
| `web_sg` | 80 (0.0.0.0/0), 443 (0.0.0.0/0) | HTTP/HTTPS from anywhere |
| `ssh_sg` | 22 (restricted CIDR) | SSH from admin IP only |
| `rds_sg` | 5432 (from `web_sg` only) | PostgreSQL from app server only |
| `vpc_endpoints_sg` | 443 (from `web_sg`) | SSM VPC endpoints |

**Blocked explicitly:**
- No direct database access from the internet (port 5432 not in `web_sg`)
- No Next.js port exposed (3000 is internal Docker network only)
- No Docker API port (2375/2376) exposed

#### RDS Configuration

From `terraform/rds.tf`:

| Setting | Value | Purpose |
|---------|-------|---------|
| Engine | PostgreSQL 16 | Current LTS version |
| Instance class | `db.t4g.micro` | Graviton-based, free tier eligible |
| Storage | 20 GB gp3, encrypted | AES-256 at rest, 3000 IOPS baseline |
| Publicly accessible | `false` | Private subnets only |
| Backup retention | 7 days | Point-in-time recovery |
| Deletion protection | `true` | Prevent accidental destruction |
| Auto minor upgrades | `true` | Security patches applied automatically |
| Final snapshot | Required | Cannot delete without final snapshot |

#### DynamoDB Sessions Table

From `terraform/dynamodb.tf`:

```
Table: the-sauce-sessions
  Partition key: sessionId (S)    -- direct GetItem lookups (O(1))
  GSI: UserIdIndex (userId)       -- query sessions by user (no scan)
  TTL: expiresAt                  -- automatic expired session cleanup
  Billing: PAY_PER_REQUEST        -- zero cost when idle
  Point-in-time recovery: enabled -- 35-day recovery window
```

**Query-not-scan design enforced at IAM level:** the DynamoDB policy explicitly
grants `GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, and `Query` but
**does NOT grant `Scan`**. This prevents any code from accidentally scanning
the entire table.

#### S3 Buckets

| Bucket | Purpose | Encryption | Public Access |
|--------|---------|------------|---------------|
| `{project}-images-{account}` | Product images | SSE-S3 (AES-256) | All blocked (CloudFront OAC) |
| `{project}-backups-{account}` | Database backups | SSE-S3 (AES-256) | All blocked |

Backup bucket has versioning enabled and lifecycle rules:
- Transition to Glacier after 30 days
- Expire after 365 days

### 8.2 IAM Least-Privilege Policies

From `terraform/iam.tf`:

The EC2 instance role has **six separate inline policies**, each granting the
minimum permissions for a specific capability:

| Policy | Actions | Resource Scope |
|--------|---------|---------------|
| ECR Read | `GetAuthorizationToken`, `BatchGetImage`, `GetDownloadUrlForLayer` | Specific ECR repository |
| S3 Backup | `ListBucket`, `PutObject`, `GetObject` | Backup bucket only |
| CloudWatch Logs | `CreateLogGroup`, `CreateLogStream`, `PutLogEvents` | `/the-sauce/*` log groups |
| S3 Images | `ListBucket`, `PutObject`, `GetObject`, `DeleteObject` | Images bucket only |
| SSM Parameters | `GetParameter`, `GetParameters`, `GetParametersByPath` | `/{project}/*` parameters |
| DynamoDB Sessions | `GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `Query` | Sessions table + indexes |

Additionally, the `AmazonSSMManagedInstanceCore` managed policy is attached for
SSM Session Manager access (SSH alternative).

### 8.3 VPC Endpoints

From `terraform/ssm.tf`:

Three VPC Interface Endpoints are provisioned to allow the EC2 instance to
communicate with SSM without traversing the public internet:

| Endpoint | Service | Purpose |
|----------|---------|---------|
| `ssm` | `com.amazonaws.{region}.ssm` | SSM API (parameter store, run command) |
| `ssmmessages` | `com.amazonaws.{region}.ssmmessages` | Session Manager shell connections |
| `ec2messages` | `com.amazonaws.{region}.ec2messages` | SSM Agent communication |

All endpoints use private DNS and are secured by the `vpc_endpoints_sg`
security group (HTTPS from `web_sg` only).

---

## 9. Secrets Management

### 9.1 SSM Parameter Store

All application secrets are stored in AWS SSM Parameter Store under the
`/the-sauce/` prefix. The `deploy.sh` script pulls all parameters at deploy
time and writes them to `.env`:

```bash
aws ssm get-parameters-by-path \
  --path "/${PROJECT_NAME}/" \
  --with-decryption \
  --region "$AWS_REGION" \
  --query "Parameters[*].[Name,Value]" \
  --output text | while IFS=$'\t' read -r name value; do
    key="${name##*/}"
    echo "${key}=${value}"
  done > "${DEPLOY_DIR}/.env"

chmod 600 "${DEPLOY_DIR}/.env"
```

The `.env` file is created with `600` permissions (owner read/write only).

### 9.2 Parameter Inventory

From `terraform/ssm.tf`:

| Parameter | SSM Type | Source |
|-----------|----------|--------|
| `DATABASE_URL` | SecureString | Auto-generated from RDS endpoint |
| `ADMIN_SECRET` | SecureString | Manually set after creation |
| `SQUARE_ACCESS_TOKEN` | SecureString | Manually set after creation |
| `SQUARE_WEBHOOK_SIGNATURE_KEY` | SecureString | Manually set after creation |
| `REVALIDATION_SECRET` | SecureString | Manually set after creation |
| `SQUARE_LOCATION_ID` | String | Manually set after creation |
| `SQUARE_ENVIRONMENT` | String | `sandbox` or `production` |
| `SQUARE_WEBHOOK_URL` | String | Auto-generated from domain variable |
| `S3_IMAGES_BUCKET` | String | Auto-generated from S3 bucket resource |
| `CLOUDFRONT_DOMAIN` | String | Auto-generated from CloudFront resource |
| `AWS_REGION` | String | From Terraform variable |
| `NEXT_PUBLIC_SITE_URL` | String | Auto-generated from domain variable |

SecureString parameters are encrypted at rest using the default AWS KMS key.
The EC2 instance role has `ssm:GetParameter*` scoped to `/the-sauce/*` only.

### 9.3 Build-Time vs. Runtime Secrets

| Secret | Available at Build Time? | Available at Runtime? |
|--------|------------------------|----------------------|
| `DATABASE_URL` | No (dummy value used) | Yes (from SSM -> .env) |
| `SQUARE_ACCESS_TOKEN` | No | Yes (lazy-initialized) |
| `ADMIN_SECRET` | No | Yes (lazy-initialized) |
| `NEXT_PUBLIC_SITE_URL` | No | Yes (from SSM -> .env) |

The Dockerfile sets a dummy `DATABASE_URL` for Prisma client generation.
All pages use `force-dynamic` so no database queries run at build time.
Square and auth clients are lazy-initialized -- they throw if the required
env var is missing, but they do not fail at import time.

---

## 10. Security Checklist

### Phase 1: Pre-Launch (Blocking)

```
INFRASTRUCTURE
[x]  Generate TLS certificate (Let's Encrypt via certbot)
[x]  Configure Nginx with SSL (TLS 1.2+, HSTS, session tickets off)
[x]  Apply Nginx security headers (X-Content-Type-Options, X-Frame-Options, etc.)
[x]  Configure security groups (web_sg, ssh_sg, rds_sg)
[x]  Deploy RDS in private subnets (publicly_accessible = false)
[x]  Set up SSM Parameter Store for all secrets
[x]  Configure Docker cap_drop ALL + no-new-privileges
[x]  Run as non-root user in Docker (UID 1001)
[x]  Configure internal Docker network (app not exposed to host)

APPLICATION SECURITY
[x]  Implement HMAC-SHA256 admin auth with timing-safe comparison
[x]  Set up CSP in next.config.ts
[x]  Admin routes protected by middleware (edge-compatible)
[x]  Zod validation on checkout items
[x]  Server-side price lookup (never trust client prices)
[x]  Square webhook signature verification (HMAC-SHA256)
[x]  Webhook idempotency (check existing order before creating)
[x]  Image upload validation (type whitelist, 5MB max)
[x]  ADMIN_SECRET fails fast in production if not set
[x]  Lazy client initialization (Square, auth) for build safety

DATABASE
[x]  RDS storage encryption enabled (AES-256)
[x]  RDS in private subnets (rds_sg from web_sg only)
[x]  Automated backups (7-day retention)
[x]  Deletion protection enabled
[x]  Prisma ORM (parameterized queries only)
```

### Phase 2: First Month Post-Launch

```
HARDENING
[_]  Set up automated security updates (unattended-upgrades)
[_]  Configure S3 backup bucket lifecycle (Glacier after 30 days)
[_]  Run initial Docker image security scan with Trivy
[_]  Run pnpm audit on all projects and fix HIGH+ vulnerabilities
[_]  Set up CloudWatch log aggregation
[_]  Configure security alerts (webhook failures, 5xx spikes)
[_]  Test backup restoration procedure
[_]  Verify no sensitive data in client-side JavaScript bundles

TESTING
[_]  Run OWASP ZAP automated scan against staging
[_]  Verify CSP blocks inline script execution
[_]  Test webhook replay protection (idempotency check)
[_]  Verify HTTP to HTTPS redirect works correctly
[_]  SSL Labs scan (target A+ rating)
[_]  Test rate limiting effectiveness under load
```

### Phase 3: Ongoing

```
MAINTENANCE
[_]  Weekly: Review application logs for security anomalies
[_]  Monthly: Run pnpm audit and update dependencies
[_]  Monthly: Scan Docker images for new vulnerabilities
[_]  Quarterly: Review and rotate secrets in SSM Parameter Store
[_]  Quarterly: Review IAM policies for least-privilege compliance
[_]  Quarterly: Review EC2 security group rules
[_]  Quarterly: Test backup restoration
[_]  Annually: Rotate Square API keys
[_]  Annually: Rotate ADMIN_SECRET and re-sign all sessions
[_]  Annually: Full penetration test
[_]  Annually: Review and update this security architecture document
```

---

## Appendix A: Architecture Diagram

```
                         Internet
                            |
                     [AWS Security Groups]
                     Inbound: 80, 443 only
                            |
                    +-------+-------+
                    |    Nginx      |
                    |  (TLS term)   |
                    |  Rate limit   |
                    |  Sec headers  |
                    +-------+-------+
                            |
                   [internal Docker network]
                            |
                    +-------+-------+
                    |    Next.js    |
                    |  (Port 3000)  |
                    |  App Router   |
                    |  API routes   |
                    |  Service layer|
                    +--+---+---+---+
                       |   |   |
           +-----------+   |   +----------+
           |               |              |
    [RDS PostgreSQL]  [Square API]   [S3 + CloudFront]
     Private subnet    Hosted         Product images
     Prisma ORM        payment        OAC-signed
     Encrypted         links          HTTPS only
           |
    [SSM Param Store]   [DynamoDB]
     All secrets         Sessions
     VPC endpoints       TTL expiry
     SecureString        No-scan IAM

External APIs (outbound only):
  Next.js -> Square API (HTTPS, SDK v44)
  Next.js -> S3 (PutObject/DeleteObject via IAM)
  deploy.sh -> SSM (GetParametersByPath)
  deploy.sh -> ECR (docker pull)
```

## Appendix B: Incident Response Quick Reference

```
SECURITY INCIDENT RESPONSE STEPS:

1. DETECT
   - CloudWatch alerts fire (5xx spikes, webhook failures)
   - Manual report from customer or team member

2. CONTAIN
   - If active attack: Update security group to block attacker IP
   - If credential compromise: Rotate affected SSM parameters immediately
   - If data breach: Stop the Docker container

3. ASSESS
   - Determine scope: What data was accessed?
   - Check logs: Nginx access logs, application logs
   - Identify attack vector

4. REMEDIATE
   - Patch the vulnerability
   - Rotate all potentially compromised credentials in SSM
   - Redeploy via deploy.sh (pulls fresh secrets from SSM)

5. COMMUNICATE
   - If customer data affected: Notify within 72 hours
   - Notify Square if payment data potentially involved
   - Document incident for post-mortem

6. LEARN
   - Conduct post-mortem within 1 week
   - Update this security document
   - Implement additional controls

EMERGENCY CONTACTS:
- Square Support: squareup.com/help
- AWS Security: aws-security@amazon.com
- Let's Encrypt revocation: certbot revoke
```

## Appendix C: Secret Generation Commands

```bash
# Admin secret (64 bytes, base64 encoded)
openssl rand -base64 64

# Revalidation secret (32 bytes, base64 encoded)
openssl rand -base64 32

# Database password (alphanumeric, 32 chars)
openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32
```

---

**Document maintained by:** Development Team
**Last updated:** 2026-02-27
**Next review date:** 2026-05-27 (quarterly)
**Distribution:** Development team, DevOps
