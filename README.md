# Taste

Taste is a personalized movie recommendation service delivered as a private Stremio catalog. The app uses Next.js, Better Auth, Neon Postgres, Drizzle, TanStack Query, and the Stremio Add-on SDK.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Copy `.env.example` to `.env.local`, connect a Neon database, and push the current schema directly:

```bash
cp .env.example .env.local
pnpm db:push
```

This project intentionally uses a push-only Drizzle workflow and does not generate or run migration files. The `db:push` script reads `DATABASE_URL` from `.env.local`.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Scheduled recommendations

Vercel calls `GET /api/cron/recommendations` every Sunday and Wednesday at 13:00 UTC, which is 5:00 AM Pacific Standard Time. Vercel cron expressions use UTC and do not automatically shift for daylight saving time, so this runs at 6:00 AM Pacific Daylight Time.

Set `CRON_SECRET` in the Vercel project environment. Vercel includes it as a bearer token when calling the route. You can trigger the same endpoint locally with:

```bash
curl --header "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/recommendations
```

The job creates a scheduled recommendation batch for every profile that has liked at least one movie. Profiles with an active generation are skipped, and failures for one profile do not prevent the remaining profiles from being processed.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
