# Contributing

## Setup

1. Node 22 (`nvm use` — `.nvmrc` is 22)
2. `pnpm install`
3. `cp .env.example .env`
4. `pnpm start`

## Scripts

`pnpm verify` is the definition of done.

## Build order

Replica the consumer web app, one slice at a time. Do not import from `client/`. Skip `/company`.

1. **Auth (this slice)** — live `POST /api/auth/signin`, guest browse, forgot password. Next: signup + email OTP.
2. **Home** — same dashboard layout/actions as web `/home`.
3. **Drop-off** — create flow + native camera for proof photos.
4. **Where** — Mapbox map + GPS, same pins/filters as web.
5. **Campaigns / Rewards** — lists, claim, history.
6. **Profile / impact** — account, stats, settings.
7. **AI** — `EXPO_PUBLIC_AI_API_URL` with `x-api-key`.
8. **QR / deep links** — `/scan/:code` and `natcycle://` links.

Wire extra HTTP clients the same way web does: app API is `${apiUrl}/api` + Bearer; AI uses `x-api-key`; URS uses `X-API-Key`. For EAS store builds, set the same `EXPO_PUBLIC_*` values as EAS env (they are public in the bundle, like Vite).

## How to add a feature

1. Domain types and pure functions in `src/core/<domain>/`
2. Feature folder `src/features/<name>/` with `model/`, `api/`, `screens/`, `hooks/` as needed
3. Zod schemas in `model/`; HTTP mapping in `api/`; query keys colocated there
4. Screen uses `shared/ui` and `usePorts()` — no `expo-*` imports
5. Add a 10-line route file under `src/app/` that default-exports the screen
6. Colocate tests in `__tests__/`
7. Export the public surface from `src/features/<name>/index.ts`

## Commits

Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`). Lefthook runs commitlint.
