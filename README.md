# Natcycle Mobile

Consumer iOS/Android app. Full rebuild of the Natcycle web consumer product — nothing is imported from `client/`. `/company` stays on web.

APIs match the web client: `EXPO_PUBLIC_API_URL` + `/api`, Bearer JWT, AI `x-api-key`, URS `X-API-Key`. Copy `.env.example` to `.env` and fill the same values the Vite app uses (`VITE_*` → `EXPO_PUBLIC_*`). Those keys are inlined in the JS bundle, same as web.

## Run it

Simulator/emulator is fine when you want it. Store Expo Go is currently SDK 54; this app is **SDK 57**.

```bash
cp .env.example .env   # then paste the production public env
pnpm start             # Expo Go / QR
pnpm ios               # Simulator (needs Xcode)
pnpm android           # Emulator (needs Android Studio)
```

SDK 57 on a physical iPhone: `pnpm dlx eas-cli go` (Apple Developer). Add the Expo MCP in Cursor settings → MCP → URL `https://mcp.expo.dev/mcp`.

## Scripts

```bash
pnpm start
pnpm typecheck
pnpm lint
pnpm test
pnpm verify         # typecheck + lint + test:ci + knip
pnpm doctor
```

## Where to look next

- `docs/CONTRIBUTING.md` — build order and how to add a feature
- `docs/ARCHITECTURE.md` — layers and ports
- `AGENTS.md` — rules for agents
