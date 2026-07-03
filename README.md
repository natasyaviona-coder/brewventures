# ☕ Brewventures

A personal coffee brewing journal. Log beans, log brews, log tastings — then
see which parameters consistently produce the cups you love.

Everything lives on one page. No navigation, no reloads: cards expand into
drawers, forms open in modals, dashboards recompute the moment you save.

## Features

- **Bean Library** — cards with remaining grams bar, avg rating, brew count
- **Bean detail drawer** — full bean info, brewing history table, avg flavor
  profile, best-rated brew, enjoyment trend chart (Recharts)
- **Brew log** — dose, water, ratio (auto), method, grinder + grind size,
  pours, temp, brew time. Auto-subtracts from bean's remaining grams
- **Tasting** — star ratings for bitterness / acidity / sweetness /
  enjoyment, plus 5-point scales for body (tea → syrupy), aroma, aftertaste
- **OCR** — upload a bean-label photo, choose a 1:1 crop, Tesseract.js
  scans it and pre-fills origin, process, altitude, variety, producer,
  roast date, tasting notes
- **Dark mode** with a warm coffee palette
- **Search** by bean name, roaster, origin
- **Duplicate brew**, edit any bean/brew, delete with confirm
- **Autosave drafts** to localStorage until you submit
- **Mobile responsive**

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Prisma 6 + SQLite (local dev)
- Zod + React Hook Form for form validation
- Recharts for trend charts
- Tesseract.js for OCR
- react-easy-crop for the 1:1 crop step
- next-themes for dark mode
- sonner for toasts

## Run locally

```bash
npm install
npx prisma db push
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

The scaffold works on Vercel out of the box **except for the database**.
Vercel is serverless — the SQLite file at `prisma/dev.db` won't persist
between requests. Before deploying:

1. Sign up for **Turso** (SQLite-compatible, free tier) or **Vercel Postgres**
2. Swap the `datasource` provider in `prisma/schema.prisma`
3. Set `DATABASE_URL` in Vercel's environment variables
4. Run `npx prisma db push` against the new URL

`vercel --prod` after that and you're live.
