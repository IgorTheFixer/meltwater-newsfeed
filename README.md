# Meltwater News — Next.js prototype

A simple one-page Next.js newsroom that uses a Meltwater RSS output as its content source.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

The provided `.env.local` is already configured with the Meltwater RSS URL supplied for this prototype.

## If the remote feed is unavailable

Change:

```env
USE_MOCK_DATA=true
```

in `.env.local` and restart the dev server. This lets you test the full design with sample articles.

## Production setup

For a real repository, do **not** commit `.env.local`. Keep the feed URL/key in your hosting provider's environment variables. `.env.local.example` is safe to commit after replacing the key with a placeholder.

## Main files

- `src/lib/meltwater.ts` — fetches and parses RSS server-side
- `src/components/NewsPage.tsx` — page composition
- `src/components/StoryCard.tsx` — article display
- `src/app/globals.css` — complete visual design
- `src/lib/mock-stories.ts` — optional local preview data

## Feed behavior

The Meltwater request is performed from the Next.js server and revalidated every 15 minutes. The browser never needs to fetch Meltwater directly.
