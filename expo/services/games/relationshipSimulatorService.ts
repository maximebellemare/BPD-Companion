import { storageService } from '@/services/storage/storageService';

export type RelationshipSimulatorDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type RelationshipSimulatorTopic = 'delayed_replies' | 'jealousy' | 'conflict' | 'abandonment' | 'criticism' | 'boundaries';
export type RelationshipOutcome = 'escalation' | 'de_escalation' | 'healthy_communication';

export interface RelationshipResponseOption {
  id: string;
  text: string;
  partnerReply: string;
  coachingNote: string;
  outcomeSignal: RelationshipOutcome;
  scores: {
    emotionalRegulation: number;
    interpersonalEffectiveness: number;
    impulseControl: number;
  };
}

export interface RelationshipSimulatorTurn {
  id: string;
  partnerLine: string;
  prompt: string;
  options: RelationshipResponseOption[];
}

export interface RelationshipSimulatorScenario {
  id: string;
  difficulty: RelationshipSimulatorDifficulty;
  topic: RelationshipSimulatorTopic;
  title: string;
  setup: string;
  turns: RelationshipSimulatorTurn[];
}

export interface RelationshipSimulatorScore {
  emotionalRegulation: number;
  interpersonalEffectiveness: number;
  impulseControl: number;
  overall: number;
  outcome: RelationshipOutcome;
}

export interface RelationshipSimulatorAttempt {
  id: string;
  scenarioId: string;
  difficulty: RelationshipSimulatorDifficulty;
  topic: RelationshipSimulatorTopic;
  score: RelationshipSimulatorScore;
  selectedOptionIds: string[];
  createdAt: number;
}

export interface RelationshipSimulatorProgress {
  attempts: RelationshipSimulatorAttempt[];
  bestScoreByScenario: Record<string, number>;
  topicAttempts: Record<RelationshipSimulatorTopic, number>;
  outcomeCounts: Record<RelationshipOutcome, number>;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null;
}

const STORAGE_KEY = 'bpd_companion_relationship_simulator_progress';

export const RELATIONSHIP_SIMULATOR_DIFFICULTY_LABELS: Record<RelationshipSimulatorDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const RELATIONSHIP_SIMULATOR_TOPIC_LABELS: Record<RelationshipSimulatorTopic, string> = {
  delayed_replies: 'Delayed replies',
  jealousy: 'Jealousy',
  conflict: 'Conflict',
  abandonment: 'Abandonment fears',
  criticism: 'Criticism',
  boundaries: 'Boundaries',
};

export const OUTCOME_LABELS: Record<RelationshipOutcome, string> = {
  escalation: 'Escalation',
  de_escalation: 'De-escalation',
  healthy_communication: 'Healthy communication',
};

export const DEFAULT_RELATIONSHIP_SIMULATOR_PROGRESS: RelationshipSimulatorProgress = {
  attempts: [],
  bestScoreByScenario: {},
  topicAttempts: {
    delayed_replies: 0,
    jealousy: 0,
    conflict: 0,
    abandonment: 0,
    criticism: 0,
    boundaries: 0,
  },
  outcomeCounts: {
    escalation: 0,
    de_escalation: 0,
    healthy_communication: 0,
  },
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: null,
};

