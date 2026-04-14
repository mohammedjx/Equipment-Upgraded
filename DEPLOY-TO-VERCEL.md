# Fast Vercel deploy checklist

1. Upload the project to GitHub.
2. Create a Postgres database.
3. Set these environment variables in Vercel:
   - `DATABASE_URL`
   - `ADMIN_PASSWORD`
4. Deploy the app.
5. On your local machine, point `.env` to the same database.
6. Run:
   - `npm install`
   - `npm run db:push`
   - `npm run db:seed`
7. Open `/login` and sign in with `ADMIN_PASSWORD`.

## If you use Supabase on Vercel
Use the **Session pooler** connection string, not the direct `db.project-ref.supabase.co` host.

## If the deploy log mentions Prisma or database
Double-check:
- `DATABASE_URL` is correct
- the database is reachable from Vercel
- the schema was pushed with `npm run db:push`
- the right environment was redeployed after editing env vars
