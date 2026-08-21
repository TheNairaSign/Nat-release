# Architecture

Four layers. Imports flow downward only.

```
app/        routes only (Expo Router) + future +api.ts
  ↓
features/   product slices (auth, home, where, dropoff, rewards, profile)
  ↓
shared/     UI, ports, adapters, api, theme, i18n
  ↓
core/       pure domain — no React, no Expo, no I/O
```

- `features/a` does not import `features/b`.
- `shared/` does not import `features/` or `app/`.
- `core/` imports nothing.
- Feature code does not import `expo-*` native modules; it uses `shared/ports`.
- Route files are thin: import a screen, default-export it.

## Ports

Interfaces you own live in `src/shared/ports/` and import nothing. Implementations live in `src/shared/adapters/` and are wired once in `src/providers/AppProviders.tsx`.

Day-one storage is AsyncStorage + expo-secure-store so an iPhone can run via `eas go` without Xcode. MMKV is the intended later adapter (requires a development build). See `docs/adr/0002-storage.md`.

## State

- Server state: TanStack Query (`shared/api`)
- Client session: Zustand slice in `features/auth`, tokens in SecureStore
- DTOs parsed with Zod at the HTTP boundary, then mapped into `core/` types
