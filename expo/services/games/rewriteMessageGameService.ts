import { storageService } from '@/services/storage/storageService';

export type RewriteMessageCategory = 'abandonment' | 'rejection' | 'conflict' | 'family' | 'friendship';

export interface RewriteMessageScenario {
  id: string;
  category: RewriteMessageCategory;
  title: string;
  context: string;
  original: string;
  goal: string;
  strongerVersion: string;
  dbtVersion: string;
  assertiveVersion: string;
}

export interface RewriteMessageScore {
  emotionalRegulation: number;
  validation: number;
  effectiveness: number;
  overall: number;
  feedback: string[];
}

export interface RewriteMessageAttempt {
  id: string;
  scenarioId: string;
  category: RewriteMessageCategory;
  userRewrite: string;
  score: RewriteMessageScore;
  createdAt: number;
}

export interface RewriteMessageProgress {
  attempts: RewriteMessageAttempt[];
  bestScoreByScenario: Record<string, number>;
  categoryAttempts: Record<RewriteMessageCategory, number>;
  categoryBestScores: Record<RewriteMessageCategory, number>;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}

const STORAGE_KEY = 'bpd_companion_rewrite_message_progress';

export const REWRITE_CATEGORY_LABELS: Record<RewriteMessageCategory, string> = {
  abandonment: 'Abandonment',
  rejection: 'Rejection',
  conflict: 'Conflict',
  family: 'Family',
  friendship: 'Friendship',
};

export const DEFAULT_REWRITE_MESSAGE_PROGRESS: RewriteMessageProgress = {
  attempts: [],
  bestScoreByScenario: {},
  categoryAttempts: {
    abandonment: 0,
    rejection: 0,
    conflict: 0,
    family: 0,
    friendship: 0,
  },
  categoryBestScores: {
    abandonment: 0,
    rejection: 0,
    conflict: 0,
    family: 0,
    friendship: 0,
  },
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
};

