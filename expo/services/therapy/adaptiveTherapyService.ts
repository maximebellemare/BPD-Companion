import { JournalEntry, MessageDraft } from '@/types';
import {
  TherapyFocusArea,
  TherapyPlanItem,
  WeeklyTherapyPlan,
  TherapyPlanState,
  FOCUS_AREA_META,
} from '@/types/therapy';
import { therapyPlanRepository } from '@/services/repositories';

function isWithinDays(timestamp: number, days: number): boolean {
  return Date.now() - timestamp < days * 24 * 60 * 60 * 1000;
}

function getWeekBounds(): { start: number; end: number } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start: start.getTime(), end: end.getTime() };
}

function analyzePatterns(entries: JournalEntry[], drafts: MessageDraft[]) {
  const recent = entries.filter(e => isWithinDays(e.timestamp, 14));

  const triggerCounts: Record<string, number> = {};
  const triggerCategoryCounts: Record<string, number> = {};
  const emotionCounts: Record<string, number> = {};
  const urgeCounts: Record<string, number> = {};
  const copingCounts: Record<string, number> = {};
  let totalDistress = 0;
  let distressCount = 0;

  recent.forEach(entry => {
    entry.checkIn.triggers.forEach(t => {
      triggerCounts[t.label] = (triggerCounts[t.label] || 0) + 1;
      triggerCategoryCounts[t.category] = (triggerCategoryCounts[t.category] || 0) + 1;
    });
    entry.checkIn.emotions.forEach(e => {
      emotionCounts[e.label] = (emotionCounts[e.label] || 0) + 1;
    });
    entry.checkIn.urges.forEach(u => {
      urgeCounts[u.label] = (urgeCounts[u.label] || 0) + 1;
    });
    (entry.checkIn.copingUsed ?? []).forEach(c => {
      copingCounts[c] = (copingCounts[c] || 0) + 1;
    });
    totalDistress += entry.checkIn.intensityLevel;
    distressCount++;
  });

  const recentDrafts = drafts.filter(d => isWithinDays(d.timestamp, 14));
  const messagingFrequency = recentDrafts.length;
  const pausedMessages = recentDrafts.filter(d => d.paused).length;

  const avgDistress = distressCount > 0 ? totalDistress / distressCount : 0;
  const topTrigger = Object.entries(triggerCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;
  const topEmotion = Object.entries(emotionCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;
  const topTriggerCategory = Object.entries(triggerCategoryCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

  const hasHighDistress = avgDistress >= 6;
  const hasRelationshipIssues = (triggerCategoryCounts['relationship'] ?? 0) >= 2;
  const hasAnxiety = ['Anxious', 'Afraid', 'Overwhelmed'].some(e => (emotionCounts[e] ?? 0) >= 2);
  const hasSadness = ['Sad', 'Abandoned', 'Empty'].some(e => (emotionCounts[e] ?? 0) >= 2);
  const hasAnger = ['Angry', 'Jealous', 'Frustrated'].some(e => (emotionCounts[e] ?? 0) >= 2);
  const hasImpulsiveUrges = Object.entries(urgeCounts).some(([, count]) => count >= 2);
  const hasFrequentMessaging = messagingFrequency >= 3;

  console.log('[AdaptiveTherapy] Analysis:', {
    avgDistress,
    topTrigger,
    topEmotion,
    hasHighDistress,
    hasRelationshipIssues,
    entryCount: recent.length,
  });

  return {
    avgDistress,
    topTrigger,
    topEmotion,
    topTriggerCategory,
    triggerCategoryCounts,
    emotionCounts,
    urgeCounts,
    copingCounts,
    hasHighDistress,
    hasRelationshipIssues,
    hasAnxiety,
    hasSadness,
    hasAnger,
    hasImpulsiveUrges,
    hasFrequentMessaging,
    pausedMessages,
    entryCount: recent.length,
  };
}

function determineFocusArea(analysis: ReturnType<typeof analyzePatterns>): TherapyFocusArea {
  const scores: Record<TherapyFocusArea, number> = {
    distress_tolerance: 0,
    emotional_regulation: 0,
    interpersonal_effectiveness: 0,
    mindfulness: 0,
    relationship_patterns: 0,
    self_compassion: 0,
  };

  if (analysis.hasHighDistress) {
    scores.distress_tolerance += 5;
    scores.emotional_regulation += 3;
  }

  if (analysis.hasRelationshipIssues) {
    scores.relationship_patterns += 5;
    scores.interpersonal_effectiveness += 4;
  }

  if (analysis.hasAnxiety) {
    scores.mindfulness += 4;
    scores.distress_tolerance += 2;
  }

  if (analysis.hasSadness) {
    scores.self_compassion += 5;
    scores.emotional_regulation += 3;
  }

  if (analysis.hasAnger) {
    scores.emotional_regulation += 5;
    scores.distress_tolerance += 2;
  }

  if (analysis.hasImpulsiveUrges) {
    scores.distress_tolerance += 4;
    scores.interpersonal_effectiveness += 2;
  }

  if (analysis.hasFrequentMessaging) {
    scores.interpersonal_effectiveness += 3;
    scores.relationship_patterns += 3;
  }

  if (analysis.entryCount < 3) {
    scores.mindfulness += 3;
    scores.self_compassion += 2;
  }

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  console.log('[AdaptiveTherapy] Focus scores:', sorted);
  return sorted[0][0] as TherapyFocusArea;
}

function generateInsight(analysis: ReturnType<typeof analyzePatterns>, focus: TherapyFocusArea): string {
  if (analysis.entryCount < 2) {
    return 'Keep checking in regularly — your plan will become more personalized as you share more about your emotional world.';
  }

  const insights: string[] = [];

  if (analysis.topTrigger) {
    insights.push(`"${analysis.topTrigger}" has been your most frequent trigger recently.`);
  }
  if (analysis.topEmotion) {
    insights.push(`You've been feeling "${analysis.topEmotion}" more than other emotions.`);
  }
  if (analysis.hasHighDistress) {
    insights.push(`Your average distress level has been elevated at ${analysis.avgDistress.toFixed(1)}/10.`);
  }
  if (analysis.hasRelationshipIssues) {
    insights.push('Relationship-related triggers have been prominent in your recent check-ins.');
  }
  if (analysis.pausedMessages > 0) {
    insights.push(`You've paused ${analysis.pausedMessages} message${analysis.pausedMessages > 1 ? 's' : ''} recently — that takes real strength.`);
  }

  return insights.length > 0
    ? insights.slice(0, 2).join(' ')
    : `This week's focus on ${FOCUS_AREA_META[focus].label.toLowerCase()} is based on your recent patterns.`;
}

function generateEncouragement(analysis: ReturnType<typeof analyzePatterns>): string {
  const messages = [
    'Every small step you take is a step toward healing.',
    'You are building skills that will serve you for a lifetime.',
    'Progress isn\'t always visible — but showing up matters.',
    'Be patient with yourself. Recovery is not a straight line.',
    'You deserve the care you give to others.',
  ];

  if (analysis.pausedMessages > 0) {
    return 'Choosing to pause before reacting is a powerful skill. You\'re growing.';
  }
  if (analysis.entryCount >= 5) {
    return 'Your consistency in checking in shows real commitment to your wellbeing.';
  }

  return messages[Math.floor(Date.now() / 86400000) % messages.length];
}

function generatePlanItems(focus: TherapyFocusArea, analysis: ReturnType<typeof analyzePatterns>): TherapyPlanItem[] {
  const items: TherapyPlanItem[] = [];
  let idCounter = 0;
  const makeId = () => `tp_${Date.now()}_${idCounter++}`;

  switch (focus) {
    case 'distress_tolerance':
      items.push({
        id: makeId(), type: 'skill', day: 1,
        title: 'TIP Skills Practice',
        description: 'Use Temperature, Intense exercise, or Paced breathing to lower distress quickly.',
        reason: analysis.hasHighDistress ? 'Your distress has been elevated — TIP skills can help in the moment.' : 'Building tolerance for intense emotions.',
        route: '/exercise?id=c1', icon: 'Thermometer', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'reflection', day: 2,
        title: 'Distress Diary',
        description: 'Write about a moment of distress this week. What happened? What did you feel? What did you do?',
        reason: 'Tracking distress patterns helps you prepare for future moments.',
        route: '/check-in', icon: 'BookOpen', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'exercise', day: 3,
        title: 'Grounding: 5-4-3-2-1',
        description: 'Practice the 5 senses grounding technique even when calm — so it becomes automatic.',
        reason: 'Practicing grounding when calm makes it easier to use during crisis.',
        route: '/guided-regulation', icon: 'Anchor', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'skill', day: 4,
        title: 'STOP Skill',
        description: 'Stop, Take a step back, Observe, Proceed mindfully.',
        reason: analysis.hasImpulsiveUrges ? 'You\'ve had strong urges recently — STOP creates space.' : 'A key skill for any moment of overwhelm.',
        icon: 'Hand', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'exercise', day: 5,
        title: 'Self-Soothing Kit',
        description: 'Engage each of your five senses with something comforting today.',
        reason: 'Self-soothing builds your emotional safety toolkit.',
        route: '/exercise?id=c3', icon: 'Heart', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'reflection', day: 6,
        title: 'Pros and Cons',
        description: 'Think of an urge you face often. Write out the pros and cons of acting on it vs. resisting.',
        reason: 'Engaging your rational mind when emotions are calm builds resilience.',
        route: '/check-in', icon: 'Scale', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'strategy', day: 7,
        title: 'Weekly Reflection',
        description: 'Review how you handled distress this week. What worked? What would you try differently?',
        reason: 'Reflecting on your progress helps consolidate new skills.',
        route: '/check-in', icon: 'Star', focusArea: focus, completed: false,
      });
      break;

    case 'emotional_regulation':
      items.push({
        id: makeId(), type: 'skill', day: 1,
        title: 'Check the Facts',
        description: 'When a strong emotion arises, pause and ask: what are the actual facts of this situation?',
        reason: analysis.topEmotion ? `You've been feeling "${analysis.topEmotion}" often — facts can bring clarity.` : 'A powerful tool for managing intense emotions.',
        route: '/exercise?id=c5', icon: 'Search', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'exercise', day: 2,
        title: 'Opposite Action',
        description: 'Identify the action urge of your strongest emotion and do the opposite.',
        reason: analysis.hasAnger ? 'Anger urges can be disruptive — opposite action helps break the cycle.' : 'Changing your action can change your emotion.',
        route: '/exercise?id=c7', icon: 'RefreshCw', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'reflection', day: 3,
        title: 'Emotion Log',
        description: 'Track your emotions three times today. Name them specifically — not just "bad" or "upset".',
        reason: 'Specific emotion labeling actually reduces the intensity of feelings.',
        route: '/check-in', icon: 'FileText', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'skill', day: 4,
        title: 'ABC PLEASE',
        description: 'Accumulate positives, Build mastery, Cope ahead. Plus: treat PhysicaL illness, balance Eating, avoid mood-Altering substances, balance Sleep, get Exercise.',
        reason: 'Reducing emotional vulnerability is a foundation of regulation.',
        icon: 'ListChecks', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'exercise', day: 5,
        title: 'Build Mastery',
        description: 'Do one thing today that gives you a sense of accomplishment, no matter how small.',
        reason: 'Small accomplishments build confidence and reduce emotional vulnerability.',
        icon: 'Trophy', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'reflection', day: 6,
        title: 'Emotion-Action Chain',
        description: 'Trace a recent emotional reaction: trigger → thought → emotion → urge → action → consequence.',
        reason: 'Understanding your patterns is the first step to changing them.',
        route: '/check-in', icon: 'Link', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'strategy', day: 7,
        title: 'Week in Review',
        description: 'Which emotions were strongest this week? Which regulation skills helped most?',
        reason: 'Regular review deepens your self-awareness and skill mastery.',
        route: '/check-in', icon: 'Star', focusArea: focus, completed: false,
      });
      break;

    case 'interpersonal_effectiveness':
      items.push({
        id: makeId(), type: 'skill', day: 1,
        title: 'DEAR MAN Practice',
        description: 'Describe, Express, Assert, Reinforce — Mindful, Appear confident, Negotiate.',
        reason: analysis.hasRelationshipIssues ? 'Relationship triggers suggest clear communication is needed.' : 'A core skill for getting your needs met.',
        icon: 'MessageSquare', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'reflection', day: 2,
        title: 'Boundary Reflection',
        description: 'Think of one boundary you want to set. Write it down clearly and specifically.',
        reason: 'Clear boundaries protect your emotional wellbeing.',
        route: '/check-in', icon: 'Shield', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'exercise', day: 3,
        title: 'GIVE Skills',
        description: 'Practice being Gentle, Interested, Validating, and using an Easy manner in a conversation.',
        reason: 'GIVE skills maintain relationships while you assert your needs.',
        icon: 'HandHeart', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'strategy', day: 4,
        title: 'Message Mindfulness',
        description: 'Before sending any emotional message today, pause for 2 minutes and re-read it.',
        reason: analysis.hasFrequentMessaging ? 'You\'ve been drafting messages often — pausing can protect relationships.' : 'A brief pause prevents regret.',
        route: '/(tabs)/messages', icon: 'Timer', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'skill', day: 5,
        title: 'FAST Skills',
        description: 'Be Fair, no Apologies (for existing), Stick to values, be Truthful.',
        reason: 'FAST skills help you maintain self-respect in interactions.',
        icon: 'Zap', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'reflection', day: 6,
        title: 'Relationship Patterns',
        description: 'Reflect: what patterns do you notice in your relationships? What do you want to change?',
        reason: 'Awareness of patterns is the first step to building healthier connections.',
        route: '/relationship-insights', icon: 'GitBranch', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'strategy', day: 7,
        title: 'Communication Review',
        description: 'Look back at how you communicated this week. Celebrate one success.',
        reason: 'Recognizing growth motivates continued practice.',
        route: '/check-in', icon: 'Star', focusArea: focus, completed: false,
      });
      break;

    case 'mindfulness':
      items.push({
        id: makeId(), type: 'exercise', day: 1,
        title: 'Wise Mind Meditation',
        description: 'Spend 5 minutes finding the overlap between your emotional mind and rational mind.',
        reason: analysis.hasAnxiety ? 'Anxiety often lives in emotional mind — wise mind brings balance.' : 'Wise mind is the foundation of all DBT skills.',
        route: '/exercise?id=c1', icon: 'Brain', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'skill', day: 2,
        title: 'Observe Without Judging',
        description: 'Notice your thoughts and feelings today without labeling them as good or bad.',
        reason: 'Non-judgmental observation reduces the power of difficult emotions.',
        icon: 'Eye', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'exercise', day: 3,
        title: 'One-Mindfully',
        description: 'Choose one activity today and do it with your full, undivided attention.',
        reason: 'One-mindful practice trains your brain to stay present.',
        icon: 'Focus', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'reflection', day: 4,
        title: 'Thought Awareness',
        description: 'Write down 5 recurring thoughts from today. Are they facts or interpretations?',
        reason: 'Distinguishing facts from thoughts reduces emotional reactivity.',
        route: '/check-in', icon: 'Cloud', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'exercise', day: 5,
        title: 'Body Scan',
        description: 'Slowly bring awareness to each part of your body, from toes to head. Notice without changing.',
        reason: 'Body awareness helps you catch emotions before they escalate.',
        route: '/guided-regulation', icon: 'Scan', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'skill', day: 6,
        title: 'Describe with Words',
        description: 'Practice putting your internal experience into words throughout the day.',
        reason: 'Language creates distance from overwhelming emotions.',
        icon: 'PenLine', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'strategy', day: 7,
        title: 'Mindfulness Review',
        description: 'Which mindfulness practice felt most helpful this week? Plan to continue it.',
        reason: 'Identifying what resonates helps build a sustainable practice.',
        route: '/check-in', icon: 'Star', focusArea: focus, completed: false,
      });
      break;

    case 'relationship_patterns':
      items.push({
        id: makeId(), type: 'reflection', day: 1,
        title: 'Trigger Mapping',
        description: 'Write about your most recent relationship trigger. What story did your mind tell you?',
        reason: analysis.topTrigger ? `"${analysis.topTrigger}" has been your top trigger — let's explore it.` : 'Understanding triggers helps prevent escalation.',
        route: '/check-in', icon: 'Map', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'skill', day: 2,
        title: 'Validation Practice',
        description: 'Validate someone else\'s perspective today, even if you disagree. Then validate your own feelings.',
        reason: 'Mutual validation reduces conflict and builds trust.',
        icon: 'CheckCircle', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'strategy', day: 3,
        title: 'Pause Before Responding',
        description: 'When you feel triggered in a conversation, take 3 deep breaths before responding.',
        reason: analysis.hasFrequentMessaging ? 'You\'ve been messaging frequently — pauses protect you.' : 'A pause can change the entire outcome of an interaction.',
        route: '/(tabs)/messages', icon: 'Pause', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'exercise', day: 4,
        title: 'Boundary Script',
        description: 'Write a boundary statement: "I feel ___ when ___. I need ___."',
        reason: 'Having prepared scripts makes boundaries easier in the moment.',
        route: '/check-in', icon: 'FileEdit', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'reflection', day: 5,
        title: 'Pattern Recognition',
        description: 'Review your relationship insights. Do you see repeating cycles?',
        reason: 'Recognizing cycles is the first step to breaking them.',
        route: '/relationship-insights', icon: 'Repeat', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'skill', day: 6,
        title: 'Secure Communication',
        description: 'Rewrite one message draft using a calm, secure communication style.',
        reason: 'Practicing secure communication rewires relationship patterns.',
        route: '/(tabs)/messages', icon: 'MessageCircle', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'strategy', day: 7,
        title: 'Relationship Check-In',
        description: 'Reflect on your relationships this week. What went well? What do you want to change?',
        reason: 'Regular relationship reflection builds healthier patterns over time.',
        route: '/check-in', icon: 'Star', focusArea: focus, completed: false,
      });
      break;

    case 'self_compassion':
      items.push({
        id: makeId(), type: 'exercise', day: 1,
        title: 'Compassionate Letter',
        description: 'Write a short letter to yourself as if you were writing to a dear friend going through the same thing.',
        reason: analysis.hasSadness ? 'You\'ve been carrying heavy emotions — you deserve kindness.' : 'Self-compassion is a skill that can be practiced.',
        route: '/check-in', icon: 'Mail', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'skill', day: 2,
        title: 'Common Humanity',
        description: 'When suffering today, remind yourself: "Other people feel this too. I am not alone."',
        reason: 'Remembering shared humanity reduces isolation and shame.',
        icon: 'Globe', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'reflection', day: 3,
        title: 'Inner Critic Audit',
        description: 'Write down your harshest self-criticism. Then rewrite it with the voice of a supportive friend.',
        reason: 'Awareness of the inner critic is the first step to softening it.',
        route: '/check-in', icon: 'MessageSquare', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'exercise', day: 4,
        title: 'Comfort Touch',
        description: 'Place your hand on your heart when feeling distressed. Take 3 slow breaths.',
        reason: 'Physical self-compassion activates your body\'s calming system.',
        icon: 'HandHeart', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'skill', day: 5,
        title: 'Mindful Self-Compassion Break',
        description: '"This is a moment of suffering. Suffering is part of life. May I be kind to myself."',
        reason: 'These three phrases activate all components of self-compassion.',
        icon: 'Sparkles', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'reflection', day: 6,
        title: 'Strengths Journal',
        description: 'Write three things you handled well recently, no matter how small.',
        reason: 'Acknowledging strengths counteracts the negativity bias of BPD.',
        route: '/check-in', icon: 'Flame', focusArea: focus, completed: false,
      });
      items.push({
        id: makeId(), type: 'strategy', day: 7,
        title: 'Self-Compassion Review',
        description: 'How did it feel to practice compassion toward yourself this week? What shifted?',
        reason: 'Reflection strengthens your compassion practice.',
        route: '/check-in', icon: 'Star', focusArea: focus, completed: false,
      });
      break;
  }

  return items;
}

export async function loadTherapyPlanState(): Promise<TherapyPlanState> {
  try {
    return await therapyPlanRepository.loadState();
  } catch (error) {
    console.log('[AdaptiveTherapy] Error loading state:', error);
  }
  return { currentPlan: null, previousPlans: [], lastGeneratedAt: 0 };
}

export async function saveTherapyPlanState(state: TherapyPlanState): Promise<void> {
  try {
    await therapyPlanRepository.saveState(state);
    console.log('[AdaptiveTherapy] State saved');
  } catch (error) {
    console.log('[AdaptiveTherapy] Error saving state:', error);
  }
}

export function generateWeeklyPlan(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): WeeklyTherapyPlan {
  const analysis = analyzePatterns(journalEntries, messageDrafts);
  const focusArea = determineFocusArea(analysis);
  const meta = FOCUS_AREA_META[focusArea];
  const { start, end } = getWeekBounds();
  const items = generatePlanItems(focusArea, analysis);
  const insight = generateInsight(analysis, focusArea);
  const encouragement = generateEncouragement(analysis);

  const plan: WeeklyTherapyPlan = {
    id: `plan_${Date.now()}`,
    weekStart: start,
    weekEnd: end,
    focusArea,
    focusLabel: meta.label,
    focusDescription: getFocusDescription(focusArea, analysis),
    items,
    personalInsight: insight,
    encouragement,
    generatedAt: Date.now(),
  };

  console.log('[AdaptiveTherapy] Generated plan:', plan.focusLabel, 'with', items.length, 'items');
  return plan;
}

function getFocusDescription(focus: TherapyFocusArea, analysis: ReturnType<typeof analyzePatterns>): string {
  switch (focus) {
    case 'distress_tolerance':
      return analysis.hasHighDistress
        ? 'Your distress levels have been elevated recently. This week focuses on building skills to ride the wave of intense emotions.'
        : 'Building your ability to tolerate difficult moments without making them worse.';
    case 'emotional_regulation':
      return analysis.hasAnger
        ? 'Strong emotions have been showing up frequently. This week focuses on understanding and managing them.'
        : 'Strengthening your ability to understand, label, and shift your emotional experiences.';
    case 'interpersonal_effectiveness':
      return analysis.hasRelationshipIssues
        ? 'Relationship patterns have been triggering you. This week focuses on building communication skills.'
        : 'Developing skills to communicate your needs while maintaining relationships and self-respect.';
    case 'mindfulness':
      return analysis.hasAnxiety
        ? 'Anxiety has been present for you recently. Mindfulness helps you return to the present moment.'
        : 'Cultivating present-moment awareness to build a foundation for all other skills.';
    case 'relationship_patterns':
      return 'Understanding and transforming the patterns that shape your closest relationships.';
    case 'self_compassion':
      return analysis.hasSadness
        ? 'You\'ve been carrying heavy emotions. This week is about treating yourself with the same kindness you\'d give a friend.'
        : 'Building a more compassionate relationship with yourself as a foundation for healing.';
  }
}

export function togglePlanItemCompleted(
  plan: WeeklyTherapyPlan,
  itemId: string,
): WeeklyTherapyPlan {
  return {
    ...plan,
    items: plan.items.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    ),
  };
}

export function getPlanProgress(plan: WeeklyTherapyPlan): { completed: number; total: number; percentage: number } {
  const total = plan.items.length;
  const completed = plan.items.filter(i => i.completed).length;
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export function shouldRegeneratePlan(state: TherapyPlanState): boolean {
  if (!state.currentPlan) return true;
  const { end } = getWeekBounds();
  if (state.currentPlan.weekEnd < Date.now()) return true;
  if (state.currentPlan.weekEnd !== end) return true;
  return false;
}
