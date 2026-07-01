import { storageService } from '@/services/storage/storageService';

export type EmotionalDetectiveDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type EmotionalDetectiveStep = 'trigger' | 'emotion' | 'fear' | 'urge' | 'action';

export interface EmotionalDetectiveChoice {
  id: string;
  text: string;
}

export interface EmotionalDetectiveScenario {
  id: string;
  difficulty: EmotionalDetectiveDifficulty;
  scenario: string;
  context: string;
  choices: Record<EmotionalDetectiveStep, EmotionalDetectiveChoice[]>;
  answers: Record<EmotionalDetectiveStep, string>;
  acceptableAnswers?: Partial<Record<EmotionalDetectiveStep, string[]>>;
  emotionAwareness: {
    primaryEmotion: string;
    otherCommonEmotions: string[];
    why: string;
  };
  reveal: {
    trigger: string;
    emotion: string;
    fear: string;
    urge: string;
    action: string;
    outcome: string;
  };
  lesson: string;
}

export interface EmotionalDetectiveAttemptResult {
  scenarioId: string;
  correctSteps: EmotionalDetectiveStep[];
  incorrectSteps: EmotionalDetectiveStep[];
  accuracy: number;
  completedAt: number;
}

export interface EmotionalDetectiveProgress {
  completedScenarioIds: string[];
  bestAccuracyByScenario: Record<string, number>;
  attemptsByScenario: Record<string, number>;
  difficultyCompletions: Record<EmotionalDetectiveDifficulty, number>;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
  totalAttempts: number;
  totalCorrectSteps: number;
  totalAnsweredSteps: number;
}

const STORAGE_KEY = 'bpd_companion_emotional_detective_progress';

export const DETECTIVE_STEP_LABELS: Record<EmotionalDetectiveStep, string> = {
  trigger: 'Trigger',
  emotion: 'Emotion',
  fear: 'Fear',
  urge: 'Urge',
  action: 'Action',
};

export const DETECTIVE_DIFFICULTY_LABELS: Record<EmotionalDetectiveDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const DEFAULT_EMOTIONAL_DETECTIVE_PROGRESS: EmotionalDetectiveProgress = {
  completedScenarioIds: [],
  bestAccuracyByScenario: {},
  attemptsByScenario: {},
  difficultyCompletions: {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
  },
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
  totalAttempts: 0,
  totalCorrectSteps: 0,
  totalAnsweredSteps: 0,
};

const commonChoices = {
  emotions: [
    { id: 'anxiety', text: 'Anxiety' },
    { id: 'anger', text: 'Anger' },
    { id: 'shame', text: 'Shame' },
    { id: 'sadness', text: 'Sadness' },
    { id: 'emptiness', text: 'Emptiness' },
    { id: 'jealousy', text: 'Jealousy' },
    { id: 'guilt', text: 'Guilt' },
  ],
  fears: [
    { id: 'abandonment', text: 'They will leave me' },
    { id: 'rejection', text: 'I am unwanted' },
    { id: 'not_enough', text: 'I am not enough' },
    { id: 'loss_control', text: 'I am losing control' },
    { id: 'being_bad', text: 'I am a bad person' },
    { id: 'being_ignored', text: 'I do not matter' },
  ],
  urges: [
    { id: 'text_again', text: 'Text again' },
    { id: 'accuse', text: 'Accuse them' },
    { id: 'withdraw', text: 'Withdraw' },
    { id: 'apologize_too_much', text: 'Apologize too much' },
    { id: 'check_social', text: 'Check social media' },
    { id: 'argue', text: 'Argue or prove the point' },
  ],
};

