import { storageService } from '@/services/storage/storageService';

export type BPDAcademySection = 'dbt' | 'act' | 'cbt' | 'bpd_specific';

export interface BPDAcademyLesson {
  id: string;
  section: BPDAcademySection;
  topic: string;
  title: string;
  subtitle: string;
  durationMinutes: number;
  explain: string;
  example: string;
  application: string;
  miniExercise: string;
}

export interface BPDAcademyProgress {
  completedLessonIds: string[];
  completedAtByLesson: Record<string, number>;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}

const STORAGE_KEY = 'bpd_companion_bpd_academy_progress';

export const BPD_ACADEMY_SECTION_LABELS: Record<BPDAcademySection, string> = {
  dbt: 'DBT',
  act: 'ACT',
  cbt: 'CBT',
  bpd_specific: 'BPD-specific',
};

export const BPD_ACADEMY_SECTION_DESCRIPTIONS: Record<BPDAcademySection, string> = {
  dbt: 'Skills for regulation, distress, and relationships.',
  act: 'Practice making room for feelings while choosing your values.',
  cbt: 'Learn to spot thoughts that turn pain into panic.',
  bpd_specific: 'Tiny lessons for common BPD patterns and moments.',
};

export const DEFAULT_BPD_ACADEMY_PROGRESS: BPDAcademyProgress = {
  completedLessonIds: [],
  completedAtByLesson: {},
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
};

