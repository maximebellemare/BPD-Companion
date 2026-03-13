import { storageService } from '@/services/storage/storageService';
import {
  PersonalValue,
  UserValueSelection,
  UserValuesState,
  SelfTrustPrompt,
  SelfTrustResponse,
  IdentityJournalPrompt,
} from '@/types/identity';

const VALUES_KEY = 'steady_identity_values';
const SELF_TRUST_KEY = 'steady_self_trust_responses';

export const CORE_VALUES: PersonalValue[] = [
  { id: 'v_honesty', label: 'Honesty', category: 'integrity', description: 'Being truthful with myself and others, even when it feels hard.', emoji: '🪞' },
  { id: 'v_connection', label: 'Connection', category: 'connection', description: 'Staying close to people I care about without losing myself.', emoji: '🤝' },
  { id: 'v_peace', label: 'Peace', category: 'peace', description: 'Choosing calm over chaos when I can.', emoji: '🕊️' },
  { id: 'v_dignity', label: 'Dignity', category: 'self', description: 'Protecting my self-respect, especially in hard moments.', emoji: '👑' },
  { id: 'v_self_respect', label: 'Self-Respect', category: 'self', description: 'Treating myself the way I would treat someone I love.', emoji: '💎' },
  { id: 'v_courage', label: 'Courage', category: 'growth', description: 'Moving toward what matters even when fear is present.', emoji: '🦁' },
  { id: 'v_kindness', label: 'Kindness', category: 'connection', description: 'Being gentle with others and with myself.', emoji: '🌸' },
  { id: 'v_consistency', label: 'Consistency', category: 'integrity', description: 'Showing up as the same person, even under pressure.', emoji: '🧭' },
  { id: 'v_growth', label: 'Growth', category: 'growth', description: 'Learning from pain instead of being defined by it.', emoji: '🌱' },
  { id: 'v_loyalty', label: 'Loyalty', category: 'connection', description: 'Being reliable to the people I choose.', emoji: '🔗' },
  { id: 'v_boundaries', label: 'Boundaries', category: 'self', description: 'Knowing where I end and others begin.', emoji: '🛡️' },
  { id: 'v_independence', label: 'Independence', category: 'self', description: 'Being whole on my own, not needing others to feel okay.', emoji: '🏔️' },
  { id: 'v_emotional_honesty', label: 'Emotional Honesty', category: 'integrity', description: 'Naming what I feel without hiding or exaggerating it.', emoji: '💬' },
  { id: 'v_patience', label: 'Patience', category: 'peace', description: 'Allowing things to unfold without forcing or rushing.', emoji: '⏳' },
  { id: 'v_trust', label: 'Trust', category: 'connection', description: 'Building trust slowly, including trust in myself.', emoji: '🌿' },
  { id: 'v_presence', label: 'Presence', category: 'peace', description: 'Being here now, instead of lost in fear about the future.', emoji: '🧘' },
  { id: 'v_resilience', label: 'Resilience', category: 'growth', description: 'Getting back up, even after hard moments.', emoji: '🔥' },
  { id: 'v_authenticity', label: 'Authenticity', category: 'integrity', description: 'Being real rather than performing a version of myself.', emoji: '✨' },
];

export const SELF_TRUST_PROMPTS: SelfTrustPrompt[] = [
  { id: 'stp_1', text: 'What do I know is true right now, even if I feel unsafe?', category: 'grounding' },
  { id: 'stp_2', text: 'What do I need, separate from panic?', category: 'needs' },
  { id: 'stp_3', text: 'What would self-respect look like in this moment?', category: 'self-respect' },
  { id: 'stp_4', text: 'What choice would future me feel proud of?', category: 'future-self' },
  { id: 'stp_5', text: 'If I trusted myself more, what would I do next?', category: 'clarity' },
  { id: 'stp_6', text: 'What would I tell a friend feeling this way?', category: 'clarity' },
  { id: 'stp_7', text: 'What is the fear underneath this urgency?', category: 'grounding' },
  { id: 'stp_8', text: 'What do I actually want, beyond the panic?', category: 'needs' },
  { id: 'stp_9', text: 'What boundary would protect me here?', category: 'self-respect' },
  { id: 'stp_10', text: 'What does calm me already know about this situation?', category: 'future-self' },
  { id: 'stp_11', text: 'Can I let this moment pass without reacting?', category: 'grounding' },
  { id: 'stp_12', text: 'What would honoring my values look like right now?', category: 'self-respect' },
];