export const REWRITE_MESSAGE_SCENARIOS: RewriteMessageScenario[] = [
  {
    id: 'abandonment_ignored_text',
    category: 'abandonment',
    title: 'No reply',
    context: "Your partner hasn't answered for 6 hours and you feel your chest tightening.",
    original: "I can't believe you're ignoring me. You obviously don't care.",
    goal: 'Ask for connection without accusation.',
    strongerVersion: "I’m feeling anxious because I haven’t heard back. When you can, could you let me know we’re okay?",
    dbtVersion: "I noticed I haven’t heard back for a while. I’m feeling anxious and could use a quick check-in when you’re available.",
    assertiveVersion: "I feel unsettled when plans or messages go quiet. Please send me a quick update when you can.",
  },
  {
    id: 'abandonment_space_request',
    category: 'abandonment',
    title: 'They need space',
    context: 'Someone you love says they need space after a tense conversation.',
    original: 'Fine. Take space. I guess I mean nothing to you.',
    goal: 'Respect the pause while naming your need.',
    strongerVersion: 'I can respect space. I’m feeling scared right now, so it would help to know when we can reconnect.',
    dbtVersion: 'I hear that you need space. I’m going to pause too, and I’d appreciate setting a time to talk later.',
    assertiveVersion: 'I can give you space tonight. Please let me know when you’re ready to continue the conversation.',
  },
  {
    id: 'rejection_cancelled_plans',
    category: 'rejection',
    title: 'Cancelled plans',
    context: 'A friend cancels plans last minute and says they are exhausted.',
    original: 'Whatever. You clearly never wanted to hang out anyway.',
    goal: 'Name disappointment without making a final judgment.',
    strongerVersion: 'I’m disappointed because I was looking forward to seeing you. Can we pick another time?',
    dbtVersion: 'I understand you’re tired. I feel disappointed, and I’d still like to reschedule if you’re open to it.',
    assertiveVersion: 'I get that things come up. I’d appreciate more notice next time if possible.',
  },
  {
    id: 'rejection_left_out',
    category: 'rejection',
    title: 'Left out',
    context: 'You see friends posted a photo from a hangout you were not invited to.',
    original: 'Thanks for excluding me. I see where I stand.',
    goal: 'Ask about the hurt without attacking.',
    strongerVersion: 'I saw the photo and felt left out. Was this something I wasn’t meant to be part of?',
    dbtVersion: 'I’m trying not to assume, but I felt hurt seeing the hangout. Can you help me understand what happened?',
    assertiveVersion: 'I felt excluded when I saw the post. I’d like to talk about it directly instead of guessing.',
  },
  {
    id: 'conflict_cold_tone',
    category: 'conflict',
    title: 'Cold tone',
    context: 'Someone replies with “ok” after you share something vulnerable.',
    original: 'Wow. Nice response. Don’t bother pretending you care.',
    goal: 'Check the meaning before escalating.',
    strongerVersion: 'That reply landed cold for me. Did you mean it that way, or am I reading it wrong?',
    dbtVersion: 'When I saw “ok,” I felt hurt and unsure. Can you clarify what you meant?',
    assertiveVersion: 'I need more than “ok” when I share something vulnerable. Can we talk about it?',
  },
  {
    id: 'conflict_unfair_comment',
    category: 'conflict',
    title: 'Unfair comment',
    context: 'During an argument, someone says you are “too sensitive.”',
    original: 'You’re the problem. You always make me feel crazy.',
    goal: 'Protect self-respect without counterattacking.',
    strongerVersion: 'Being called too sensitive hurts. I want to talk about the issue without labels.',
    dbtVersion: 'When I hear “too sensitive,” I feel dismissed. Please tell me the specific behavior you want to discuss.',
    assertiveVersion: 'I’m willing to talk, but I’m not okay with being labeled. Let’s focus on what happened.',
  },
  {
    id: 'family_boundary_push',
    category: 'family',
    title: 'Boundary pressure',
    context: 'A family member keeps pressuring you after you already said no.',
    original: 'Why can’t you ever respect me? I’m done with this family.',
    goal: 'Restate the boundary clearly.',
    strongerVersion: 'I know this matters to you, but my answer is still no. I need you to respect that.',
    dbtVersion: 'I understand you’re disappointed. I’m not able to do this, and I’m going to keep that boundary.',
    assertiveVersion: 'I’ve said no, and I’m not discussing it further tonight.',
  },
  {
    id: 'family_criticism',
    category: 'family',
    title: 'Criticism',
    context: 'A parent criticizes your choices and you feel shame rising.',
    original: 'You always make me feel worthless. I should never tell you anything.',
    goal: 'Name the impact and ask for a different tone.',
    strongerVersion: 'When my choices are criticized that way, I shut down. I need a calmer tone if we’re going to talk.',
    dbtVersion: 'I hear that you’re concerned. I feel hurt by the criticism, and I’d like feedback without insults.',
    assertiveVersion: 'I’m open to your concern, but I won’t stay in a conversation where I’m being criticized harshly.',
  },
  {
    id: 'friendship_short_reply',
    category: 'friendship',
    title: 'Short reply',
    context: 'A close friend gives short replies all day and you feel unwanted.',
    original: 'If you don’t want to be friends anymore just say that.',
    goal: 'Check in without forcing reassurance.',
    strongerVersion: 'You seem quieter today, and I’m noticing I feel a little insecure. Are we okay?',
    dbtVersion: 'I may be reading into it, but the short replies made me anxious. Can you tell me if something is off?',
    assertiveVersion: 'I’d rather ask directly than guess: are we good?',
  },
  {
    id: 'friendship_forgotten',
    category: 'friendship',
    title: 'Forgotten plan',
    context: 'A friend forgets something important you told them.',
    original: 'Of course you forgot. Nobody actually listens to me.',
    goal: 'Express hurt without globalizing.',
    strongerVersion: 'I felt hurt when that got forgotten because it mattered to me.',
    dbtVersion: 'I know people forget things, and I still felt sad because this was important to me.',
    assertiveVersion: 'I need you to take this seriously. Can we talk about how to remember it next time?',
  },
];

