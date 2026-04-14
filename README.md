# Officer Equipment Checkout App

A Vercel-ready Next.js app for managing officer shift start/end and equipment checkout/check-in using badge IDs and QR codes.

## New in v1.2

- Patched Next.js 15.5.9
- Admin login screen using `ADMIN_PASSWORD`
- Protected admin dashboard at `/admin`
- Live operations dashboard for open shifts and currently checked-out equipment
- Bulk officer import from CSV/XLSX
- Bulk equipment import from CSV/XLSX
- Improved UI with a separate scanner view and admin view

## Core features

- Badge scan / start shift
- Officer profile display after scan
- Unknown officer registration
- No-equipment button
- QR equipment checkout / check-in
- End-of-shift logging
- Audit search by shift ID, day, or month
- Equipment registration
- Camera-based QR scanner for browsers
- Admin dashboard and bulk imports

## Stack

- Next.js App Router
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod validation
- Vercel-compatible deployment

## Environment variables

Create `.env` from `.env.example` and set:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/equipment_app?sslmode=require"
ADMIN_PASSWORD="change-me"
```

## Local setup

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

Open `http://localhost:3000`

## Admin login

Visit `/login` and use the password from `ADMIN_PASSWORD`.

## Bulk import templates

### Officer import columns
Accepted headers in CSV/XLSX:
- `badgeId` or `badge`
- `nuid`
- `fullName` or `name`
- optional: `photoData`, `photoUrl`, `photo`

### Equipment import columns
Accepted headers in CSV/XLSX:
- `qrCode` or `qr`
- `label`
- optional: `category`
- optional: `description`
- optional: `isActive`

Sample files are included in the project root:
- `sample-officer-import.csv`
- `sample-equipment-import.csv`

## Deploying to Vercel

1. Push the project to GitHub.
2. Import the repo into Vercel.
3. Add environment variables in Vercel:
   - `DATABASE_URL`
   - `ADMIN_PASSWORD`
4. Deploy.
5. From your local machine, point `.env` to the same database and run:

```bash
npm install
npm run db:push
npm run db:seed
```

## Supabase note

If you deploy on Vercel and use Supabase, use the **Supavisor Session pooler** connection string for `DATABASE_URL`, not the direct `db.<project>.supabase.co` host.

## Seeded test data

Officer:
- Badge ID: `10001`
- NUID: `900001`

Equipment:
- `RADIO-001`
- `KEYS-101`

## API routes

Public operational routes:
- `POST /api/officers/register`
- `GET /api/officers/[badgeId]`
- `POST /api/shifts/start`
- `POST /api/shifts/no-equipment`
- `POST /api/shifts/end`
- `POST /api/equipment/register`
- `POST /api/equipment/scan`
- `GET /api/audit?shiftId=...`
- `GET /api/audit?day=YYYY-MM-DD`
- `GET /api/audit?month=YYYY-MM`

Admin-only routes:
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/admin/dashboard`
- `POST /api/admin/import/officers`
- `POST /api/admin/import/equipment`
