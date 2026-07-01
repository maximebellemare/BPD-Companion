import { storageService } from '@/services/storage/storageService';

export type DistortionDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type CognitiveDistortion =
  | 'mind_reading'
  | 'catastrophizing'
  | 'black_white'
  | 'emotional_reasoning';

export interface SpotDistortionExample {
  id: string;
  difficulty: DistortionDifficulty;
  scenario: string;
  thought: string;
  answer: CognitiveDistortion;
  explanation: string;
}

export interface SpotDistortionProgress {
  completedExampleIds: string[];
  correctExampleIds: string[];
  attemptsByExample: Record<string, number>;
  correctByDistortion: Record<CognitiveDistortion, number>;
  attemptsByDistortion: Record<CognitiveDistortion, number>;
  difficultyCompletions: Record<DistortionDifficulty, number>;
  masteredDistortions: CognitiveDistortion[];
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  totalAttempts: number;
  totalCorrect: number;
}

const STORAGE_KEY = 'bpd_companion_spot_distortion_progress';

export const DISTORTION_LABELS: Record<CognitiveDistortion, string> = {
  mind_reading: 'Mind reading',
  catastrophizing: 'Catastrophizing',
  black_white: 'Black-and-white thinking',
  emotional_reasoning: 'Emotional reasoning',
};

export const DISTORTION_DESCRIPTIONS: Record<CognitiveDistortion, string> = {
  mind_reading: 'Assuming you know what someone thinks or feels without enough evidence.',
  catastrophizing: 'Jumping from a painful moment to the worst possible outcome.',
  black_white: 'Seeing the situation as all good or all bad, with no middle ground.',
  emotional_reasoning: 'Treating a strong feeling as proof that something is true.',
};

export const DISTORTION_DIFFICULTY_LABELS: Record<DistortionDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const DEFAULT_SPOT_DISTORTION_PROGRESS: SpotDistortionProgress = {
  completedExampleIds: [],
  correctExampleIds: [],
  attemptsByExample: {},
  correctByDistortion: {
    mind_reading: 0,
    catastrophizing: 0,
    black_white: 0,
    emotional_reasoning: 0,
  },
  attemptsByDistortion: {
    mind_reading: 0,
    catastrophizing: 0,
    black_white: 0,
    emotional_reasoning: 0,
  },
  difficultyCompletions: {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  },
  masteredDistortions: [],
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  totalAttempts: 0,
  totalCorrect: 0,
};

const OPTIONS = Object.keys(DISTORTION_LABELS) as CognitiveDistortion[];

const SCENARIO_BANK: Record<DistortionDifficulty, string[]> = {
  beginner: [
    "She hasn't answered.",
    'Your partner says they need space tonight.',
    'A friend cancels plans because they are tired.',
    'Someone replies with “ok.”',
    'Your therapist reschedules your appointment.',
    'A coworker does not smile back.',
    'Your parent sounds distracted on the phone.',
    'Your partner likes someone else’s post.',
    'A friend takes longer than usual to respond.',
    'Someone forgets to invite you to a small hangout.',
    'You make a mistake in a conversation.',
    'Your partner goes quiet after a disagreement.',
    'A message is left on read.',
  ],
  intermediate: [
    'Your partner is online but has not replied.',
    'A close friend says they cannot talk tonight.',
    'Someone you care about uses a colder tone than usual.',
    'You see your ex posting with someone new.',
    'Your family member disagrees with a boundary.',
    'A group chat keeps going without you.',
    'Your partner says “we should talk later.”',
    'A friend gives short answers all afternoon.',
    'Your therapist asks a difficult question.',
    'A coworker gives you feedback in front of others.',
    'Someone says they need time to think.',
    'You notice a change in someone’s texting style.',
    'You feel intense shame after conflict.',
  ],
  advanced: [
    'After an argument, your partner asks for a day to cool off.',
    'Your parent criticizes your boundary and says you are being dramatic.',
    'Your friend supports you but also says they felt hurt.',
    'Your partner misses a call during a stressful evening.',
    'Your ex does not respond to a closure message.',
    'A trusted person gives mixed signals after a vulnerable conversation.',
    'A therapist names a pattern you were not ready to hear.',
    'A friend sets a limit around late-night crisis texting.',
    'Your partner seems warm one day and distant the next.',
    'You see signs that someone is busy, but the silence still hurts.',
    'A disagreement ends without a clear repair.',
    'Someone you love says they care but cannot reassure you all night.',
    'You feel rejected even after someone explains they are overwhelmed.',
  ],
};

