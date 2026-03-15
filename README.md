# Stratum — Precision 3D Prints

A full-featured e-commerce platform for selling 3D printed products, built with Next.js 15, Drizzle ORM, Better-Auth, Stripe, and Resend.

## Stack

- **Framework**: Next.js 15 (App Router)
- **Runtime**: Bun
- **Styling**: Tailwind CSS with custom Stratum design system
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: Better-Auth
- **Payments**: Stripe (Checkout Sessions)
- **Email**: Resend (order confirmations)
- **Deployment**: Docker Compose

## Features

- 🛍️ Product listings with search, sort, and filtering
- 🖼️ Image carousel with lightbox (Embla Carousel)
- 🛒 Persistent cart (localStorage)
- 📦 Bundle deals with percentage discounts
- 🎨 Custom product options (color, material, etc.) with price modifiers
- 💳 Stripe checkout with Royal Mail delivery options
- 🧾 VAT (20%) calculated at checkout
- 📧 Order confirmation emails via Resend
- 🔐 Better-Auth (email/password)
- 🎯 Admin dashboard with sales/revenue charts
- 📊 Orders, products, bundles management
- 📱 QR code-based inventory management with batch tracking
- 💡 Customer print recommendations with image upload
- 🐳 Docker Compose for one-command deployment

## Quick Start (Development)

### 1. Install dependencies
```bash
bun install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start the database
```bash
docker compose up postgres -d
```

### 4. Push the database schema
```bash
bun run db:push
```

### 5. Create the first admin user
```bash
bunx tsx scripts/setup-admin.ts
```

### 6. Start the development server
```bash
bun dev
```

Visit `http://localhost:3000` — admin at `/admin`.

---

## Docker Deployment

### 1. Copy and configure environment
```bash
cp .env.example .env
# Fill in all required values
```

### 2. Build and run
```bash
docker compose up -d --build
```

### 3. Push schema & create admin
```bash
# Run inside the container
docker compose exec app bunx drizzle-kit push
docker compose exec app bunx tsx scripts/setup-admin.ts
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Random secret (32+ chars) |
| `BETTER_AUTH_URL` | App base URL |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Same as above (client-side) |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | From email address |
| `NEXT_PUBLIC_APP_URL` | Public app URL |
| `ADMIN_EMAIL` | Default admin email |

## Stripe Webhook Setup

Configure your Stripe webhook to point to `https://yourdomain.com/api/stripe/webhook` with these events:
- `checkout.session.completed`
- `checkout.session.expired`
- `charge.refunded`

## Database Management

```bash
bun run db:push           # Push schema changes (direct, no safety checks)
bun run db:safe-push      # Safe push — previews changes, blocks destructive ones
bun run db:studio         # Open Drizzle Studio
bun run db:generate       # Generate migration files
bun run db:migrate        # Run migrations
```

### Safe Push

`db:safe-push` analyses your schema changes before applying them. It generates a migration dry-run, flags any destructive statements (DROP TABLE, DROP COLUMN), and only applies safe changes by default.

```bash
bun run db:safe-push                     # Apply safe changes, skip destructive
bun run db:safe-push --dry-run           # Preview changes without applying
bun run db:safe-push --allow-destructive # Apply everything including drops
```

Use `db:safe-push` instead of `db:push` when working with a production database to avoid accidental data loss.