export const RELATIONSHIP_SIMULATOR_SCENARIOS: RelationshipSimulatorScenario[] = [
  {
    id: 'beginner_space_tonight',
    difficulty: 'beginner',
    topic: 'abandonment',
    title: 'Space tonight',
    setup: 'Your partner seems tired after a tense day. You are already feeling sensitive to distance.',
    turns: [
      {
        id: 'space_1',
        partnerLine: 'I need some space tonight.',
        prompt: 'How do you respond first?',
        options: [
          {
            id: 'panic',
            text: 'So you just do not care about me tonight?',
            partnerReply: 'That is not what I said. I just need a break.',
            coachingNote: 'This turns fear into accusation, which can make the other person defend instead of reassure.',
            outcomeSignal: 'escalation',
            scores: { emotionalRegulation: 25, interpersonalEffectiveness: 20, impulseControl: 20 },
          },
          {
            id: 'balanced',
            text: 'I can respect that. I feel a little anxious, so could we check in tomorrow?',
            partnerReply: 'Yes. I can text you in the morning. I just need quiet tonight.',
            coachingNote: 'This names the feeling, respects the request, and makes one clear ask.',
            outcomeSignal: 'healthy_communication',
            scores: { emotionalRegulation: 90, interpersonalEffectiveness: 90, impulseControl: 88 },
          },
          {
            id: 'shut_down',
            text: 'Fine. Whatever.',
            partnerReply: 'I can tell you are upset, but I do not know what you need.',
            coachingNote: 'Withdrawing may protect pride, but it does not communicate the real need.',
            outcomeSignal: 'de_escalation',
            scores: { emotionalRegulation: 50, interpersonalEffectiveness: 35, impulseControl: 55 },
          },
        ],
      },
      {
        id: 'space_2',
        partnerLine: 'I am not leaving. I am just exhausted.',
        prompt: 'What keeps the conversation steady?',
        options: [
          {
            id: 'ask_proof',
            text: 'If you are not leaving, prove it right now.',
            partnerReply: 'I feel pressured. I need this to stop for tonight.',
            coachingNote: 'Demanding proof can create more distance even when the fear is understandable.',
            outcomeSignal: 'escalation',
            scores: { emotionalRegulation: 25, interpersonalEffectiveness: 25, impulseControl: 20 },
          },
          {
            id: 'receive',
            text: 'Thank you for saying that. I am going to let tonight be quiet and ground myself.',
            partnerReply: 'Thank you. I appreciate that.',
            coachingNote: 'You accept reassurance without chasing more of it.',
            outcomeSignal: 'healthy_communication',
            scores: { emotionalRegulation: 95, interpersonalEffectiveness: 88, impulseControl: 92 },
          },
          {
            id: 'over_apologize',
            text: 'I am sorry. I am too much. I ruin everything.',
            partnerReply: 'You are not ruining everything, but I cannot fix this feeling for you tonight.',
            coachingNote: 'Self-attack can pull the other person into rescuing instead of connecting.',
            outcomeSignal: 'de_escalation',
            scores: { emotionalRegulation: 45, interpersonalEffectiveness: 45, impulseControl: 45 },
          },
        ],
      },
    ],
  },
  {
    id: 'beginner_delayed_reply',
    difficulty: 'beginner',
    topic: 'delayed_replies',
    title: 'Late reply',
    setup: 'You sent a message hours ago. They finally reply, “Sorry, busy day.”',
    turns: [
      {
        id: 'reply_1',
        partnerLine: 'Sorry, busy day.',
        prompt: 'What response protects connection?',
        options: [
          {
            id: 'guilt',
            text: 'Must be nice to forget I exist.',
            partnerReply: 'I did not forget you. That feels unfair.',
            coachingNote: 'The hurt is real, but sarcasm often invites defensiveness.',
            outcomeSignal: 'escalation',
            scores: { emotionalRegulation: 30, interpersonalEffectiveness: 25, impulseControl: 28 },
          },
          {
            id: 'warm_direct',
            text: 'Thanks for letting me know. I got anxious waiting, but I am glad you replied.',
            partnerReply: 'I get that. I should have said I was tied up.',
            coachingNote: 'This is honest without punishing.',
            outcomeSignal: 'healthy_communication',
            scores: { emotionalRegulation: 88, interpersonalEffectiveness: 84, impulseControl: 86 },
          },
          {
            id: 'silent',
            text: 'Do not reply for the rest of the night.',
            partnerReply: 'I am not sure if you are upset or busy now.',
            coachingNote: 'Silence may feel safer, but it can make the cycle confusing.',
            outcomeSignal: 'de_escalation',
            scores: { emotionalRegulation: 55, interpersonalEffectiveness: 30, impulseControl: 60 },
          },
        ],
      },
    ],
  },
  {
    id: 'intermediate_jealousy_photo',
    difficulty: 'intermediate',
    topic: 'jealousy',
    title: 'The photo like',
    setup: 'Your partner liked someone’s photo. You feel replaceable and want certainty immediately.',
    turns: [
      {
        id: 'jealousy_1',
        partnerLine: 'It was just a like. I did not think it meant anything.',
        prompt: 'How do you respond?',
        options: [
          {
            id: 'accuse',
            text: 'You knew exactly what you were doing.',
            partnerReply: 'No, I really did not. Now I feel attacked.',
            coachingNote: 'This assumes intent. It may escalate before you know what happened.',
            outcomeSignal: 'escalation',
            scores: { emotionalRegulation: 28, interpersonalEffectiveness: 25, impulseControl: 25 },
          },
          {
            id: 'own_feeling',
            text: 'I know a like may not mean much. It still hit my fear of being replaced.',
            partnerReply: 'Thank you for saying it that way. I can understand why it touched that fear.',
            coachingNote: 'You own the feeling without turning it into a charge.',
            outcomeSignal: 'healthy_communication',
            scores: { emotionalRegulation: 88, interpersonalEffectiveness: 88, impulseControl: 84 },
          },
          {
            id: 'test',
            text: 'Maybe I should start liking other people’s photos too.',
            partnerReply: 'That sounds like a test, not a conversation.',
            coachingNote: 'Testing can temporarily protect pride but usually weakens trust.',
            outcomeSignal: 'escalation',
            scores: { emotionalRegulation: 35, interpersonalEffectiveness: 30, impulseControl: 30 },
          },
        ],
      },
      {
        id: 'jealousy_2',
        partnerLine: 'Do you want reassurance or do you want to talk about what it brought up?',
        prompt: 'Choose the response that deepens understanding.',
        options: [
          {
            id: 'only_reassurance',
            text: 'I need you to promise you will never do that again.',
            partnerReply: 'I can be mindful, but never is hard to promise.',
            coachingNote: 'A rigid ask may come from fear and may be hard for the other person to meet.',
            outcomeSignal: 'de_escalation',
            scores: { emotionalRegulation: 55, interpersonalEffectiveness: 50, impulseControl: 48 },
          },
          {
            id: 'deeper',
            text: 'A little reassurance would help, and I also want to understand why it felt so big.',
            partnerReply: 'I can do that. I care about you, and I am here.',
            coachingNote: 'This balances reassurance with self-awareness.',
            outcomeSignal: 'healthy_communication',
            scores: { emotionalRegulation: 92, interpersonalEffectiveness: 90, impulseControl: 88 },
          },
          {
            id: 'shame',
            text: 'Forget it. I am clearly ridiculous.',
            partnerReply: 'I do not think you are ridiculous, but I do not know how to respond to that.',
            coachingNote: 'Shame can shut down the actual conversation.',
            outcomeSignal: 'de_escalation',
            scores: { emotionalRegulation: 45, interpersonalEffectiveness: 40, impulseControl: 45 },
          },
        ],
      },
    ],
  },
  {
    id: 'intermediate_criticism',
    difficulty: 'intermediate',
    topic: 'criticism',
    title: 'Too sensitive',
    setup: 'Someone says you are too sensitive during a disagreement.',
    turns: [
      {
        id: 'criticism_1',
        partnerLine: 'You are being too sensitive.',
        prompt: 'What response keeps self-respect?',
        options: [
          {
            id: 'counterattack',
            text: 'You are the insensitive one. You always do this.',
            partnerReply: 'Now we are just attacking each other.',
            coachingNote: 'Counterattack may feel powerful, but it pulls the conversation away from the issue.',
            outcomeSignal: 'escalation',
            scores: { emotionalRegulation: 28, interpersonalEffectiveness: 25, impulseControl: 28 },
          },
          {
            id: 'boundary',
            text: 'I am willing to talk about the issue, but I do not want to be labeled.',
            partnerReply: 'Okay. I can try to say what bothered me more clearly.',
            coachingNote: 'This protects dignity and redirects to specifics.',
            outcomeSignal: 'healthy_communication',
            scores: { emotionalRegulation: 88, interpersonalEffectiveness: 92, impulseControl: 86 },
          },
          {
            id: 'collapse',
            text: 'You are right. I should not say anything.',
            partnerReply: 'That is not what I meant.',
            coachingNote: 'Collapsing can avoid conflict but hides your actual need.',
            outcomeSignal: 'de_escalation',
            scores: { emotionalRegulation: 42, interpersonalEffectiveness: 35, impulseControl: 50 },
          },
        ],
      },
    ],
  },
  {
    id: 'advanced_boundary_family',
    difficulty: 'advanced',
    topic: 'boundaries',
    title: 'Family pressure',
    setup: 'A family member keeps pushing after you said no. You feel guilty and angry.',
    turns: [
      {
        id: 'boundary_1',
        partnerLine: 'I cannot believe you would say no after everything I have done for you.',
        prompt: 'How do you keep the boundary without attacking?',
        options: [
          {
            id: 'give_in',
            text: 'Fine. I will do it. Just stop making me feel guilty.',
            partnerReply: 'Good. I knew you would understand.',
            coachingNote: 'This ends the tension now but may create resentment later.',
            outcomeSignal: 'de_escalation',
            scores: { emotionalRegulation: 45, interpersonalEffectiveness: 35, impulseControl: 48 },
          },
          {
            id: 'values',
            text: 'I hear that you are upset. My answer is still no, and I am not going to debate it tonight.',
            partnerReply: 'I do not like it, but I hear your answer.',
            coachingNote: 'This validates emotion without surrendering the boundary.',
            outcomeSignal: 'healthy_communication',
            scores: { emotionalRegulation: 94, interpersonalEffectiveness: 92, impulseControl: 90 },
          },
          {
            id: 'explode',
            text: 'You are manipulative and impossible. This is why I avoid you.',
            partnerReply: 'Do not talk to me like that.',
            coachingNote: 'The boundary gets lost when the response becomes character attack.',
            outcomeSignal: 'escalation',
            scores: { emotionalRegulation: 20, interpersonalEffectiveness: 22, impulseControl: 18 },
          },
        ],
      },
      {
        id: 'boundary_2',
        partnerLine: 'So you are just abandoning the family?',
        prompt: 'Choose a response that stays grounded.',
        options: [
          {
            id: 'defend_long',
            text: 'Write a long explanation proving why you are not abandoning anyone.',
            partnerReply: 'I still think you are making excuses.',
            coachingNote: 'Over-explaining can invite more debate when the boundary is already clear.',
            outcomeSignal: 'de_escalation',
            scores: { emotionalRegulation: 60, interpersonalEffectiveness: 50, impulseControl: 45 },
          },
          {
            id: 'brief_repeat',
            text: 'No. I care about the family, and I am still not available for this.',
            partnerReply: 'I am upset, but I understand your answer.',
            coachingNote: 'Brief repetition is often stronger than defending every angle.',
            outcomeSignal: 'healthy_communication',
            scores: { emotionalRegulation: 95, interpersonalEffectiveness: 94, impulseControl: 92 },
          },
          {
            id: 'cut_off',
            text: 'If you say that again, I am never speaking to you.',
            partnerReply: 'Now you are threatening me.',
            coachingNote: 'A threat can escalate the exact abandonment theme you are trying to avoid.',
            outcomeSignal: 'escalation',
            scores: { emotionalRegulation: 25, interpersonalEffectiveness: 24, impulseControl: 22 },
          },
        ],
      },
    ],
  },
  {
    id: 'advanced_conflict_repair',
    difficulty: 'advanced',
    topic: 'conflict',
    title: 'Repair after conflict',
    setup: 'You both said hurtful things. Now they want to talk, and you feel defensive.',
    turns: [
      {
        id: 'repair_1',
        partnerLine: 'I want to talk about what happened last night.',
        prompt: 'How do you open the repair?',
        options: [
          {
            id: 'deny',
            text: 'There is nothing to talk about. You started it.',
            partnerReply: 'Then I do not think we can repair this.',
            coachingNote: 'Defensiveness blocks repair before it starts.',
            outcomeSignal: 'escalation',
            scores: { emotionalRegulation: 30, interpersonalEffectiveness: 25, impulseControl: 30 },
          },
          {
            id: 'own_piece',
            text: 'I am willing to talk. I know my tone got sharp, and I want to understand your side too.',
            partnerReply: 'Thank you. I can own my part too.',
            coachingNote: 'Owning one piece creates safety without taking all the blame.',
            outcomeSignal: 'healthy_communication',
            scores: { emotionalRegulation: 92, interpersonalEffectiveness: 94, impulseControl: 88 },
          },
          {
            id: 'self_blame',
            text: 'It was all my fault. I ruin everything.',
            partnerReply: 'I do not want you to attack yourself. I want us to understand what happened.',
            coachingNote: 'Self-blame can derail repair into reassurance.',
            outcomeSignal: 'de_escalation',
            scores: { emotionalRegulation: 45, interpersonalEffectiveness: 45, impulseControl: 42 },
          },
        ],
      },
    ],
  },
];

