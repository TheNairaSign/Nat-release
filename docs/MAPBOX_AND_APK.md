# Mapbox + APK

## Mapbox — what you need

Where and Impact Action Map use `@rnmapbox/maps` with style `mapbox://styles/mapbox/streets-v12`.

| Token | Where it goes | How to get it |
| --- | --- | --- |
| **Public token** (`pk.…`) | Runtime: `EXPO_PUBLIC_MAPBOX_TOKEN` in `.env` and EAS secrets | [Mapbox account](https://account.mapbox.com/) → Access tokens → create a **public** token. Restrict by Android package / iOS bundle if you want. |
| **Secret download token** (`sk.…`) | Build-time only: `RNMapboxMapsDownloadToken` / EAS secret | Same Mapbox account → create a **secret** token with **DOWNLOADS:READ**. Used so native Mapbox SDKs can download during `prebuild` / EAS. |

Already in the app:

- Plugin in `app.config.ts`: `@rnmapbox/maps` with `RNMapboxMapsVersion: "11.23.1"`
- Runtime: `WhereMap` calls `Mapbox.setAccessToken(getEnv().mapboxToken)`
- Location permission strings / Android `ACCESS_FINE_LOCATION`

**Mapbox does not run in Expo Go.** You need a **development client** or **preview/production APK**.

### Wire the download token for native builds

1. Create secret token with Downloads:Read on Mapbox.
2. Store it as an EAS env var for the `preview` environment (do not commit):

```bash
cd natcycle/app/mobile
npx eas-cli@latest env:create --name RNMAPBOX_MAPS_DOWNLOAD_TOKEN --value "sk.YOUR_SECRET" --environment preview --visibility secret --force
```

Gradle picks it up from `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` (Mapbox Android downloads often work without it now; keep it for iOS / older tooling).

### Also set these EAS secrets for a working APK

`eas.json` only inlines API host URLs. Keys must be secrets or env on the build:

- `EXPO_PUBLIC_MAPBOX_TOKEN`
- `EXPO_PUBLIC_AI_API_KEY`
- `EXPO_PUBLIC_URS_API_KEY`
- `EXPO_PUBLIC_GOOGLE_API_KEY`
- `EAS_PROJECT_ID` (if not already linked)

```bash
npx eas-cli@latest secret:create --name EXPO_PUBLIC_MAPBOX_TOKEN --value "pk...." --type string
npx eas-cli@latest secret:create --name EXPO_PUBLIC_AI_API_KEY --value "..." --type string
npx eas-cli@latest secret:create --name EXPO_PUBLIC_URS_API_KEY --value "..." --type string
npx eas-cli@latest secret:create --name EXPO_PUBLIC_GOOGLE_API_KEY --value "..." --type string
```

---

## APK — steps (EAS preview)

Preview profile already sets `"android": { "buildType": "apk" }`.

1. Install / login

```bash
cd natcycle/app/mobile
npm i -g eas-cli   # or use npx
eas login
eas whoami
```

2. Link the Expo project (once)

```bash
eas init
# copies projectId into app.config extra.eas.projectId / EAS_PROJECT_ID
```

3. Add Mapbox download + public tokens (and other secrets) as above.

4. Build APK

```bash
eas build -p android --profile preview
```

5. When the build finishes, open the Expo build URL → **Download** the `.apk` → install on a device (allow unknown sources).

6. Optional: development client (hot reload + Mapbox)

```bash
eas build -p android --profile development
# install that APK, then:
pnpm start:dev
```

### If EAS login is blocked on this machine

Run the same commands on your laptop where you are logged into Expo. There is no local Android SDK on this agent environment, so cloud EAS is the path.

---

## After install — smoke test

- Sign in → Home → Where map loads markers
- Record → create drop-off → photo → success on Home
- You → Impact / Rewards / Campaigns
- Header AI → Diva landing + chat
