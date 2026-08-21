# ADR 0001 — Intake defaults

## Context

Scaffold requested with `/mobile-scaffold`. Intake was not answered question-by-question; product context already exists from the Natcycle mobile decision.

## Decision

- Name/slug: Natcycle / `natcycle`. Bundle ID `com.natcycle.app` with `.dev` / `.preview` suffixes.
- Auth: email+password shell against a stub that falls back if the live API is down.
- Backend: REST + typed client against the existing Natcycle server.
- Offline: cached reads, online writes.
- Native: CNG / config plugins only. No ejected `ios/`/`android/`.
- Targets: iPhone/Android now; `core/` and feature `model/` stay React Native-free so web can be additive.
- Team: structured for several humans + agents.
- Lifespan: long-lived product.

## Consequences

Placeholder screens only. Company portal is out of scope.

## Revisit-when

First real auth endpoint wiring, or if a tablet/web target is scheduled.
