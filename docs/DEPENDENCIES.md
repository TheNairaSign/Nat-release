# Dependencies

Budget: do not add a direct dependency without an ADR if we are already over **45** production dependencies.

## Volatility

| Tier | Examples | Rule |
| --- | --- | --- |
| T0 | `src/core` | Zero dependencies |
| T1 | TypeScript, React | Depend freely |
| T2 | Expo SDK 57, RN 0.86, Expo Router, EAS | Upgrade on the ritual |
| T3 | TanStack Query, Zustand, Zod, AsyncStorage, i18next, Jest, Knip | Behind a port / adapter |
| T4 | none yet | Wrapped + exit plan |

## Patch ledger

None. Do not add `patch-package` patches without an upstream issue link and a removal condition.

## Day-one substitutions

- Storage: AsyncStorage instead of MMKV so iPhone + `eas go` works without Xcode. Revisit when a development build exists.
- Crash/analytics: noop adapters until Sentry/EAS Observe DSNs exist.
