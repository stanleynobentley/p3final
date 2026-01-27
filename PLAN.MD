# Plan (milestones)

## 1) Project scaffold + contracts
- Define `sources` list and immutable TypeScript types (`Source`, `Item`, `SyncResult`).
- Decide cache contract + shape of aggregated response (includes `lastSync` and per-source errors).
- Write unit tests first for parsing helpers and cache TTL logic (use subagents).

## 2) Scraping pipeline (server-only)
- Implement `fetchHtml`, `extractTitleDateContent`, `summarize` with robust fallbacks and timeouts.
- Add per-source error capture and URL deduplication.
- Write unit/integration tests for extraction and summarization (use subagents).

## 3) Cache + API routes
- Implement 2-layer caching: in-memory Map + Next.js route cache / tag revalidation.
- Add `GET /api/items` and `POST /api/sync` with force-refresh and optional secret header.
- Write tests for API handlers and caching behavior (use subagents).

## 4) UI (App Router)
- Build list UI with sort, search, filters (last N days, source), Sync button, and error display.
- Wire to API endpoints; show loading and last-sync status.
- Add UI tests where feasible (use subagents).
