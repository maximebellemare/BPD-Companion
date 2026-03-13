import { JournalEntry, MessageDraft } from '@/types';
import {
  GuardAlertLevel,
  GuardIntervention,
  ResponseSimulation,
  SpiralGuardResult,
  GuardSignalSummary,
} from '@/types/relationshipSpiral';
import { analyzeRelationshipSignals } from './relationshipSignalAnalyzer';

function calculateGuardScore(signals: GuardSignalSummary[]): number {
  if (signals.length === 0) return 0;
  const total = signals.reduce((sum, s) => sum + s.strength, 0);
  const overlap = signals.length >= 3 ? 1.3 : signals.length >= 2 ? 1.15 : 1;
  return Math.min(Math.round(total * overlap), 20);
}

function determineAlertLevel(score: number): GuardAlertLevel {
  if (score >= 12) return 'strong';
  if (score >= 7) return 'moderate';
  if (score >= 3) return 'gentle';
  return 'none';
}

function buildInterventions(signals: GuardSignalSummary[], alertLevel: GuardAlertLevel): GuardIntervention[] {
  const interventions: GuardIntervention[] = [];

  const hasComm = signals.some(s => s.category === 'communication');
  const hasAbandonment = signals.some(s => s.category === 'abandonment');
  const hasReassurance = signals.some(s => s.category === 'reassurance');
  const hasMessaging = signals.some(s => s.category === 'messaging');
  const hasConflict = signals.some(s => s.category === 'conflict');
  const hasDistress = signals.some(s => s.category === 'distress');

  if (hasComm || hasMessaging || alertLevel === 'strong') {
    interventions.push({
      id: 'guard_int_pause',
      type: 'pause',
      title: 'Pause before responding',
      description: 'Even 2 minutes can change what you decide to say.',
      route: '/(tabs)/messages',
      icon: 'Timer',
      priority: 1,
    });
  }

  if (hasAbandonment || hasDistress || hasConflict) {
    interventions.push({
      id: 'guard_int_ground',
      type: 'ground',
      title: 'Ground yourself first',
      description: 'Reconnect with the present before making decisions.',
      route: '/exercise?id=c2',
      icon: 'Anchor',
      priority: 2,
    });
  }

  if (hasMessaging || hasComm) {
    interventions.push({
      id: 'guard_int_rewrite',
      type: 'rewrite',
      title: 'Rewrite message calmly',
      description: 'Use the secure rewrite to communicate from a calmer place.',
      route: '/message-guard',
      icon: 'PenLine',
      priority: 3,
    });
  }

  if (hasMessaging || hasReassurance) {
    interventions.push({
      id: 'guard_int_simulate',
      type: 'simulate',
      title: 'Simulate response outcomes',
      description: 'See how different responses might play out before acting.',
      route: '/relationship-spiral',
      icon: 'Zap',
      priority: 4,
    });
  }

  if (signals.length >= 2 || alertLevel === 'moderate' || alertLevel === 'strong') {
    interventions.push({
      id: 'guard_int_companion',
      type: 'companion',
      title: 'Talk to AI Companion',
      description: 'Process what you\'re feeling before responding.',
      route: '/(tabs)/companion',
      icon: 'Sparkles',
      priority: 5,
    });
  }

  if (hasConflict || hasAbandonment) {
    interventions.push({
      id: 'guard_int_journal',
      type: 'journal',
      title: 'Journal what you feel',
      description: 'Writing it out can reduce the pressure to act immediately.',
      route: '/check-in',
      icon: 'BookOpen',
      priority: 6,
    });
  }

  if (hasDistress && interventions.length > 0) {
    interventions.push({
      id: 'guard_int_breathe',
      type: 'breathe',
      title: 'Take a few slow breaths',
      description: '60 seconds of slow breathing can shift your nervous system.',
      route: '/exercise?id=c1',
      icon: 'Wind',
      priority: 7,
    });
  }

  if (interventions.length === 0 && signals.length > 0) {
    interventions.push({
      id: 'guard_int_breathe_default',
      type: 'breathe',
      title: 'Take a breathing pause',
      description: 'A few slow breaths can help you feel more centered.',
      route: '/exercise?id=c1',
      icon: 'Wind',
      priority: 1,
    });
  }

  return interventions.sort((a, b) => a.priority - b.priority);
}