export const BPD_ACADEMY_LESSONS: BPDAcademyLesson[] = [
  {
    id: 'dbt_mindfulness',
    section: 'dbt',
    topic: 'mindfulness',
    title: 'Notice before reacting',
    subtitle: 'A 2-minute pause that helps you see what is happening.',
    durationMinutes: 2,
    explain: 'Mindfulness is the practice of noticing your current experience without immediately obeying it. The goal is not to become calm on command. The goal is to create a small space between feeling and action.',
    example: 'You see a short reply and your body says, "Something is wrong." Mindfulness sounds like: "I am noticing fear. I am noticing the urge to text again."',
    application: 'Use this when a feeling arrives fast and asks you to act fast. Name the emotion, name the urge, then wait one breath before choosing.',
    miniExercise: 'For 60 seconds, name three things: what you feel in your body, what emotion is present, and what urge is asking for attention.',
  },
  {
    id: 'dbt_emotion_regulation',
    section: 'dbt',
    topic: 'emotion regulation',
    title: 'Lower the heat',
    subtitle: 'Work with an emotion instead of being dragged by it.',
    durationMinutes: 3,
    explain: 'Emotion regulation means understanding what your emotion is trying to signal and choosing a response that protects your future self.',
    example: 'Anger may be signaling hurt or fear. It may be valid that something mattered, while still not being safe to send the sharpest message.',
    application: 'Ask: What emotion is here? What does it want me to do? What action will I respect tomorrow?',
    miniExercise: 'Write one sentence: "This emotion wants me to ____. My steadier choice is ____."',
  },
  {
    id: 'dbt_distress_tolerance',
    section: 'dbt',
    topic: 'distress tolerance',
    title: 'Survive the wave',
    subtitle: 'Get through the peak without making it worse.',
    durationMinutes: 2,
    explain: 'Distress tolerance is for moments when you cannot solve the problem right now, but you can reduce the chance of regret.',
    example: 'You feel abandoned and want certainty immediately. Distress tolerance helps you survive the next few minutes without escalating.',
    application: 'Use a short body-based action first: cold water, paced breathing, grounding, or stepping away from the phone.',
    miniExercise: 'Set a 2-minute timer. Breathe out longer than you breathe in. Do not decide anything important until the timer ends.',
  },
  {
    id: 'dbt_interpersonal_effectiveness',
    section: 'dbt',
    topic: 'interpersonal effectiveness',
    title: 'Ask without attacking',
    subtitle: 'Say what matters while protecting the connection.',
    durationMinutes: 4,
    explain: 'Interpersonal effectiveness is the skill of asking for what you need clearly, while reducing blame, threats, or mind reading.',
    example: 'Instead of "You never care about me," a steadier version is "I felt anxious when I did not hear back. Can we talk tonight?"',
    application: 'Before sending, check whether the message has a clear ask, a feeling statement, and no accusation.',
    miniExercise: 'Rewrite one sentence using: "I felt __ when __. Could we __?"',
  },
  {
    id: 'act_acceptance',
    section: 'act',
    topic: 'acceptance',
    title: 'Make room for the feeling',
    subtitle: 'Acceptance is not approval. It is stopping the fight with reality.',
    durationMinutes: 3,
    explain: 'Acceptance means allowing a feeling to be present without spending all your energy trying to erase it immediately.',
    example: 'You can accept "I feel rejected right now" without accepting the story "I am unlovable."',
    application: 'When a feeling is here, soften the fight around it: "This is painful, and I can make room for it for one minute."',
    miniExercise: 'Place a hand where you feel tension and say: "This feeling is here. I do not have to like it to let it pass through."',
  },
  {
    id: 'act_cognitive_defusion',
    section: 'act',
    topic: 'cognitive defusion',
    title: 'Step back from the thought',
    subtitle: 'See a thought as a thought, not a command.',
    durationMinutes: 2,
    explain: 'Defusion helps you unhook from thoughts that feel like facts. It does not argue with the thought. It changes your relationship to it.',
    example: 'Instead of "They hate me," try "I am having the thought that they hate me."',
    application: 'Use this when your mind is speaking in absolutes: always, never, everyone, nothing, ruined.',
    miniExercise: 'Pick one painful thought and add: "I am noticing the story that..." before it.',
  },
  {
    id: 'act_values',
    section: 'act',
    topic: 'values',
    title: 'Choose from values, not panic',
    subtitle: 'Let the person you want to be help choose the next step.',
    durationMinutes: 4,
    explain: 'Values are directions, not perfect performances. They help you choose a response when emotion is loud.',
    example: 'If your value is honesty, you can be honest without sending a message designed to punish.',
    application: 'Ask: If I were acting from steadiness, care, or self-respect, what would I do next?',
    miniExercise: 'Choose one value for the next 10 minutes: steadiness, honesty, kindness, courage, or self-respect.',
  },
  {
    id: 'cbt_cognitive_distortions',
    section: 'cbt',
    topic: 'cognitive distortions',
    title: 'Catch the thought trap',
    subtitle: 'Notice when pain turns into certainty.',
    durationMinutes: 3,
    explain: 'Cognitive distortions are thinking patterns that can make distress feel more certain and urgent than the evidence supports.',
    example: '"She has not answered" can become mind reading: "She must be done with me."',
    application: 'Look for mind reading, catastrophizing, black-and-white thinking, and emotional reasoning.',
    miniExercise: 'Write the painful thought. Then label it with one possible trap: mind reading, catastrophe, all-or-nothing, or emotion-as-fact.',
  },
  {
    id: 'cbt_reframing',
    section: 'cbt',
    topic: 'reframing',
    title: 'Find a steadier frame',
    subtitle: 'A calmer thought that does not deny the pain.',
    durationMinutes: 4,
    explain: 'Reframing means finding a more balanced way to understand a situation. It is not forced positivity.',
    example: 'Instead of "They ignored me because I am too much," try "I do not know why they are delayed. I can ask directly when we talk."',
    application: 'A good reframe feels possible, not fake. It leaves room for your feeling and room for other explanations.',
    miniExercise: 'Write: "One painful explanation is ____. One steadier explanation is ____."',
  },
  {
    id: 'bpd_abandonment',
    section: 'bpd_specific',
    topic: 'abandonment',
    title: 'When distance feels like danger',
    subtitle: 'Understand the alarm without obeying every alarm signal.',
    durationMinutes: 3,
    explain: 'Fear of abandonment can make uncertainty feel urgent and threatening. The feeling is real, but the conclusion may need checking.',
    example: 'A delayed reply may feel like proof someone is leaving, even when there are many possible explanations.',
    application: 'When abandonment fear appears, focus first on calming the body, then ask for clarity from your steadier self.',
    miniExercise: 'Ask: "What do I know for sure? What am I afraid this means? What is one other possibility?"',
  },
  {
    id: 'bpd_rejection',
    section: 'bpd_specific',
    topic: 'rejection',
    title: 'When no feels personal',
    subtitle: 'Separate disappointment from the story of being unwanted.',
    durationMinutes: 3,
    explain: 'Rejection sensitivity can make neutral or disappointing moments feel like evidence that you are unwanted.',
    example: 'A friend being unavailable can hurt without meaning the friendship is unsafe.',
    application: 'Name the hurt directly before deciding what it means about you or the relationship.',
    miniExercise: 'Complete: "This hurts because ____. It does not automatically mean ____."',
  },
  {
    id: 'bpd_shame',
    section: 'bpd_specific',
    topic: 'shame',
    title: 'Shame is not identity',
    subtitle: 'A painful feeling is not the whole truth about you.',
    durationMinutes: 2,
    explain: 'Shame often says, "I am bad." A steadier view says, "Something painful happened, and I can respond with repair or care."',
    example: 'After an argument, shame may push you to disappear or over-apologize. Repair works better when it is specific and grounded.',
    application: 'Shift from identity language to behavior language: What happened? What can be repaired? What support is needed?',
    miniExercise: 'Write one repair sentence: "I want to acknowledge ____. Next time I will try ____."',
  },
  {
    id: 'bpd_splitting',
    section: 'bpd_specific',
    topic: 'splitting',
    title: 'Holding two truths',
    subtitle: 'A person can disappoint you and still matter.',
    durationMinutes: 4,
    explain: 'Splitting can make someone feel all safe or all unsafe in a painful moment. Holding two truths helps reduce emotional whiplash.',
    example: 'Two truths can be: "I am hurt by what happened" and "This relationship has also had care and effort."',
    application: 'Use two-truth thinking before ending, accusing, or idealizing a relationship.',
    miniExercise: 'Write two truths: "One painful truth is ____. One balancing truth is ____."',
  },
  {
    id: 'bpd_identity_instability',
    section: 'bpd_specific',
    topic: 'identity instability',
    title: 'You are allowed to be unfinished',
    subtitle: 'Identity can be built through small repeated choices.',
    durationMinutes: 3,
    explain: 'Identity instability can feel like not knowing who you are from one mood or relationship moment to the next.',
    example: 'After conflict, you might feel like a completely different person. That does not mean you have no self. It means emotion is coloring the view.',
    application: 'Anchor to values and patterns instead of waiting to feel perfectly certain about who you are.',
    miniExercise: 'Choose one sentence for today: "I am someone who is practicing ____."',
  },
  {
    id: 'bpd_emotional_dysregulation',
    section: 'bpd_specific',
    topic: 'emotional dysregulation',
    title: 'When emotion takes the wheel',
    subtitle: 'Big feelings need sequencing, not shame.',
    durationMinutes: 3,
    explain: 'Emotional dysregulation means emotions can rise quickly, feel intense, and make action feel urgent. The first job is often to reduce intensity before solving the problem.',
    example: 'At intensity 9, a conversation about the relationship may go poorly. Calming first can protect what you actually want.',
    application: 'Use this sequence: body first, words second, decisions last.',
    miniExercise: 'Rate your intensity from 1-10. If it is 7 or higher, choose one calming action before any major conversation.',
  },
];

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return todayKey(date);
}

