# Manual App Store Preflight — BPD Companion

App type: **health + subscription + ai**

## 1. Metadata
- [x] No competitor trademarks (no "DBT Coach", "Calm", "Woebot" etc.)
- [x] No Apple trademark misuse (no "for iPhone", no "iOS", no "AirPods" etc.)
- [x] No banned AI wording for China storefront — listing can be hidden from CN or wording kept neutral ("AI companion" is fine).
- [x] Subtitle <= 30 chars, keywords <= 100 chars.
- [ ] Screenshots: need 6.7" iPhone + 13" iPad (see section 5).

## 2. Privacy
- [ ] **PrivacyInfo.xcprivacy** — Expo generates this at build time from `app.json` plugin declarations. Confirm at build. If missing, add a manifest declaring:
  - NSPrivacyCollectedDataTypes: none collected server-side (entries stored on device). If server sync is added later, list accordingly.
  - NSPrivacyAccessedAPITypes: `UserDefaults (CA92.1)`, `FileTimestamp (C617.1)` if used by Expo modules (Expo adds these automatically).
- [x] App does not request contacts, location, camera, mic, photos, health, or tracking — nothing to justify.
- [x] ATT (App Tracking Transparency) NOT needed — no cross-app tracking.
- [x] Privacy Policy screen exists (`app/privacy-policy.tsx`) and is linked from settings and upgrade.

## 3. Subscription (Guideline 3.1.2)
Required inside the paywall (`app/upgrade.tsx`):
- [ ] Clear price per period for each plan ("$X.XX / month", "$Y.YY / year").
- [ ] Length of subscription stated.
- [ ] "Payment will be charged to your Apple ID at confirmation of purchase."
- [ ] "Subscription auto-renews unless canceled at least 24 hours before the end of the current period."
- [ ] "You can manage and cancel subscriptions in your App Store account settings."
- [ ] Visible **Terms of Service** and **Privacy Policy** links on the paywall screen (not just in settings).
- [ ] **Restore Purchases** button on the paywall.

Action: verify `app/upgrade.tsx` contains all six items above. If not, add them — this is the #1 rejection reason for subscription apps.

## 4. Design / Minimum functionality
- [x] Not a WebView wrapper — native RN screens throughout.
- [x] App launches to usable content (onboarding → home).
- [x] Sign in with Apple: not required because the app uses no third-party sign-in. If Google/Facebook login is ever added, SIWA becomes mandatory.

## 5. Screenshots (required for submission)
Need to be captured on a real device / simulator (not available in this sandbox):
- iPhone 6.7" (1290 × 2796) — 5 screenshots
- iPad 13" (2064 × 2752) — 5 screenshots
Recommended frames: Onboarding, Home, Check-in / Grounding, Journal, AI Companion, Insights.

## 6. Entitlements
- [x] No push, iCloud, HealthKit, CallKit, or background modes enabled — nothing extra to justify.

## 7. Safety / Health
Because this app touches mental health:
- [x] Mental-health disclaimer screen exists (`app/mental-health-disclaimer.tsx`) with 988 + Crisis Text Line.
- [x] AI companion should be framed as supportive, NOT as therapy or diagnosis. Double-check copy in `app/(tabs)/companion` and upgrade screen uses language like "supportive tool", not "treatment".
- [ ] Age rating: set to **17+** in App Store Connect due to mental-health / crisis content. Infrequent/Mild: Mature themes.

## Blocking items before submission
1. Verify/complete subscription paywall disclosures (section 3).
2. Capture iPhone + iPad screenshots (section 5).
3. Set age rating to 17+ in ASC and fill in Health-related questions.

Everything else is green.