function buildResponseSimulations(signals: GuardSignalSummary[]): ResponseSimulation[] {
  if (signals.length === 0) return [];

  const hasComm = signals.some(s => s.category === 'communication');
  const hasAbandonment = signals.some(s => s.category === 'abandonment');
  const hasReassurance = signals.some(s => s.category === 'reassurance');

  let urgentExample = 'I need you to tell me what\'s going on right now. Why aren\'t you responding? This silence is killing me.';
  let avoidantExample = 'Whatever. It\'s fine. I don\'t even care anymore. Forget I said anything.';
  let secureExample = 'I noticed I\'m feeling anxious about the silence. I want to give you space and also be honest about how I feel.';

  if (hasAbandonment) {
    urgentExample = 'Are you leaving? Just tell me. I can\'t handle not knowing. Please don\'t abandon me.';
    avoidantExample = 'You know what, it\'s fine. People leave. I should have expected this.';
    secureExample = 'I\'m noticing my fear of being left is very active right now. I want to share that without putting pressure on you.';
  } else if (hasReassurance) {
    urgentExample = 'Do you still care about me? I need to know we\'re okay. Please just tell me everything is fine.';
    avoidantExample = 'I guess I was wrong to think this meant something. My mistake.';
    secureExample = 'I\'m feeling uncertain right now and want reassurance, but I also know I can sit with this feeling for a moment.';
  } else if (hasComm) {
    urgentExample = 'Why haven\'t you responded? I\'ve been waiting. Did I do something wrong?';
    avoidantExample = 'Clearly you\'re busy. I\'ll stop bothering you.';
    secureExample = 'I noticed I\'m reading into the silence. I want to check in without assuming the worst.';
  }

  return [
    {
      id: 'sim_urgent',
      type: 'urgent',
      label: 'Urgent response',
      emoji: '⚡',
      exampleMessage: urgentExample,
      emotionalImpact: 'May temporarily relieve anxiety but often increases dependency on their response for your sense of safety.',
      relationshipImpact: 'Can put pressure on the other person and may create a push-pull dynamic that increases tension.',
      color: '#E17055',
      isRecommended: false,
    },
    {
      id: 'sim_avoidant',
      type: 'avoidant',
      label: 'Avoidant response',
      emoji: '🧊',
      exampleMessage: avoidantExample,
      emotionalImpact: 'May feel self-protective in the moment but leaves your real feelings unexpressed and can deepen loneliness.',
      relationshipImpact: 'Can signal that you don\'t care even when you do, making the other person feel shut out or confused.',
      color: '#636E72',
      isRecommended: false,
    },
    {
      id: 'sim_secure',
      type: 'secure',
      label: 'Secure response',
      emoji: '🌿',
      exampleMessage: secureExample,
      emotionalImpact: 'May feel vulnerable at first but tends to reduce anxiety over time and build genuine self-trust.',
      relationshipImpact: 'Creates space for honest dialogue and helps both people feel respected and seen.',
      color: '#6B9080',
      isRecommended: true,
    },
  ];
}

function generatePrimaryMessage(alertLevel: GuardAlertLevel, signals: GuardSignalSummary[]): string | null {
  if (signals.length === 0) return null;

  const hasComm = signals.some(s => s.category === 'communication');
  const hasAbandonment = signals.some(s => s.category === 'abandonment');
  const hasReassurance = signals.some(s => s.category === 'reassurance');
  const hasMessaging = signals.some(s => s.category === 'messaging');
  const hasConflict = signals.some(s => s.category === 'conflict');

  if (alertLevel === 'strong') {
    if (hasComm || hasAbandonment) {
      return 'This may be a moment where communication uncertainty is triggering anxiety. Slowing down before responding could protect both you and the relationship.';
    }
    return 'Several signals suggest relationship stress is building quickly. A pause — even a short one — could make a real difference right now.';
  }

  if (alertLevel === 'moderate') {
    if (hasReassurance && hasMessaging) {
      return 'Reassurance-seeking urges and messaging activity are both elevated. Grounding first may help you respond from a calmer, clearer place.';
    }
    if (hasConflict) {
      return 'A conflict-shame pattern seems to be emerging. Being gentle with yourself right now matters more than getting the response perfect.';
    }
    return 'This looks like a relationship-triggered emotional spike. A small pause may help you respond rather than react.';
  }

  if (hasComm) {
    return 'Communication uncertainty appears to be triggering some anxiety. Being aware of this gives you more choice in how you respond.';
  }
  if (hasReassurance) {
    return 'The urge to seek reassurance has been showing up. This is a familiar pattern — noticing it is itself a strength.';
  }

  return 'Some relationship-related patterns are showing up. Taking a moment for yourself may help.';
}

function generateSupportNarrative(alertLevel: GuardAlertLevel, signals: GuardSignalSummary[]): string | null {
  if (signals.length === 0) return null;

  if (alertLevel === 'strong') {
    return 'You\'re not doing anything wrong by feeling this way. These patterns are common and recognizing them is already a form of self-care.';
  }

  if (alertLevel === 'moderate') {
    return 'Noticing these patterns early gives you more choice in how you respond. That awareness is powerful.';
  }

  return 'You don\'t need to solve everything right now. Just noticing what\'s happening is a good start.';
}

export function runSpiralGuard(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): SpiralGuardResult {
  const signals = analyzeRelationshipSignals(journalEntries, messageDrafts);
  const score = calculateGuardScore(signals);
  const alertLevel = determineAlertLevel(score);
  const interventions = buildInterventions(signals, alertLevel);
  const simulations = buildResponseSimulations(signals);
  const primaryMessage = generatePrimaryMessage(alertLevel, signals);
  const supportNarrative = generateSupportNarrative(alertLevel, signals);
  const shouldShowGuard = signals.length > 0 && alertLevel !== 'none';

  console.log('[SpiralGuard] Score:', score, 'Alert:', alertLevel, 'Signals:', signals.length, 'Show:', shouldShowGuard);

  return {
    alertLevel,
    signals,
    interventions,
    simulations,
    primaryMessage,
    supportNarrative,
    score,
    shouldShowGuard,
    lastAnalyzed: Date.now(),
  };
}
