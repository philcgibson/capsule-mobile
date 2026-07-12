# Capsule Mobile

Expo React Native app for iOS and Android.

## Stack

- Expo SDK 56
- React Native 0.85
- TypeScript
- Expo Router
- Expo Image Picker
- Expo development build/custom dev client

## Role

- Presents the primary mobile product experience.
- Talks to the separate [Capsule web/API repository](https://github.com/philcgibson/capsule-web).
- Keeps mobile-specific navigation, screens, assets, and native configuration in this directory.
- Does not own the browser web experience. Web invite/contribution flows live in Laravel's Inertia React web UI.

The app currently has a Capsule owner home wired through Expo Router. It can use the local test-user API token endpoint to list/create persisted capsules with date context and an optional first photo, open the new capsule detail immediately after creation, edit basic capsule settings, add text memories, add captioned photo memories, remove memories from the memory detail view, generate, open, copy, share, and revoke browser invite links for guest contribution, show saved invite records after refresh with usage metadata, pause invite actions when a capsule is private, pull to refresh owner home and capsule detail data, open a dedicated photo-led capsule view with note/photo/invite actions, switch the capsule memory collection between timeline and grid views, open individual memory detail screens, and show guest contributor attribution in memory lists.

## Local Setup

```bash
npm install
cp .env.example .env
```

Set `EXPO_PUBLIC_API_URL` to the Laravel API base URL and `EXPO_PUBLIC_WEB_URL` to the Laravel browser base URL. `http://localhost:8000` works for the iOS simulator when Laravel is running locally; Android emulators commonly need `http://10.0.2.2:8000`, and physical devices need the Mac's LAN IP address.

Mobile uses `EXPO_PUBLIC_WEB_URL` when displaying, opening, copying, or sharing newly generated invite links. Saved invite records are visible after refresh, but raw invite URLs are only available immediately after generation. Keep `EXPO_PUBLIC_WEB_URL` set to a URL that the reviewer or guest browser can open, especially when `EXPO_PUBLIC_API_URL` uses an emulator-only host.

Set `EXPO_PUBLIC_ENABLE_DEMO_OWNER=true` only for local demos that should show the one-tap seeded owner sign-in. Use `false` or omit it for pitch builds that should present only registration and login.

Public discovery is disabled by default. Show the Explore tab only in an environment where both `EXPO_PUBLIC_ENABLE_PUBLIC_DISCOVERY=true` in the mobile build and `CAPSULE_PUBLIC_DISCOVERY=true` on the API are deliberately configured. Keep both false for the first private, invite-only release.

Start Metro for a development build:

```bash
npm start
```

If another React Native project is already using Metro's default port, start the Capsule review server on `8082`:

```bash
npm run start:review
```

Create and run a local native development build:

```bash
npm run ios
npm run android
```

Expo Go can be used only as a quick compatibility smoke test:

```bash
npm run start:go
```

Build an EAS development client when credentials are configured:

```bash
npx eas build --profile development
```

## Expo project

This app is linked to [`@phil_stradx/capsule`](https://expo.dev/accounts/phil_stradx/projects/capsule).

The shared API contract, product notes, brand system, and release checklist live in the [web/API repository](https://github.com/philcgibson/capsule-web/tree/main/docs).
