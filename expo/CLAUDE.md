# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun install          # Install dependencies
bun run start        # Start dev server (tunnel, for physical device)
bun run start-web    # Start web dev server (tunnel)
bun run lint         # Run ESLint
```

**Build & Deploy (requires EAS CLI):**
```bash
eas build --platform ios
eas build --platform android
eas submit --platform ios
```

No test suite is configured — validate changes manually on device/simulator.

## Architecture

**BPD Companion** is a React Native / Expo mental health app for Borderline Personality Disorder. It uses Expo Router (file-based routing), React Query for server state, and Context API for global state.

### Navigation

`app/` is the Expo Router root. The main shell is a 5-tab layout at `app/(tabs)/`: `(home)`, `journal`, `tools`, `companion`, `learn`. Modal/overlay screens live at the root `app/` level (e.g. `check-in`, `safety-mode`, `exercise`, `insights`).

### State Management

14 context providers wrap the app in `app/_layout.tsx`. The most important:

- `AppProvider` — journal entries, message drafts, distress level, safety mode
- `AICompanionProvider` — conversations, AI memory, modes, suggestions
- `ProfileProvider` — user profile & preferences
- `EmotionalContextProvider` — current emotional zone, active interventions
- `SpiralPreventionProvider` — emotional spiral detection

Each provider has a matching custom hook (e.g. `useApp`, `useAICompanion`).

### Data Layer

All persistence is local via `AsyncStorage`. A **repository pattern** (`services/repositories/`) abstracts storage behind typed interfaces (`IJournalRepository`, `IConversationRepository`, etc.). Repositories are singletons exported from `services/repositories/index.ts`. React Query wraps repository calls for caching.

### AI Integration

The AI layer is in `services/ai/` and `services/companion/`:

- **`companionAIService.ts`** — generates responses; assembles user memory + emotional context into prompts
- **`aiModeService.ts`** — detects which mode to use (`calm`, `reflection`, `high_distress`, `coaching`, etc.)
- **`aiPromptBuilder.ts`** — builds dynamic system prompts per mode
- **`aiSafetyService.ts`** — input/output safety checks
- **`modelRouterService.ts`** — routes to appropriate model based on response complexity
- Provider: `@rork-ai/toolkit-sdk` (`generateText`)

Memory is tiered: short-term (session), long-term (stored), and episodic (lessons learned). `services/memory/` manages retrieval and compression.

### Key Conventions

- **Package manager:** Bun only (`bun install`, not npm/yarn)
- **Path alias:** `@/*` maps to project root (configured in `tsconfig.json`)
- **Styling:** `StyleSheet.create` with constants from `constants/colors.ts` (navy, teal, lilac, sage, amber palette). No CSS-in-JS library.
- **Icons:** `lucide-react-native` exclusively
- **Types:** All domain types live in `types/` — start there before adding new interfaces

### Sensitive Domain

This app targets people with BPD. The crisis detection (`services/crisis/`) and safety assessment (`services/ai/aiSafetyService.ts`) flows are safety-critical. Be conservative with changes to these paths and to any AI prompt templates.