function todayKey(now = Date.now()): string {
  const date = new Date(now);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function normalizeProgress(value: Partial<RelationshipSimulatorProgress> | null | undefined): RelationshipSimulatorProgress {
  return {
    ...DEFAULT_RELATIONSHIP_SIMULATOR_PROGRESS,
    ...(value ?? {}),
    attempts: value?.attempts ?? [],
    bestScoreByScenario: value?.bestScoreByScenario ?? {},
    topicAttempts: {
      ...DEFAULT_RELATIONSHIP_SIMULATOR_PROGRESS.topicAttempts,
      ...(value?.topicAttempts ?? {}),
    },
    outcomeCounts: {
      ...DEFAULT_RELATIONSHIP_SIMULATOR_PROGRESS.outcomeCounts,
      ...(value?.outcomeCounts ?? {}),
    },
  };
}

function updateStreak(progress: RelationshipSimulatorProgress, now = Date.now()): Pick<RelationshipSimulatorProgress, 'currentStreak' | 'longestStreak' | 'lastCompletedDate'> {
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

export function scoreRelationshipSimulation(options: RelationshipResponseOption[]): RelationshipSimulatorScore {
  const count = Math.max(1, options.length);
  const emotionalRegulation = Math.round(options.reduce((sum, item) => sum + item.scores.emotionalRegulation, 0) / count);
  const interpersonalEffectiveness = Math.round(options.reduce((sum, item) => sum + item.scores.interpersonalEffectiveness, 0) / count);
  const impulseControl = Math.round(options.reduce((sum, item) => sum + item.scores.impulseControl, 0) / count);
  const overall = Math.round((emotionalRegulation + interpersonalEffectiveness + impulseControl) / 3);
  const healthy = options.filter(item => item.outcomeSignal === 'healthy_communication').length;
  const escalations = options.filter(item => item.outcomeSignal === 'escalation').length;
  const outcome: RelationshipOutcome = healthy >= Math.ceil(count / 2)
    ? 'healthy_communication'
    : escalations >= Math.ceil(count / 2)
      ? 'escalation'
      : 'de_escalation';

  return {
    emotionalRegulation,
    interpersonalEffectiveness,
    impulseControl,
    overall,
    outcome,
  };
}

export async function getRelationshipSimulatorProgress(): Promise<RelationshipSimulatorProgress> {
  const stored = await storageService.get<Partial<RelationshipSimulatorProgress>>(STORAGE_KEY);
  return normalizeProgress(stored);
}

export async function saveRelationshipSimulatorAttempt(
  scenario: RelationshipSimulatorScenario,
  selectedOptions: RelationshipResponseOption[],
): Promise<{ progress: RelationshipSimulatorProgress; attempt: RelationshipSimulatorAttempt }> {
  const progress = await getRelationshipSimulatorProgress();
  const score = scoreRelationshipSimulation(selectedOptions);
  const streak = updateStreak(progress);
  const attempt: RelationshipSimulatorAttempt = {
    id: `relationship_sim_${Date.now()}`,
    scenarioId: scenario.id,
    difficulty: scenario.difficulty,
    topic: scenario.topic,
    score,
    selectedOptionIds: selectedOptions.map(item => item.id),
    createdAt: Date.now(),
  };
  const next: RelationshipSimulatorProgress = {
    ...progress,
    attempts: [attempt, ...progress.attempts].slice(0, 100),
    bestScoreByScenario: {
      ...progress.bestScoreByScenario,
      [scenario.id]: Math.max(progress.bestScoreByScenario[scenario.id] ?? 0, score.overall),
    },
    topicAttempts: {
      ...progress.topicAttempts,
      [scenario.topic]: progress.topicAttempts[scenario.topic] + 1,
    },
    outcomeCounts: {
      ...progress.outcomeCounts,
      [score.outcome]: progress.outcomeCounts[score.outcome] + 1,
    },
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastCompletedDate: streak.lastCompletedDate,
  };

  await storageService.set(STORAGE_KEY, next);
  return { progress: next, attempt };
}