const THOUGHT_TEMPLATES: Record<CognitiveDistortion, string[]> = {
  mind_reading: [
    'They must hate me.',
    'They are definitely tired of me.',
    'They think I am too much.',
    'They secretly regret knowing me.',
    'They are trying to make me feel unwanted.',
    'They do not care about me anymore.',
    'They are judging me right now.',
    'They probably wish I would disappear.',
    'They are ignoring me on purpose.',
    'They think I ruined everything.',
    'They are choosing someone better.',
    'They must be planning to leave.',
    'They see me as a problem.',
  ],
  catastrophizing: [
    'This means the relationship is over.',
    'Everything is about to fall apart.',
    'I will never recover from this.',
    'This is going to ruin everything.',
    'No one will ever stay with me.',
    'This will turn into a huge fight.',
    'I am going to lose everyone.',
    'There is no coming back from this.',
    'This one moment proves everything is doomed.',
    'I will be alone forever.',
    'This will destroy the connection.',
    'I will spiral all night and never calm down.',
    'The whole day is ruined now.',
  ],
  black_white: [
    'If they cared, they would answer right away.',
    'Either they love me fully or they do not love me at all.',
    'If I made one mistake, I ruined everything.',
    'This relationship is either perfect or pointless.',
    'If they need space, I mean nothing to them.',
    'If they are upset, I am completely bad.',
    'A real friend would never disappoint me.',
    'If I feel rejected, the relationship is fake.',
    'If they cannot reassure me now, they never will.',
    'One cold message means they never cared.',
    'If I am not their first priority, I am nothing.',
    'Either I fix this now or it is over.',
    'If this hurts, it must be completely unsafe.',
  ],
  emotional_reasoning: [
    'I feel unwanted, so I must be unwanted.',
    'I feel abandoned, so they must be abandoning me.',
    'I feel guilty, so I must have done something terrible.',
    'I feel scared, so something bad is definitely happening.',
    'I feel rejected, so I was rejected.',
    'I feel ashamed, so I am a bad person.',
    'I feel unsafe, so this person is unsafe.',
    'I feel replaceable, so I must have been replaced.',
    'I feel ignored, so I do not matter.',
    'I feel panicked, so I need to act now.',
    'I feel empty, so nothing matters.',
    'I feel angry, so they must have meant to hurt me.',
    'I feel alone, so nobody cares.',
  ],
};

function createExplanation(answer: CognitiveDistortion, thought: string): string {
  switch (answer) {
    case 'mind_reading':
      return `"${thought}" assumes what someone thinks or feels without enough evidence. A steadier move is to separate what happened from what you are guessing.`;
    case 'catastrophizing':
      return `"${thought}" jumps from one painful cue to a worst-case future. The skill is to notice the feared outcome without treating it as certain.`;
    case 'black_white':
      return `"${thought}" turns the situation into all-or-nothing. Real relationships usually have more middle ground than the thought allows.`;
    case 'emotional_reasoning':
      return `"${thought}" treats a strong feeling as proof. The feeling matters, but it is not the same thing as evidence.`;
  }
}

function buildExamplesForDifficulty(difficulty: DistortionDifficulty): SpotDistortionExample[] {
  const scenarios = SCENARIO_BANK[difficulty];
  const examples: SpotDistortionExample[] = [];

  scenarios.forEach((scenario, scenarioIndex) => {
    OPTIONS.forEach((distortion, distortionIndex) => {
      const thought = THOUGHT_TEMPLATES[distortion][(scenarioIndex + distortionIndex) % THOUGHT_TEMPLATES[distortion].length];
      examples.push({
        id: `${difficulty}_${scenarioIndex}_${distortion}`,
        difficulty,
        scenario,
        thought,
        answer: distortion,
        explanation: createExplanation(distortion, thought),
      });
    });
  });

  return examples;
}

