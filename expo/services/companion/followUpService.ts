import { FollowUpPrompt } from '@/types/companionModes';
import { EmotionalState } from '@/types/companionMemory';
import { storageService } from '@/services/storage/storageService';

const FOLLOW_UP_KEY = 'bpd_companion_follow_ups';
const FOLLOW_UP_EXPIRY_MS = 6 * 60 * 60 * 1000;
const MAX_ACTIVE_FOLLOW_UPS = 3;

function generateId(): string {
  return `fu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function loadFollowUps(): Promise<FollowUpPrompt[]> {
  try {
    const stored = await storageService.get<FollowUpPrompt[]>(FOLLOW_UP_KEY);
    if (!stored) return [];
    const now = Date.now();
    return stored.filter(f => !f.dismissed && f.expiresAt > now);
  } catch (error) {
    console.log('[FollowUp] Error loading:', error);
    return [];
  }
}

export async function saveFollowUps(followUps: FollowUpPrompt[]): Promise<void> {
  try {
    await storageService.set(FOLLOW_UP_KEY, followUps.slice(0, 10));
    console.log('[FollowUp] Saved', followUps.length, 'follow-ups');
  } catch (error) {
    console.log('[FollowUp] Error saving:', error);
  }
}

export async function dismissFollowUp(followUpId: string): Promise<void> {
  const existing = await loadFollowUps();
  const updated = existing.map(f =>
    f.id === followUpId ? { ...f, dismissed: true } : f,
  );
  await saveFollowUps(updated);
  console.log('[FollowUp] Dismissed:', followUpId);
}

export async function createFollowUp(
  type: FollowUpPrompt['type'],
  triggerContext: string,
): Promise<FollowUpPrompt | null> {
  const existing = await loadFollowUps();
  const activeCount = existing.filter(f => !f.dismissed).length;

  if (activeCount >= MAX_ACTIVE_FOLLOW_UPS) {
    console.log('[FollowUp] Max active follow-ups reached, skipping');
    return null;
  }

  const hasSimilar = existing.some(
    f => f.type === type && !f.dismissed && Date.now() - f.createdAt < 2 * 60 * 60 * 1000,
  );
  if (hasSimilar) {
    console.log('[FollowUp] Similar follow-up already exists, skipping');
    return null;
  }

  const template = FOLLOW_UP_TEMPLATES[type];
  if (!template) return null;

  const followUp: FollowUpPrompt = {
    id: generateId(),
    type,
    title: template.title,
    message: template.message,
    suggestedPrompt: template.suggestedPrompt,
    triggerContext,
    createdAt: Date.now(),
    expiresAt: Date.now() + FOLLOW_UP_EXPIRY_MS,
    dismissed: false,
  };

  const updated = [followUp, ...existing].slice(0, 10);
  await saveFollowUps(updated);
  console.log('[FollowUp] Created follow-up:', type, 'for context:', triggerContext.substring(0, 40));

  return followUp;
}

const FOLLOW_UP_TEMPLATES: Record<FollowUpPrompt['type'], {
  title: string;
  message: string;
  suggestedPrompt: string;
}> = {
  post_distress: {
    title: 'The intensity has passed',
    message: 'Earlier was rough. Now that some distance exists, would it help to look at what happened with fresh eyes?',
    suggestedPrompt: 'I want to look back at what happened earlier when things felt overwhelming. What was really going on underneath the intensity?',
  },
  post_conflict: {
    title: 'Before the next move',
    message: 'Conflict leaves a lot of emotions behind. Processing them now can protect you and the relationship from a reactive next step.',
    suggestedPrompt: 'I had a conflict and I want to separate what actually happened from what my emotions are telling me it means.',
  },
  post_pause: {
    title: 'You paused',
    message: 'You chose to wait instead of react. That gap between impulse and action is where real change happens.',
    suggestedPrompt: 'I managed to pause before reacting this time. I want to understand what made it possible and how to do it again.',
  },
  post_reflection: {
    title: 'Weekly patterns are ready',
    message: 'Your week had some patterns worth noticing. Want to explore what your emotional data is showing?',
    suggestedPrompt: 'Walk me through my weekly patterns. What triggers and emotions kept showing up, and what does that tell me?',
  },
  post_therapy_report: {
    title: 'Therapy insights ready',
    message: 'Your therapy summary has some threads worth pulling on. Want to explore the key patterns together?',
    suggestedPrompt: 'Help me understand my therapy report. What patterns stand out and what should I bring to my next session?',
  },
  reinforcement: {
    title: 'Something shifted',
    message: 'Your recent patterns show real movement — not perfection, but genuine change in how you respond to difficult moments.',
    suggestedPrompt: 'What specific changes have you noticed in my patterns recently? I want to understand what I\'m doing differently.',
  },
};

export function shouldCreateFollowUp(
  emotionalState: EmotionalState,
  conversationLength: number,
  hasHighDistress: boolean,
  hasRelationshipConflict: boolean,
  hasCopingSuccess: boolean,
): FollowUpPrompt['type'] | null {
  if (hasHighDistress && conversationLength >= 4) {
    return 'post_distress';
  }

  if (hasRelationshipConflict && conversationLength >= 4) {
    return 'post_conflict';
  }

  if (hasCopingSuccess) {
    return 'post_pause';
  }

  if (conversationLength >= 8 && !hasHighDistress && !hasRelationshipConflict) {
    return 'reinforcement';
  }

  return null;
}

export function getFollowUpForFlow(
  sourceFlow: string,
): FollowUpPrompt['type'] | null {
  switch (sourceFlow) {
    case 'crisis_regulation':
      return 'post_distress';
    case 'relationship_copilot':
    case 'conflict_replay':
      return 'post_conflict';
    case 'message_guard':
      return 'post_pause';
    case 'weekly_reflection':
      return 'post_reflection';
    case 'therapy_report':
      return 'post_therapy_report';
    default:
      return null;
  }
}