export const EMOTIONAL_DETECTIVE_SCENARIOS: EmotionalDetectiveScenario[] = [
  {
    id: 'beginner_partner_no_answer',
    difficulty: 'beginner',
    scenario: "My partner hasn't answered for 6 hours.",
    context: 'You sent a caring message earlier. They usually reply faster, and now your mind is racing.',
    choices: {
      trigger: [
        { id: 'no_reply', text: 'No reply for several hours' },
        { id: 'criticism', text: 'Someone criticized you' },
        { id: 'money', text: 'A money problem came up' },
      ],
      emotion: [
        { id: 'anxiety', text: 'Anxiety' },
        { id: 'anger', text: 'Anger' },
        { id: 'shame', text: 'Shame' },
        { id: 'sadness', text: 'Sadness' },
      ],
      fear: commonChoices.fears.slice(0, 3),
      urge: [
        { id: 'text_again', text: 'Text again for reassurance' },
        { id: 'go_sleep', text: 'Go to sleep calmly' },
        { id: 'ask_friend', text: 'Ask a friend what to cook' },
      ],
      action: [
        { id: 'send_many', text: 'Send several more messages' },
        { id: 'pause', text: 'Pause and wait before responding' },
        { id: 'joke', text: 'Send a joke unrelated to it' },
      ],
    },
    answers: {
      trigger: 'no_reply',
      emotion: 'anxiety',
      fear: 'abandonment',
      urge: 'text_again',
      action: 'send_many',
    },
    acceptableAnswers: {
      emotion: ['anxiety', 'anger', 'shame', 'sadness'],
    },
    emotionAwareness: {
      primaryEmotion: 'Anxiety',
      otherCommonEmotions: ['Anger', 'Shame', 'Sadness'],
      why: 'Anxiety is primary because the unknown reply is creating urgency and a need for certainty. Anger, shame, or sadness can also show up when the fear starts feeling personal.',
    },
    reveal: {
      trigger: 'No reply for 6 hours',
      emotion: 'Anxiety',
      fear: 'They might be pulling away',
      urge: 'Text again to get certainty',
      action: 'Send several messages',
      outcome: 'Short relief, then more anxiety or regret',
    },
    lesson: 'The trigger is uncertainty. The emotion wants certainty fast, but acting from the urge can make the fear louder.',
  },
  {
    id: 'beginner_friend_cancels',
    difficulty: 'beginner',
    scenario: 'A friend cancels plans at the last minute.',
    context: 'They say they are tired, but you immediately feel like you were not important enough.',
    choices: {
      trigger: [
        { id: 'cancelled_plans', text: 'Cancelled plans' },
        { id: 'loud_noise', text: 'A loud noise' },
        { id: 'work_deadline', text: 'A work deadline' },
      ],
      emotion: [
        { id: 'sadness', text: 'Sadness' },
        { id: 'anxiety', text: 'Anxiety' },
        { id: 'anger', text: 'Anger' },
        { id: 'shame', text: 'Shame' },
      ],
      fear: [
        { id: 'rejection', text: 'I am unwanted' },
        { id: 'being_late', text: 'I will be late' },
        { id: 'too_busy', text: 'I have too much to do' },
      ],
      urge: [
        { id: 'withdraw', text: 'Withdraw and stop inviting them' },
        { id: 'make_tea', text: 'Make tea' },
        { id: 'celebrate', text: 'Celebrate' },
      ],
      action: [
        { id: 'cold_reply', text: 'Reply coldly or disappear' },
        { id: 'ask_reschedule', text: 'Ask warmly to reschedule' },
        { id: 'ignore_forever', text: 'Never speak to them again' },
      ],
    },
    answers: {
      trigger: 'cancelled_plans',
      emotion: 'sadness',
      fear: 'rejection',
      urge: 'withdraw',
      action: 'cold_reply',
    },
    acceptableAnswers: {
      emotion: ['sadness', 'anxiety', 'anger', 'shame'],
    },
    emotionAwareness: {
      primaryEmotion: 'Sadness',
      otherCommonEmotions: ['Anxiety', 'Anger', 'Shame'],
      why: 'Sadness is primary because the loss of expected connection hurts. Anxiety may ask what it means, anger may protect the hurt, and shame may turn it inward.',
    },
    reveal: {
      trigger: 'Cancelled plans',
      emotion: 'Sadness',
      fear: 'I am not wanted',
      urge: 'Pull away first',
      action: 'Reply coldly or disappear',
      outcome: 'Less vulnerability, but more distance',
    },
    lesson: 'Rejection pain often pushes for protection. The action may reduce vulnerability, but it can also create the distance you feared.',
  },
  {
    id: 'intermediate_tone_change',
    difficulty: 'intermediate',
    scenario: 'Someone you care about replies with a colder tone than usual.',
    context: 'The message is short: “ok.” You reread it five times and feel heat in your chest.',
    choices: {
      trigger: [
        { id: 'tone_change', text: 'A sudden tone change' },
        { id: 'good_news', text: 'Good news' },
        { id: 'missing_keys', text: 'Missing keys' },
      ],
      emotion: [
        { id: 'anger', text: 'Anger' },
        { id: 'anxiety', text: 'Anxiety' },
        { id: 'shame', text: 'Shame' },
        { id: 'sadness', text: 'Sadness' },
      ],
      fear: [
        { id: 'being_ignored', text: 'I do not matter' },
        { id: 'success', text: 'I will succeed' },
        { id: 'rest', text: 'I need rest' },
      ],
      urge: [
        { id: 'accuse', text: 'Accuse them of being rude' },
        { id: 'hydrate', text: 'Drink water' },
        { id: 'compliment', text: 'Compliment them' },
      ],
      action: [
        { id: 'send_long_proof', text: 'Send a long message proving they hurt you' },
        { id: 'ask_gently', text: 'Ask gently if something is off' },
        { id: 'do_nothing_forever', text: 'Never bring it up' },
      ],
    },
    answers: {
      trigger: 'tone_change',
      emotion: 'anger',
      fear: 'being_ignored',
      urge: 'accuse',
      action: 'send_long_proof',
    },
    acceptableAnswers: {
      emotion: ['anger', 'anxiety', 'shame', 'sadness'],
    },
    emotionAwareness: {
      primaryEmotion: 'Anger',
      otherCommonEmotions: ['Anxiety', 'Shame', 'Sadness'],
      why: 'Anger is primary because the body is mobilizing to defend against a perceived slight. Anxiety, shame, or sadness can be underneath when tone feels like disconnection.',
    },
    reveal: {
      trigger: 'Cold or unclear tone',
      emotion: 'Anger',
      fear: 'I do not matter',
      urge: 'Accuse or prove the hurt',
      action: 'Send a long defensive message',
      outcome: 'The other person may defend themselves instead of understanding the hurt',
    },
    lesson: 'Anger can be the protector of hurt. The key is catching the fear underneath before the action becomes an attack.',
  },
  {
    id: 'intermediate_social_media_ex',
    difficulty: 'intermediate',
    scenario: 'You see your ex liked someone else’s photo.',
    context: 'You were feeling okay, then suddenly feel replaceable and want to check everything.',
    choices: {
      trigger: [
        { id: 'ex_social_media', text: 'Seeing your ex interact online' },
        { id: 'sunny_weather', text: 'Sunny weather' },
        { id: 'laundry', text: 'Laundry' },
      ],
      emotion: [
        { id: 'jealousy', text: 'Jealousy' },
        { id: 'sadness', text: 'Sadness' },
        { id: 'anger', text: 'Anger' },
        { id: 'shame', text: 'Shame' },
      ],
      fear: [
        { id: 'replaced', text: 'I was replaceable' },
        { id: 'hungry', text: 'I am hungry' },
        { id: 'too_much_sleep', text: 'I slept too much' },
      ],
      urge: [
        { id: 'check_social', text: 'Check their profile repeatedly' },
        { id: 'stretch', text: 'Stretch calmly' },
        { id: 'cook', text: 'Cook dinner' },
      ],
      action: [
        { id: 'spiral_checking', text: 'Keep checking for more clues' },
        { id: 'app_limit', text: 'Close the app and ground first' },
        { id: 'message_friend', text: 'Message a friend for a neutral distraction' },
      ],
    },
    answers: {
      trigger: 'ex_social_media',
      emotion: 'jealousy',
      fear: 'replaced',
      urge: 'check_social',
      action: 'spiral_checking',
    },
    acceptableAnswers: {
      emotion: ['jealousy', 'sadness', 'anger', 'shame'],
    },
    emotionAwareness: {
      primaryEmotion: 'Jealousy',
      otherCommonEmotions: ['Sadness', 'Anger', 'Shame'],
      why: 'Jealousy is primary because the cue points to comparison and replaceability. Sadness, anger, and shame are also common when the mind turns comparison into a threat.',
    },
    reveal: {
      trigger: 'Seeing an ex interact online',
      emotion: 'Jealousy',
      fear: 'I was replaceable',
      urge: 'Search for more proof',
      action: 'Keep checking social media',
      outcome: 'More clues, more pain, less certainty',
    },
    lesson: 'Checking feels like it will create certainty, but it usually creates more material for the fear to use.',
  },
  {
    id: 'advanced_after_conflict',
    difficulty: 'advanced',
    scenario: 'After an argument, you replay one sentence you said and feel awful.',
    context: 'You already apologized once. Now shame is telling you that you ruined everything.',
    choices: {
      trigger: [
        { id: 'post_conflict_replay', text: 'Replaying something said after conflict' },
        { id: 'appointment', text: 'An appointment reminder' },
        { id: 'new_song', text: 'A new song' },
      ],
      emotion: [
        { id: 'shame', text: 'Shame' },
        { id: 'guilt', text: 'Guilt' },
        { id: 'anxiety', text: 'Anxiety' },
        { id: 'sadness', text: 'Sadness' },
      ],
      fear: [
        { id: 'being_bad', text: 'I am bad or too much' },
        { id: 'weather', text: 'It might rain' },
        { id: 'busy_day', text: 'Tomorrow is busy' },
      ],
      urge: [
        { id: 'apologize_too_much', text: 'Apologize repeatedly for relief' },
        { id: 'plan_trip', text: 'Plan a trip' },
        { id: 'clean_room', text: 'Clean your room' },
      ],
      action: [
        { id: 'send_many_apologies', text: 'Send multiple apologetic messages' },
        { id: 'repair_once', text: 'Make one clear repair and stop repeating it' },
        { id: 'pretend_nothing', text: 'Pretend nothing happened' },
      ],
    },
    answers: {
      trigger: 'post_conflict_replay',
      emotion: 'shame',
      fear: 'being_bad',
      urge: 'apologize_too_much',
      action: 'send_many_apologies',
    },
    acceptableAnswers: {
      emotion: ['shame', 'guilt', 'anxiety', 'sadness'],
    },
    emotionAwareness: {
      primaryEmotion: 'Shame',
      otherCommonEmotions: ['Guilt', 'Anxiety', 'Sadness'],
      why: 'Shame is primary because the thought is about being bad or too much. Guilt, anxiety, and sadness can also be present when repair matters and the relationship feels at risk.',
    },
    reveal: {
      trigger: 'Replaying conflict',
      emotion: 'Shame',
      fear: 'I am bad or too much',
      urge: 'Apologize until the fear goes away',
      action: 'Send repeated apologies',
      outcome: 'Temporary relief, then more dependence on their response',
    },
    lesson: 'Advanced emotional detective work separates repair from reassurance seeking. One honest repair is different from chasing certainty.',
  },
  {
    id: 'advanced_boundary_push',
    difficulty: 'advanced',
    scenario: 'A family member keeps pushing a boundary after you said no.',
    context: 'You feel guilty and angry at the same time. Part of you wants to give in so the tension stops.',
    choices: {
      trigger: [
        { id: 'boundary_pushed', text: 'A boundary being pushed' },
        { id: 'quiet_room', text: 'A quiet room' },
        { id: 'finished_task', text: 'A finished task' },
      ],
      emotion: [
        { id: 'anger', text: 'Anger mixed with guilt' },
        { id: 'guilt', text: 'Guilt' },
        { id: 'anxiety', text: 'Anxiety' },
        { id: 'shame', text: 'Shame' },
      ],
      fear: [
        { id: 'being_bad', text: 'I am selfish or bad for saying no' },
        { id: 'winning', text: 'I might win' },
        { id: 'sleep', text: 'I might sleep well' },
      ],
      urge: [
        { id: 'give_in', text: 'Give in to stop the guilt' },
        { id: 'celebrate', text: 'Celebrate immediately' },
        { id: 'ignore_values', text: 'Ignore what matters' },
      ],
      action: [
        { id: 'drop_boundary', text: 'Drop the boundary and resent it later' },
        { id: 'repeat_boundary', text: 'Repeat the boundary once, calmly' },
        { id: 'attack', text: 'Attack their character' },
      ],
    },
    answers: {
      trigger: 'boundary_pushed',
      emotion: 'anger',
      fear: 'being_bad',
      urge: 'give_in',
      action: 'drop_boundary',
    },
    acceptableAnswers: {
      emotion: ['anger', 'guilt', 'anxiety', 'shame'],
    },
    emotionAwareness: {
      primaryEmotion: 'Anger',
      otherCommonEmotions: ['Guilt', 'Anxiety', 'Shame'],
      why: 'Anger is primary because a boundary is being crossed. Guilt, anxiety, and shame are also common when saying no feels like disappointing someone.',
    },
    reveal: {
      trigger: 'Boundary being pushed',
      emotion: 'Anger and guilt',
      fear: 'I am bad if I disappoint them',
      urge: 'Give in so the tension stops',
      action: 'Drop the boundary',
      outcome: 'Immediate peace, later resentment or self-abandonment',
    },
    lesson: 'Some spirals look like peace at first. The outcome tells you whether the action protected your long-term self.',
  },
];