export const SPOT_DISTORTION_EXAMPLES: SpotDistortionExample[] = [
  ...buildExamplesForDifficulty('beginner'),
  ...buildExamplesForDifficulty('intermediate'),
  ...buildExamplesForDifficulty('advanced'),
];

function todayKey(now = Date.now()): string {
  const date = new Date(now);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function normalizeProgress(value: Partial<SpotDistortionProgress> | null | undefined): SpotDistortionProgress {
  return {
    ...DEFAULT_SPOT_DISTORTION_PROGRESS,
    ...(value ?? {}),
    attemptsByExample: value?.attemptsByExample ?? {},
    correctByDistortion: {
      ...DEFAULT_SPOT_DISTORTION_PROGRESS.correctByDistortion,
      ...(value?.correctByDistortion ?? {}),
    },
    attemptsByDistortion: {
      ...DEFAULT_SPOT_DISTORTION_PROGRESS.attemptsByDistortion,
      ...(value?.attemptsByDistortion ?? {}),
    },
    difficultyCompletions: {
      ...DEFAULT_SPOT_DISTORTION_PROGRESS.difficultyCompletions,
      ...(value?.difficultyCompletions ?? {}),
    },
    masteredDistortions: value?.masteredDistortions ?? [],
  };
}

function updateStreak(progress: SpotDistortionProgress, now = Date.now()): Pick<SpotDistortionProgress, 'currentStreak' | 'longestStreak' | 'lastCompletedDate'> {
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

function getMasteredDistortions(progress: SpotDistortionProgress): CognitiveDistortion[] {
  return OPTIONS.filter(distortion => {
    const attempts = progress.attemptsByDistortion[distortion] ?? 0;
    const correct = progress.correctByDistortion[distortion] ?? 0;
    return attempts >= 5 && correct / attempts >= 0.8;
  });
}

export async function getSpotDistortionProgress(): Promise<SpotDistortionProgress> {
  const stored = await storageService.get<Partial<SpotDistortionProgress>>(STORAGE_KEY);
  return normalizeProgress(stored);
}

export async function submitSpotDistortionAnswer(
  example: SpotDistortionExample,
  selected: CognitiveDistortion,
): Promise<{ progress: SpotDistortionProgress; correct: boolean }> {
  const progress = await getSpotDistortionProgress();
  const correct = selected === example.answer;
  const alreadyCompleted = progress.completedExampleIds.includes(example.id);
  const streak = alreadyCompleted ? {
    currentStreak: progress.currentStreak,
    longestStreak: progress.longestStreak,
    lastCompletedDate: progress.lastCompletedDate,
  } : updateStreak(progress);

  const next: SpotDistortionProgress = {
    ...progress,
    completedExampleIds: alreadyCompleted
      ? progress.completedExampleIds
      : [...progress.completedExampleIds, example.id],
    correctExampleIds: correct && !progress.correctExampleIds.includes(example.id)
      ? [...progress.correctExampleIds, example.id]
      : progress.correctExampleIds,
    attemptsByExample: {
      ...progress.attemptsByExample,
      [example.id]: (progress.attemptsByExample[example.id] ?? 0) + 1,
    },
    correctByDistortion: {
      ...progress.correctByDistortion,
      [example.answer]: progress.correctByDistortion[example.answer] + (correct ? 1 : 0),
    },
    attemptsByDistortion: {
      ...progress.attemptsByDistortion,
      [example.answer]: progress.attemptsByDistortion[example.answer] + 1,
    },
    difficultyCompletions: {
      ...progress.difficultyCompletions,
      [example.difficulty]: alreadyCompleted
        ? progress.difficultyCompletions[example.difficulty]
        : progress.difficultyCompletions[example.difficulty] + 1,
    },
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastCompletedDate: streak.lastCompletedDate,
    totalAttempts: progress.totalAttempts + 1,
    totalCorrect: progress.totalCorrect + (correct ? 1 : 0),
  };

  next.masteredDistortions = getMasteredDistortions(next);
  await storageService.set(STORAGE_KEY, next);
  return { progress: next, correct };
}
