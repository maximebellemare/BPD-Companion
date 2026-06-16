# BPD Companion

BPD Companion is an Expo / React Native app for emotional regulation, reflection, coping support, and safer communication patterns.

It uses:

- Expo Router for navigation
- Supabase Auth and user profiles
- Supabase RLS-protected user data sync
- RevenueCat subscriptions and restore purchases
- A navy, blue, teal, cyan brand system with the Emotional Balance logo

## Local Development

```bash
npm install
npx tsc --noEmit
npx expo-doctor
npx expo start --web
npx expo start --dev-client
```

## EAS Builds

```bash
eas build --platform ios --profile preview
eas build --platform android --profile preview
eas build --platform ios --profile production
eas build --platform android --profile production
```

## Environment

Copy `.env.example` and fill in:

- Supabase URL and anon key
- RevenueCat iOS and Android SDK keys
- RevenueCat entitlement, product, and offering IDs

## Safety

BPD Companion is not medical advice, not a crisis service, and not a replacement for therapy or emergency care. If someone is in immediate danger, contact local emergency services.