function todayKey(now = Date.now()): string {
  const date = new Date(now);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function mergeProgress(value: Partial<EmotionalDetectiveProgress> | null | undefined): EmotionalDetectiveProgress {
  return {
    ...DEFAULT_EMOTIONAL_DETECTIVE_PROGRESS,
    ...(value ?? {}),
    bestAccuracyByScenario: value?.bestAccuracyByScenario ?? {},
    attemptsByScenario: value?.attemptsByScenario ?? {},
    difficultyCompletions: {
      ...DEFAULT_EMOTIONAL_DETECTIVE_PROGRESS.difficultyCompletions,
      ...(value?.difficultyCompletions ?? {}),
    },
  };
}

function updateStreak(progress: EmotionalDetectiveProgress, now = Date.now()): Pick<EmotionalDetectiveProgress, 'currentStreak' | 'longestStreak' | 'lastCompletedDate'> {
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

export async function getEmotionalDetectiveProgress(): Promise<EmotionalDetectiveProgress> {
  const stored = await storageService.get<Partial<EmotionalDetectiveProgress>>(STORAGE_KEY);
  return mergeProgress(stored);
}

export async function saveEmotionalDetectiveProgress(progress: EmotionalDetectiveProgress): Promise<void> {
  await storageService.set(STORAGE_KEY, progress);
}

export async function submitEmotionalDetectiveAttempt(
  scenario: EmotionalDetectiveScenario,
  selections: Record<EmotionalDetectiveStep, string | null>,
): Promise<{ progress: EmotionalDetectiveProgress; result: EmotionalDetectiveAttemptResult }> {
  const progress = await getEmotionalDetectiveProgress();
  const steps = Object.keys(DETECTIVE_STEP_LABELS) as EmotionalDetectiveStep[];
  const isAccepted = (step: EmotionalDetectiveStep): boolean => {
    const accepted = scenario.acceptableAnswers?.[step] ?? [scenario.answers[step]];
    const selected = selections[step];
    return selected !== null && accepted.includes(selected);
  };
  const correctSteps = steps.filter(isAccepted);
  const incorrectSteps = steps.filter(step => !isAccepted(step));
  const accuracy = Math.round((correctSteps.length / steps.length) * 100);
  const alreadyCompleted = progress.completedScenarioIds.includes(scenario.id);
  const streak = alreadyCompleted ? {
    currentStreak: progress.currentStreak,
    longestStreak: progress.longestStreak,
    lastCompletedDate: progress.lastCompletedDate,
  } : updateStreak(progress);

  const nextProgress: EmotionalDetectiveProgress = {
    ...progress,
    completedScenarioIds: alreadyCompleted
      ? progress.completedScenarioIds
      : [...progress.completedScenarioIds, scenario.id],
    bestAccuracyByScenario: {
      ...progress.bestAccuracyByScenario,
      [scenario.id]: Math.max(progress.bestAccuracyByScenario[scenario.id] ?? 0, accuracy),
    },
    attemptsByScenario: {
      ...progress.attemptsByScenario,
      [scenario.id]: (progress.attemptsByScenario[scenario.id] ?? 0) + 1,
    },
    difficultyCompletions: {
      ...progress.difficultyCompletions,
      [scenario.difficulty]: alreadyCompleted
        ? progress.difficultyCompletions[scenario.difficulty]
        : progress.difficultyCompletions[scenario.difficulty] + 1,
    },
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastCompletedDate: streak.lastCompletedDate,
    totalAttempts: progress.totalAttempts + 1,
    totalCorrectSteps: progress.totalCorrectSteps + correctSteps.length,
    totalAnsweredSteps: progress.totalAnsweredSteps + steps.length,
  };

  await saveEmotionalDetectiveProgress(nextProgress);

  return {
    progress: nextProgress,
    result: {
      scenarioId: scenario.id,
      correctSteps,
      incorrectSteps,
      accuracy,
      completedAt: Date.now(),
    },
  };
}
