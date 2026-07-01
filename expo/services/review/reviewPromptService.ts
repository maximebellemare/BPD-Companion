import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
import * as StoreReview from 'expo-store-review';

export type ReviewPromptTrigger =
  | 'after_onboarding'
  | 'after_first_tracking'
  | 'weekly_positive_mood'
  | 'settings_rate_app';

export type ReviewMoodContext = {
  moodLabels?: string[];
  moodLabel?: string | null;
  moodScore?: number | null;
  intensity?: number | null;
  text?: string | null;
};

export type ReviewPromptState = {
  hasReviewedOrOptedOut: boolean;
  onboardingPromptShown: boolean;
  firstCheckinPromptShown: boolean;
  lastPromptShownAt: number | null;
  lastNativeReviewAttemptAt: number | null;
};

const DEFAULT_STATE: ReviewPromptState = {
  hasReviewedOrOptedOut: false,
  onboardingPromptShown: false,
  firstCheckinPromptShown: false,
  lastPromptShownAt: null,
  lastNativeReviewAttemptAt: null,
};

const STORAGE_PREFIX = 'bpd_review_prompt_state_v1';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const NATIVE_REVIEW_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;
const ANDROID_PACKAGE_NAME = 'com.maximebellemare.bpdcompanion';
const IOS_APP_STORE_ID = 'TODO_REPLACE_WITH_APP_STORE_ID';

const POSITIVE_LABELS = new Set([
  'calm',
  'hopeful',
  'proud',
  'grateful',
  'stable',
  'relieved',
  'good',
  'positive',
  'okay',
  'ok',
  'happy',
  'connected',
  'motivated',
]);

const UNSAFE_LABELS = new Set([
  'crisis',
  'panic',
  'angry',
  'anger',
  'ashamed',
  'shame',
  'spiral',
  'triggered',
  'overwhelmed',
  'rejected',
  'abandoned',
  'empty',
  'hopeless',
]);

const UNSAFE_TEXT_PATTERNS = [
  /self[-\s]?harm/i,
  /suicid/i,
  /kill myself/i,
  /hurt myself/i,
  /crisis/i,
  /panic/i,
  /spiral/i,
];

function storageKey(userId?: string | null): string {
  return `${STORAGE_PREFIX}:${userId ?? 'anonymous'}`;
}

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase();
}

function getContextLabels(context?: ReviewMoodContext): string[] {
  return [
    ...(context?.moodLabels ?? []),
    context?.moodLabel ?? '',
  ]
    .filter(Boolean)
    .map(normalizeLabel);
}

export function isReviewSafeMoment(context?: ReviewMoodContext): boolean {
  const labels = getContextLabels(context);
  const intensity = context?.intensity ?? context?.moodScore ?? null;
  const text = context?.text ?? '';

  if (typeof intensity === 'number' && intensity >= 7) return false;
  if (labels.some(label => UNSAFE_LABELS.has(label))) return false;
  if (UNSAFE_TEXT_PATTERNS.some(pattern => pattern.test(text))) return false;

  return true;
}

export function isPositiveOrStableMood(context?: ReviewMoodContext): boolean {
  if (!isReviewSafeMoment(context)) return false;
  const labels = getContextLabels(context);
  const intensity = context?.intensity ?? context?.moodScore ?? null;

  if (labels.some(label => POSITIVE_LABELS.has(label))) return true;
  if (typeof intensity === 'number' && intensity <= 4) return true;

  return false;
}

export async function loadReviewPromptState(userId?: string | null): Promise<ReviewPromptState> {
  try {
    const raw = await AsyncStorage.getItem(storageKey(userId));
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<ReviewPromptState>;
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

async function saveReviewPromptState(userId: string | null | undefined, state: ReviewPromptState): Promise<void> {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(state));
}

export async function maybeShowReviewPrompt(
  trigger: ReviewPromptTrigger,
  userId?: string | null,
  context?: ReviewMoodContext,
): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const state = await loadReviewPromptState(userId);
  if (state.hasReviewedOrOptedOut) return false;

  const now = Date.now();

  if (trigger === 'after_onboarding') {
    if (state.onboardingPromptShown) return false;
    await saveReviewPromptState(userId, {
      ...state,
      onboardingPromptShown: true,
      lastPromptShownAt: now,
    });
    return true;
  }

  if (trigger === 'after_first_tracking') {
    if (state.firstCheckinPromptShown || !isReviewSafeMoment(context)) return false;
    await saveReviewPromptState(userId, {
      ...state,
      firstCheckinPromptShown: true,
      lastPromptShownAt: now,
    });
    return true;
  }

  if (trigger === 'weekly_positive_mood') {
    if (!isPositiveOrStableMood(context)) return false;
    if (state.lastPromptShownAt && now - state.lastPromptShownAt < WEEK_MS) return false;
    await saveReviewPromptState(userId, {
      ...state,
      lastPromptShownAt: now,
    });
    return true;
  }

  return true;
}

export async function markReviewPromptDismissed(userId?: string | null): Promise<void> {
  const state = await loadReviewPromptState(userId);
  await saveReviewPromptState(userId, {
    ...state,
    lastPromptShownAt: Date.now(),
  });
}

export async function markReviewCompleted(userId?: string | null): Promise<void> {
  const state = await loadReviewPromptState(userId);
  await saveReviewPromptState(userId, {
    ...state,
    hasReviewedOrOptedOut: true,
    lastPromptShownAt: Date.now(),
  });
}

export async function markNeverAskAgain(userId?: string | null): Promise<void> {
  await markReviewCompleted(userId);
}

async function openStoreFallback(): Promise<void> {
  if (Platform.OS === 'android') {
    const marketUrl = `market://details?id=${ANDROID_PACKAGE_NAME}`;
    const webUrl = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE_NAME}`;
    const canOpenMarket = await Linking.canOpenURL(marketUrl).catch(() => false);
    await Linking.openURL(canOpenMarket ? marketUrl : webUrl).catch(() => undefined);
    return;
  }

  if (Platform.OS === 'ios' && IOS_APP_STORE_ID !== 'TODO_REPLACE_WITH_APP_STORE_ID') {
    const appUrl = `itms-apps://itunes.apple.com/app/id${IOS_APP_STORE_ID}?action=write-review`;
    const webUrl = `https://apps.apple.com/app/id${IOS_APP_STORE_ID}?action=write-review`;
    const canOpenAppUrl = await Linking.canOpenURL(appUrl).catch(() => false);
    await Linking.openURL(canOpenAppUrl ? appUrl : webUrl).catch(() => undefined);
  }
}

export async function requestAppReview(userId?: string | null): Promise<void> {
  if (Platform.OS === 'web') return;

  const state = await loadReviewPromptState(userId);
  const now = Date.now();
  const nativeOnCooldown =
    state.lastNativeReviewAttemptAt !== null &&
    now - state.lastNativeReviewAttemptAt < NATIVE_REVIEW_COOLDOWN_MS;

  try {
    const isAvailable = await StoreReview.isAvailableAsync();
    if (isAvailable && !nativeOnCooldown) {
      await saveReviewPromptState(userId, {
        ...state,
        lastNativeReviewAttemptAt: now,
      });
      await StoreReview.requestReview();
      return;
    }
  } catch {
    // Review prompts are best-effort and should never disrupt app use.
  }

  await openStoreFallback();
}
