# ☕ Brewventures

A personal coffee brewing journal, backed by a Google Sheet. Log beans,
log brews, log tastings — then see which parameters consistently produce
the cups you love. Open the sheet whenever you want to view or edit your
data directly.

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
- Google Sheets as the database (via Apps Script webhook)
- Zod for validation
- Recharts for trend charts
- Tesseract.js for OCR
- react-easy-crop for the 1:1 crop step
- next-themes for dark mode
- sonner for toasts

## Set up the Google Sheet (5 min, one time)

1. Create a new Google Sheet. Rename it "Brewventures" or similar.
2. Create 3 tabs (worksheets) at the bottom, named exactly:
   - `Beans`
   - `Brews`
   - `Tastings`
3. **Extensions → Apps Script**. Delete the placeholder code and paste
   the entire contents of [`docs/apps-script.js`](./docs/apps-script.js).
4. At the top of that pasted script, change `SECRET_TOKEN` to a random
   string. Copy this string — you'll need it in step 8.
5. Click the **Save** icon (💾). Then **Deploy → New deployment →
   Type: Web app**.
6. Set:
   - **Execute as:** Me (your Google account)
   - **Who has access:** Anyone
7. Click **Deploy**. Approve the permissions Google asks for.
8. Copy the **Web app URL** it gives you (looks like
   `https://script.google.com/macros/s/.../exec`).
9. In this project, create a file `.env.local` with:

   ```
   SHEETS_WEBAPP_URL="paste the URL from step 8"
   SHEETS_SECRET="paste the string from step 4"
   ```

10. Run `npm run dev` — the app should load with your empty Sheet.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel

1. Import the GitHub repo into Vercel (Add New → Project).
2. In the project's **Settings → Environment Variables**, add:
   - `SHEETS_WEBAPP_URL` — the same URL from the setup steps
   - `SHEETS_SECRET` — the same secret string
3. Deploy. The next push to `main` auto-deploys.
