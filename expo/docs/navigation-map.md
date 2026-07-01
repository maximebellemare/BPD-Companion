# BPD Companion Navigation Map

## Bottom Tabs

1. Today
   - Route: `/(tabs)/(home)`
   - Purpose: daily habit screen, quick emotional check-in, crisis/calm access, first-week task, personalized insight.
   - Important actions: `/check-in`, `/grounding-mode`, `/insights`, `/weekly-reflection`.

2. Companion
   - Route: `/(tabs)/companion`
   - Purpose: personalized BPD companion using recent check-ins, triggers, onboarding goals, and saved conversation memory.
   - Important nested screens: `/companion/chat`, `/companion/memory`, `/companion/weekly-insights`, `/companion/saved`, `/companion/emotional-patterns`, `/companion/simulator`.

3. Insights
   - Route: `/(tabs)/insights`
   - Purpose: premium value screen for emotional pattern summary, trigger patterns, relationship signals, AI observations, and first-week report.
   - Compatibility route: `/insights` renders the same screen.

4. Tools
   - Route: `/(tabs)/tools`
   - Purpose: coping skills, DBT tools, grounding, body regulation, response simulator, guided journal/check-in.
   - Important nested screens: `/tools/dbt-coach`, `/tools/tool-matcher`, `/tools/playbook`, `/tools/mentalization`, `/tools/relationship-recovery`, `/tools/body-regulation`.

5. Profile
   - Route: `/(tabs)/profile`
   - Purpose: account, subscription, notifications, appearance preference, legal/safety links, support, delete account, logout.
   - Important nested screens: `/profile/notification-preferences`, `/profile/crisis-settings`, `/profile/trusted-contacts`, `/privacy-policy`, `/terms-of-service`, `/mental-health-disclaimer`, `/support-feedback`, `/data-deletion`.

## Hidden Main-Tab Groups Kept For Compatibility

- `/(tabs)/journal`
  - Hidden from bottom tabs.
  - Kept so old links and journal timeline routes still work.
  - Journaling is now surfaced from Today, Companion, and Tools.

- `/(tabs)/messages`
  - Hidden from bottom tabs.
  - Kept for write-before-reacting flows, message rewrite support, and Companion quick actions.

- `/(tabs)/learn`
  - Hidden from bottom tabs.
  - Kept for education links and learning recommendations.

- `/(tabs)/community`
  - Hidden from bottom tabs.
  - Kept for existing community routes, but no longer part of the daily core navigation.

## Redirects Kept For Compatibility

- `/profile/progress` redirects to `/(tabs)/insights`.
- `/profile/insights-dashboard` redirects to `/(tabs)/insights`.
- `/profile/patterns` redirects to `/(tabs)/insights`.
- `/profile/analytics-debug` redirects to `/(tabs)/insights`.

## Navigation Principles

- Daily use starts on Today.
- Crisis and calming tools are one tap from Today when intensity is high.
- Progress and analytics belong in Insights.
- Account and settings belong in Profile.
- Journal/check-in stays accessible without taking a primary tab.
