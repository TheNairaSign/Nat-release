# Upgrade ritual

Cadence: stay within one Expo SDK of current. Never more than two behind. SDK support window is ~12 months.

## Procedure

1. Read that SDK’s release notes.
2. Run the `expo-upgrade` skill (or `npx expo install expo@^XX --fix`).
3. `npx expo-doctor`
4. `pnpm verify`
5. `pnpm prebuild` (do not commit `ios/` / `android/`)
6. Smoke-test on a device or simulator
7. Ship to the internal EAS channel first

## Rollback

Previous EAS Update channel + last known-good build.

## Ledger

| Date | From | To | Breaking changes | Time |
| --- | --- | --- | --- | --- |
| 2026-08-18 | — | SDK 57 (expo 57.0.14, RN 0.86.2) | Initial scaffold | — |

Next scheduled check: **2026-10-18** (or whenever SDK 58 ships).