function todayKey(now = Date.now()): string {
  const date = new Date(now);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function normalizeProgress(value: Partial<RewriteMessageProgress> | null | undefined): RewriteMessageProgress {
  return {
    ...DEFAULT_REWRITE_MESSAGE_PROGRESS,
    ...(value ?? {}),
    attempts: value?.attempts ?? [],
    bestScoreByScenario: value?.bestScoreByScenario ?? {},
    categoryAttempts: {
      ...DEFAULT_REWRITE_MESSAGE_PROGRESS.categoryAttempts,
      ...(value?.categoryAttempts ?? {}),
    },
    categoryBestScores: {
      ...DEFAULT_REWRITE_MESSAGE_PROGRESS.categoryBestScores,
      ...(value?.categoryBestScores ?? {}),
    },
  };
}

function updateStreak(progress: RewriteMessageProgress, now = Date.now()): Pick<RewriteMessageProgress, 'currentStreak' | 'longestStreak' | 'lastCompletedDate'> {
  const today = todayKey(now);
  if (progress.lastCompletedDate === today) {
    return {
      currentStreak: progress.currentStreak,
      longestStreak: progress.longestStreak,
      lastCompletedDate: progress.lastCompletedDate,
    };
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = todayKey(yesterday.getTime());
  const currentStreak = progress.lastCompletedDate === yesterdayKey ? progress.currentStreak + 1 : 1;
  return {
    currentStreak,
    longestStreak: Math.max(progress.longestStreak, currentStreak),
    lastCompletedDate: today,
  };
}

function includesAny(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some(term => lower.includes(term));
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreRewrite(text: string): RewriteMessageScore {
  const lower = text.toLowerCase();
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const feedback: string[] = [];

  let emotionalRegulation = 50;
  if (includesAny(lower, ['i feel', 'i felt', 'i noticed', 'i’m feeling', "i'm feeling"])) emotionalRegulation += 18;
  if (includesAny(lower, ['always', 'never', 'obviously', 'whatever', 'done with you', 'hate', 'pathetic', 'worthless'])) emotionalRegulation -= 28;
  if ((text.match(/!/g) ?? []).length > 1) emotionalRegulation -= 10;
  if (wordCount >= 8 && wordCount <= 55) emotionalRegulation += 12;
  if (wordCount > 90) emotionalRegulation -= 10;

  let validation = 40;
  if (includesAny(lower, ['i understand', 'i hear', 'i know', 'i get that', 'i can respect', 'i see that'])) validation += 28;
  if (includesAny(lower, ['because', 'when you can', 'when possible', 'if you are open'])) validation += 8;
  if (includesAny(lower, ['you obviously', 'you never', 'you always', 'you don’t care', "you don't care"])) validation -= 22;

  let effectiveness = 45;
  if (includesAny(lower, ['can you', 'could you', 'please', 'i need', 'i would like', 'i’d like', "i'd like"])) effectiveness += 24;
  if (includesAny(lower, ['when you can', 'later', 'talk', 'reschedule', 'clarify', 'update'])) effectiveness += 12;
  if (includesAny(lower, ['block', 'done', 'forget it', 'leave me alone', 'whatever'])) effectiveness -= 20;
  if (wordCount < 5) effectiveness -= 15;

  emotionalRegulation = clampScore(emotionalRegulation);
  validation = clampScore(validation);
  effectiveness = clampScore(effectiveness);
  const overall = clampScore((emotionalRegulation + validation + effectiveness) / 3);

  if (emotionalRegulation >= 75) feedback.push('You lowered the emotional heat and avoided attacking language.');
  else feedback.push('Try naming the feeling without words like always, never, obviously, or whatever.');

  if (validation >= 70) feedback.push('You made room for the other person’s side, which helps the message land.');
  else feedback.push('Add one sentence that shows you understand there may be another side.');

  if (effectiveness >= 70) feedback.push('You made a clear ask or next step.');
  else feedback.push('Add one specific request: clarify, reschedule, check in, or talk later.');

  return {
    emotionalRegulation,
    validation,
    effectiveness,
    overall,
    feedback,
  };
}

export async function getRewriteMessageProgress(): Promise<RewriteMessageProgress> {
  const stored = await storageService.get<Partial<RewriteMessageProgress>>(STORAGE_KEY);
  return normalizeProgress(stored);
}

export async function saveRewriteMessageAttempt(
  scenario: RewriteMessageScenario,
  userRewrite: string,
): Promise<{ progress: RewriteMessageProgress; attempt: RewriteMessageAttempt }> {
  const progress = await getRewriteMessageProgress();
  const score = scoreRewrite(userRewrite);
  const streak = updateStreak(progress);
  const attempt: RewriteMessageAttempt = {
    id: `rewrite_${Date.now()}`,
    scenarioId: scenario.id,
    category: scenario.category,
    userRewrite,
    score,
    createdAt: Date.now(),
  };
  const bestForScenario = Math.max(progress.bestScoreByScenario[scenario.id] ?? 0, score.overall);
  const bestForCategory = Math.max(progress.categoryBestScores[scenario.category] ?? 0, score.overall);
  const next: RewriteMessageProgress = {
    ...progress,
    attempts: [attempt, ...progress.attempts].slice(0, 100),
    bestScoreByScenario: {
      ...progress.bestScoreByScenario,
      [scenario.id]: bestForScenario,
    },
    categoryAttempts: {
      ...progress.categoryAttempts,
      [scenario.category]: progress.categoryAttempts[scenario.category] + 1,
    },
    categoryBestScores: {
      ...progress.categoryBestScores,
      [scenario.category]: bestForCategory,
    },
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastCompletedDate: streak.lastCompletedDate,
  };
  await storageService.set(STORAGE_KEY, next);
  return { progress: next, attempt };
}
