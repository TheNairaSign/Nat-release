# ADR 0002 — Storage adapter

## Context

The scaffold default is MMKV. MMKV is not in Expo Go. This machine has no Xcode.app, and the developer’s device is an iPhone (not Android/APK). Store Expo Go is SDK 54; this app is SDK 57.

## Decision

Use AsyncStorage for general KV and expo-secure-store for tokens. Keep the `KeyValueStore` / `SecureStore` ports. Add an MMKV adapter when a development build exists.

## Consequences

Slightly slower KV than MMKV. Physical iPhone can run via `eas go` without a custom native binary.

## Revisit-when

Xcode is installed or an EAS iOS development build is on a device.
