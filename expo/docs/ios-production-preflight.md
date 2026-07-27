# iOS Production Preflight

Run production iOS builds through:

```bash
npm run build:ios:production
```

This runs `npm run preflight:ios` before `eas build --platform ios --profile production`.

## App Store Connect Credentials

The preflight script reads App Store Connect API credentials from environment variables only:

```bash
APP_STORE_CONNECT_API_ISSUER_ID=
APP_STORE_CONNECT_API_KEY_ID=
APP_STORE_CONNECT_API_PRIVATE_KEY=
```

Alternatively, keep the private key in a local file and provide:

```bash
APP_STORE_CONNECT_API_PRIVATE_KEY_PATH=/absolute/path/AuthKey_XXXXXXXXXX.p8
```

Do not commit App Store Connect API private keys.

## Local Fallback

If App Store Connect credentials are unavailable, the script requires an explicit local confirmation:

```bash
BPD_COMPANION_LATEST_APPROVED_IOS_VERSION=1.0.7 \
BPD_COMPANION_CONFIRM_LATEST_APPROVED_VERSION=true \
npm run preflight:ios
```

The build is blocked unless the local Expo version is greater than the confirmed latest approved App Store version.
