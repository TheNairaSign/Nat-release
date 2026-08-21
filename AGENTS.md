# Expo HAS CHANGED

Read https://docs.expo.dev/versions/v57.0.0/ before writing code.

## Layers

`app/` → `features/` → `shared/` → `core/`. Downward only.

- `core/` imports nothing (no React, no Expo).
- Ports in `shared/ports/` import nothing. Adapters in `shared/adapters/` are the only place T3/T4 libraries are imported.
- Features never import `expo-*` or another feature except via `@/features/<name>`.
- Route files in `src/app/` are thin default exports of feature screens.

## Done

`pnpm verify` must pass.

## Storage

Tokens in SecureStore. KV is AsyncStorage until a dev client exists (then MMKV).