export const IDENTITY_JOURNAL_PROMPTS: IdentityJournalPrompt[] = [
  { id: 'ijp_1', text: 'Who am I when I am calm?', category: 'calm-self' },
  { id: 'ijp_2', text: 'What kind of person do I want to be in conflict?', category: 'conflict-self' },
  { id: 'ijp_3', text: 'What do I want my relationships to feel like?', category: 'relationship-self' },
  { id: 'ijp_4', text: 'What am I no longer willing to abandon in myself?', category: 'boundaries' },
  { id: 'ijp_5', text: 'When do I feel most like me?', category: 'core-self' },
  { id: 'ijp_6', text: 'What parts of myself do I lose when I am afraid?', category: 'core-self' },
  { id: 'ijp_7', text: 'What does safety feel like in my body?', category: 'calm-self' },
  { id: 'ijp_8', text: 'What kind of friend do I want to be?', category: 'relationship-self' },
  { id: 'ijp_9', text: 'What do I need to hear from myself more often?', category: 'core-self' },
  { id: 'ijp_10', text: 'What am I protecting when I set a boundary?', category: 'boundaries' },
  { id: 'ijp_11', text: 'What does it mean to show up for myself?', category: 'calm-self' },
  { id: 'ijp_12', text: 'When have I handled something difficult and felt good about how I responded?', category: 'conflict-self' },
];

export const EXAMPLE_ANCHOR_STATEMENTS: string[] = [
  'I do not need to chase clarity from panic.',
  'My worth is not decided by one delayed reply.',
  'I can want connection without abandoning myself.',
  'I can pause and still care.',
  'I do not need to prove my pain in order for it to matter.',
  'The urge will pass. I do not have to obey it.',
  'I can sit with uncertainty without making it mean the worst.',
  'I am allowed to take my time.',
  'One hard moment does not erase my progress.',
  'I can be hurt and still respond with dignity.',
];

export async function getValuesState(): Promise<UserValuesState> {
  const data = await storageService.get<UserValuesState>(VALUES_KEY);
  console.log('[ValuesService] Loaded values state, selections:', data?.selectedValues?.length ?? 0);
  return data ?? { selectedValues: [], updatedAt: 0 };
}

export async function saveValuesState(state: UserValuesState): Promise<void> {
  await storageService.set(VALUES_KEY, state);
  console.log('[ValuesService] Saved values state');
}

export async function toggleValue(valueId: string, reflection?: string): Promise<UserValuesState> {
  const state = await getValuesState();
  const exists = state.selectedValues.find(v => v.valueId === valueId);
  let updated: UserValueSelection[];

  if (exists) {
    updated = state.selectedValues.filter(v => v.valueId !== valueId);
    console.log('[ValuesService] Removed value:', valueId);
  } else {
    const maxRank = state.selectedValues.length > 0
      ? Math.max(...state.selectedValues.map(v => v.rank))
      : 0;
    updated = [
      ...state.selectedValues,
      { valueId, rank: maxRank + 1, reflection: reflection ?? '', selectedAt: Date.now() },
    ];
    console.log('[ValuesService] Added value:', valueId);
  }

  const newState: UserValuesState = { selectedValues: updated, updatedAt: Date.now() };
  await saveValuesState(newState);
  return newState;
}

export async function updateValueReflection(valueId: string, reflection: string): Promise<UserValuesState> {
  const state = await getValuesState();
  const updated = state.selectedValues.map(v =>
    v.valueId === valueId ? { ...v, reflection } : v
  );
  const newState: UserValuesState = { selectedValues: updated, updatedAt: Date.now() };
  await saveValuesState(newState);
  console.log('[ValuesService] Updated reflection for:', valueId);
  return newState;
}

export async function reorderValues(orderedIds: string[]): Promise<UserValuesState> {
  const state = await getValuesState();
  const updated = state.selectedValues.map(v => ({
    ...v,
    rank: orderedIds.indexOf(v.valueId) + 1,
  }));
  const newState: UserValuesState = { selectedValues: updated, updatedAt: Date.now() };
  await saveValuesState(newState);
  console.log('[ValuesService] Reordered values');
  return newState;
}

export async function getSelfTrustResponses(): Promise<SelfTrustResponse[]> {
  const data = await storageService.get<SelfTrustResponse[]>(SELF_TRUST_KEY);
  console.log('[ValuesService] Loaded', data?.length ?? 0, 'self-trust responses');
  return data ?? [];
}

export async function saveSelfTrustResponse(
  promptId: string,
  promptText: string,
  response: string,
): Promise<SelfTrustResponse[]> {
  const existing = await getSelfTrustResponses();
  const newResponse: SelfTrustResponse = {
    id: `str_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    promptId,
    promptText,
    response,
    isFavorite: false,
    createdAt: Date.now(),
  };
  const updated = [newResponse, ...existing];
  await storageService.set(SELF_TRUST_KEY, updated);
  console.log('[ValuesService] Saved self-trust response for prompt:', promptId);
  return updated;
}

export async function toggleSelfTrustFavorite(responseId: string): Promise<SelfTrustResponse[]> {
  const existing = await getSelfTrustResponses();
  const updated = existing.map(r =>
    r.id === responseId ? { ...r, isFavorite: !r.isFavorite } : r
  );
  await storageService.set(SELF_TRUST_KEY, updated);
  console.log('[ValuesService] Toggled favorite on response:', responseId);
  return updated;
}
