# The Sauce Roadmap

> Source: [Confluence](https://fixactioninc.atlassian.net/wiki/spaces/FB/pages/3407899)
> Last synced: 2026-03-17

Product: The Sauce | Type: Client Project | Owner: Tyrone Jones


### Current State Summary

The Sauce is an e-commerce BBQ sauce store built for Tyrone Jones. The platform runs on Next.js 15, Prisma/PostgreSQL, Square payments, Docker/Nginx on AWS EC2. Deployed via GitHub Actions CI/CD pipeline using SSM Run Command.

What's built and live:

- Product catalog with categories and filtering
- Shopping cart with persistent state (Zustand + localStorage)
- Checkout flow with Square payment processing (sandbox configured, production ready)
- Admin panel for product/order/gallery/testimonial/settings management
- Photo gallery on homepage (Instagram-style grid)
- Customer testimonials carousel
- Multi-image product galleries with thumbnail navigation
- Contact form with honeypot spam protection and admin message inbox
- S3 image upload system for products and gallery
- DynamoDB session management
- SEO: sitemap, robots.txt, meta tags, OpenGraph, Twitter cards
- CI/CD pipeline: GitHub Actions → ECR → SSM deploy to EC2
- Dockerized deployment with Nginx reverse proxy


### Completed (Q1 2026)

| Feature | Priority | Status | Target Quarter | Notes |
| --- | --- | --- | --- | --- |
| Product catalog with categories | P0 | [Complete] | Q1 2026 | Full product listing with category-based filtering |
| Shopping cart and checkout | P0 | [Complete] | Q1 2026 | Zustand cart with Square payment link integration |
| Admin panel | P1 | [Complete] | Q1 2026 | Products, orders, gallery, testimonials, settings, social links, messages |
| Photo gallery | P2 | [Complete] | Q1 2026 | Homepage photo grid with admin upload; no dedicated public gallery page |
| Testimonials section | P2 | [Complete] | Q1 2026 | Auto-scrolling carousel with admin management |
| Docker/Nginx deployment | P1 | [Complete] | Q1 2026 | Containerized production deployment on EC2 |
| Contact form | P2 | [Complete] | Q1 2026 | Form with honeypot spam protection, admin inbox at /admin/messages |
| Service layer architecture | P1 | [Complete] | Q1 2026 | All DB calls through src/lib/services/, API facade for backward compat |
| S3 image upload | P1 | [Complete] | Q1 2026 | Product and gallery images stored in S3, served via CloudFront CDN |
| DynamoDB sessions | P1 | [Complete] | Q1 2026 | Session management via DynamoDB with TTL and query-only access |
| CI/CD pipeline | P1 | [Complete] | Q1 2026 | GitHub Actions: lint, type-check, build, Docker push to ECR, SSM deploy |
| SEO foundations | P1 | [Complete] | Q1 2026 | Sitemap, robots.txt, meta tags, OpenGraph, Twitter cards |
| Multi-image product galleries | P1 | [Complete] | Q1 2026 | Thumbnail navigation with Framer Motion transitions |
| Square sandbox integration | P1 | [Complete] | Q1 2026 | Environment-prefixed SSM params, tested payment link creation |


### Current Quarter Remaining (Q1 2026)

| Feature | Priority | Status | Target Quarter | Notes |
| --- | --- | --- | --- | --- |
| DNS + SSL setup | P0 | [In Progress] | Q1 2026 | Domain from Squarespace, Certbot SSL, production go-live |
| JSON-LD structured data | P2 | [Planned] | Q1 2026 | Product schema, Organization schema for rich search results |
| Square production credentials | P0 | [Planned] | Q1 2026 | Switch from sandbox to production after checkout flow testing |
| Dedicated gallery page | P3 | [Planned] | Q1 2026 | Public /gallery page (currently homepage-only) |


### Near Term (Q2 2026)

| Feature | Priority | Status | Target Quarter | Notes |
| --- | --- | --- | --- | --- |
| Product reviews and ratings | P1 | [Planned] | Q2 2026 | Customer-submitted reviews with moderation and star ratings |
| Email marketing integration (Mailchimp) | P2 | [Planned] | Q2 2026 | Newsletter signup, abandoned cart emails, promotional campaigns |
| Inventory alerts | P1 | [Planned] | Q2 2026 | Low-stock notifications and automatic out-of-stock handling |
| Analytics dashboard | P2 | [Planned] | Q2 2026 | Sales trends, top products, revenue tracking, conversion funnel |


### Future (Q3–Q4 2026)

| Feature | Priority | Status | Target Quarter | Notes |
| --- | --- | --- | --- | --- |
| Discount codes and promotions | P2 | [Planned] | Q3 2026 | Coupon codes, percentage/fixed discounts, BOGO offers |
| Subscription/recurring orders | P3 | [Planned] | Q3 2026 | Monthly BBQ sauce subscription boxes |
| Wholesale portal | P3 | [Planned] | Q4 2026 | Bulk ordering with tiered pricing for retailers |
| Recipe blog integration | P3 | [Planned] | Q4 2026 | Content section with recipes featuring products |
| Shipping calculator and tracking | P2 | [Planned] | Q3 2026 | Real-time shipping rates and order tracking page |

This roadmap is a living document — update regularly during planning sessions.
