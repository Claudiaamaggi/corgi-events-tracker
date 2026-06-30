# Corgi Cafe Events Tracker

A live dashboard that scrapes all Corgi Cafe events from [Luma](https://lu.ma/usecorgi), stores them as JSON in the repo, and displays them on a Vercel-hosted site. Auto-refreshes daily at 9am London time via GitHub Actions.

## Setup

```bash
git clone <repo-url>
cd corgi-events-tracker
npm install
```

## Run the scraper locally

```bash
npx tsx scripts/scrape.ts
```

This fetches all events from the Corgi Luma calendar, merges them with `data/events.json`, and writes the updated file.

## Run the frontend locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push the repo to GitHub
2. Connect the GitHub repo in [Vercel](https://vercel.com/new)
3. Vercel auto-detects Next.js — deploy with defaults

Every push to `main` triggers a redeploy.

## Trigger the first scrape

**Option A — GitHub Actions:**
Go to Actions → "Daily Luma Scrape" → "Run workflow"

**Option B — Local:**
```bash
npx tsx scripts/scrape.ts
git add data/events.json
git commit -m "chore: initial scrape"
git push
```

## Edit event data manually

Edit `data/events.json` directly in GitHub or locally. Manual edits (e.g. fixing a format tag) are preserved — the scraper uses incremental sync and only updates the `attendees` field for existing events.

## Architecture

- **Frontend:** Next.js (App Router) + Tailwind CSS on Vercel
- **Scraper:** `scripts/scrape.ts` — fetches Luma API, updates `data/events.json`
- **Scheduler:** GitHub Actions cron (daily at 9am London time)
- **Data store:** `data/events.json` committed to the repo — single source of truth