function normalizeProgress(value: Partial<BPDAcademyProgress> | null | undefined): BPDAcademyProgress {
  return {
    completedLessonIds: Array.isArray(value?.completedLessonIds) ? value.completedLessonIds : [],
    completedAtByLesson:
      value?.completedAtByLesson && typeof value.completedAtByLesson === 'object'
        ? value.completedAtByLesson
        : {},
    currentStreak: typeof value?.currentStreak === 'number' ? value.currentStreak : 0,
    longestStreak: typeof value?.longestStreak === 'number' ? value.longestStreak : 0,
    lastCompletedDate: typeof value?.lastCompletedDate === 'string' ? value.lastCompletedDate : null,
  };
}

export async function getBPDAcademyProgress(): Promise<BPDAcademyProgress> {
  const stored = await storageService.get<Partial<BPDAcademyProgress>>(STORAGE_KEY);
  return normalizeProgress(stored);
}

export async function saveBPDAcademyProgress(progress: BPDAcademyProgress): Promise<void> {
  await storageService.set(STORAGE_KEY, normalizeProgress(progress));
}

export async function markBPDAcademyLessonCompleted(lessonId: string): Promise<BPDAcademyProgress> {
  const progress = await getBPDAcademyProgress();
  const alreadyCompleted = progress.completedLessonIds.includes(lessonId);
  if (alreadyCompleted) return progress;

  const today = todayKey();
  const yesterday = yesterdayKey();
  const currentStreak = progress.lastCompletedDate === today
    ? progress.currentStreak
    : progress.lastCompletedDate === yesterday
      ? progress.currentStreak + 1
      : 1;

  const next: BPDAcademyProgress = {
    completedLessonIds: [...progress.completedLessonIds, lessonId],
    completedAtByLesson: {
      ...progress.completedAtByLesson,
      [lessonId]: Date.now(),
    },
    currentStreak,
    longestStreak: Math.max(progress.longestStreak, currentStreak),
    lastCompletedDate: today,
  };

  await saveBPDAcademyProgress(next);
  return next;
}

export function getBPDAcademyLessonsBySection(section: BPDAcademySection): BPDAcademyLesson[] {
  return BPD_ACADEMY_LESSONS.filter(lesson => lesson.section === section);
}

export function getBPDAcademySectionProgress(
  section: BPDAcademySection,
  progress: BPDAcademyProgress,
): { completed: number; total: number } {
  const lessons = getBPDAcademyLessonsBySection(section);
  const completed = lessons.filter(lesson => progress.completedLessonIds.includes(lesson.id)).length;
  return { completed, total: lessons.length };
}
