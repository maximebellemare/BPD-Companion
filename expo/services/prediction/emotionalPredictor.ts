import { JournalEntry, MessageDraft } from '@/types';
import {
  SafetyState,
  SafetyPrediction,
  EscalationSignal,
  SafetyIntervention,
} from '@/types/safetyPredictor';

function hoursAgo(timestamp: number): number {
  return (Date.now() - timestamp) / (1000 * 60 * 60);
}

function detectRisingDistress(entries: JournalEntry[]): EscalationSignal | null {
  const recent = entries
    .filter(e => hoursAgo(e.timestamp) <= 24)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (recent.length < 2) return null;

  let rises = 0;
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].checkIn.intensityLevel > recent[i - 1].checkIn.intensityLevel + 1) {
      rises++;
    }
  }

  const maxIntensity = Math.max(...recent.map(e => e.checkIn.intensityLevel));

  if (rises >= 2 || (maxIntensity >= 8 && rises >= 1)) {
    return {
      id: 'rising_distress',
      type: 'rising_distress',
      label: 'Distress is climbing',
      description: `Your emotional intensity has risen ${rises} time${rises !== 1 ? 's' : ''} in the last 24 hours.`,
      weight: rises >= 3 ? 4 : maxIntensity >= 8 ? 3 : 2,
      timestamp: recent[recent.length - 1].timestamp,
    };
  }

  return null;
}

function detectRelationshipTriggers(entries: JournalEntry[]): EscalationSignal | null {
  const recent = entries.filter(e => hoursAgo(e.timestamp) <= 12);
  let relCount = 0;
  let latestTs = 0;

  recent.forEach(entry => {
    const hasRel = entry.checkIn.triggers.some(t => t.category === 'relationship');
    if (hasRel && entry.checkIn.intensityLevel >= 5) {
      relCount++;
      latestTs = Math.max(latestTs, entry.timestamp);
    }
  });

  if (relCount >= 1) {
    return {
      id: 'relationship_trigger',
      type: 'relationship_trigger',
      label: 'Relationship stress detected',
      description: relCount === 1
        ? 'A relationship trigger appeared recently with notable intensity.'
        : `${relCount} relationship-triggered moments in the last 12 hours.`,
      weight: relCount >= 3 ? 4 : relCount >= 2 ? 3 : 2,
      timestamp: latestTs || Date.now(),
    };
  }

  return null;
}

function detectRepeatedRewrites(drafts: MessageDraft[]): EscalationSignal | null {
  const recent = drafts.filter(d => hoursAgo(d.timestamp) <= 6);
  const rewrites = recent.filter(d => d.rewrittenText);

  if (rewrites.length >= 3) {
    return {
      id: 'repeated_rewrites',
      type: 'repeated_rewrites',
      label: 'Multiple message rewrites',
      description: `You've rewritten ${rewrites.length} messages in the last few hours. You might be in a heightened state.`,
      weight: rewrites.length >= 5 ? 4 : 3,
      timestamp: rewrites[rewrites.length - 1]?.timestamp ?? Date.now(),
    };
  }

  return null;
}

function detectAbandonmentConversation(entries: JournalEntry[]): EscalationSignal | null {
  const recent = entries.filter(e => hoursAgo(e.timestamp) <= 48);
  let hits = 0;
  let latestTs = 0;

  recent.forEach(entry => {
    const hasTrigger = entry.checkIn.triggers.some(t => {
      const l = t.label.toLowerCase();
      return l.includes('abandon') || l.includes('reject') || l.includes('ghost') || l.includes('ignored') || l.includes('left out');
    });

    const hasEmotion = entry.checkIn.emotions.some(e => {
      const l = e.label.toLowerCase();
      return l.includes('fear') || l.includes('panic') || l.includes('desperate') || l.includes('empty') || l.includes('worthless');
    });

    if (hasTrigger || (hasEmotion && entry.checkIn.intensityLevel >= 6)) {
      hits++;
      latestTs = Math.max(latestTs, entry.timestamp);
    }
  });

  if (hits >= 2) {
    return {
      id: 'abandonment_conversation',
      type: 'abandonment_conversation',
      label: 'Abandonment fears active',
      description: `Abandonment-related feelings have appeared ${hits} times recently. This pattern deserves gentle attention.`,
      weight: hits >= 4 ? 4 : 3,
      timestamp: latestTs || Date.now(),
    };
  }

  return null;
}

function detectCopingBurst(entries: JournalEntry[]): EscalationSignal | null {
  const last6h = entries.filter(e => hoursAgo(e.timestamp) <= 6);
  let copingUses = 0;

  last6h.forEach(entry => {
    copingUses += entry.checkIn.copingUsed?.length ?? 0;
  });

  if (copingUses >= 4) {
    return {
      id: 'coping_burst',
      type: 'coping_burst',
      label: 'Frequent coping tool usage',
      description: `You've used ${copingUses} coping tools in a short period. This may indicate rising stress.`,
      weight: copingUses >= 6 ? 3 : 2,
      timestamp: last6h[0]?.timestamp ?? Date.now(),
    };
  }

  return null;
}

function detectRapidCheckins(entries: JournalEntry[]): EscalationSignal | null {
  const last3h = entries.filter(e => hoursAgo(e.timestamp) <= 3);

  if (last3h.length >= 3) {
    return {
      id: 'rapid_checkins',
      type: 'rapid_checkins',
      label: 'Frequent check-ins',
      description: `${last3h.length} check-ins in the last 3 hours suggests you may be in distress.`,
      weight: last3h.length >= 4 ? 3 : 2,
      timestamp: last3h[0]?.timestamp ?? Date.now(),
    };
  }

  return null;
}

function detectHighUrgeCluster(entries: JournalEntry[]): EscalationSignal | null {
  const recent = entries.filter(e => hoursAgo(e.timestamp) <= 24);
  let highUrges = 0;
  let latestTs = 0;

  recent.forEach(entry => {
    const high = entry.checkIn.urges.filter(u => u.risk === 'high');
    if (high.length > 0) {
      highUrges += high.length;
      latestTs = Math.max(latestTs, entry.timestamp);
    }
  });

  if (highUrges >= 3) {
    return {
      id: 'high_urge_cluster',
      type: 'high_urge_cluster',
      label: 'Strong urges clustering',
      description: `${highUrges} high-risk urges detected in the last 24 hours.`,
      weight: highUrges >= 5 ? 4 : 3,
      timestamp: latestTs || Date.now(),
    };
  }

  return null;
}

function computeScore(signals: EscalationSignal[]): number {
  if (signals.length === 0) return 0;
  const total = signals.reduce((sum, s) => sum + s.weight, 0);
  return Math.min(total, 15);
}

function determineSafetyState(score: number): SafetyState {
  if (score >= 10) return 'critical';
  if (score >= 6) return 'high_distress';
  if (score >= 3) return 'elevated';
  return 'calm';
}

function computeTrend(entries: JournalEntry[]): SafetyPrediction['trend'] {
  const recent = entries
    .filter(e => hoursAgo(e.timestamp) <= 24)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (recent.length < 3) return 'unknown';

  const mid = Math.floor(recent.length / 2);
  const first = recent.slice(0, mid);
  const second = recent.slice(mid);

  const avg1 = first.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / first.length;
  const avg2 = second.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / second.length;

  const diff = avg2 - avg1;
  if (diff > 1) return 'escalating';
  if (diff < -1) return 'de_escalating';
  return 'stable';
}

function generateInterventions(state: SafetyState, signals: EscalationSignal[]): SafetyIntervention[] {
  const interventions: SafetyIntervention[] = [];
  const hasRelationship = signals.some(s => s.type === 'relationship_trigger' || s.type === 'abandonment_conversation');
  const hasRewrites = signals.some(s => s.type === 'repeated_rewrites');
  const hasDistress = signals.some(s => s.type === 'rising_distress' || s.type === 'high_urge_cluster');

  if (state === 'critical') {
    interventions.push({
      id: 'int_crisis_reg',
      type: 'crisis_regulation',
      title: 'Crisis Regulation',
      description: 'A structured path to help you through this intense moment.',
      route: '/crisis-regulation',
      icon: 'ShieldAlert',
      priority: 1,
      urgency: 'critical',
    });
  }

  if (state === 'critical' || state === 'high_distress') {
    interventions.push({
      id: 'int_grounding',
      type: 'grounding',
      title: 'Grounding Exercise',
      description: 'Reconnect with the present through your senses.',
      route: '/exercise?id=c2',
      icon: 'Anchor',
      priority: 2,
      urgency: state,
    });

    interventions.push({
      id: 'int_breathing',
      type: 'breathing',
      title: 'Slow Breathing',
      description: 'Calm your nervous system with intentional breaths.',
      route: '/exercise?id=c1',
      icon: 'Wind',
      priority: 3,
      urgency: state,
    });
  }

  if (hasRelationship) {
    interventions.push({
      id: 'int_rel_copilot',
      type: 'relationship_copilot',
      title: 'Relationship Copilot',
      description: 'Get guidance through this relationship moment.',
      route: '/relationship-copilot',
      icon: 'HeartHandshake',
      priority: state === 'critical' ? 4 : 2,
      urgency: state,
    });
  }

  if (hasRewrites || hasRelationship) {
    interventions.push({
      id: 'int_msg_pause',
      type: 'message_pause',
      title: 'Pause Before Sending',
      description: 'Give yourself space before responding.',
      route: '/message-guard',
      icon: 'Pause',
      priority: 4,
      urgency: state,
    });
  }

  if (state === 'elevated' || state === 'high_distress') {
    interventions.push({
      id: 'int_ai_reflect',
      type: 'ai_reflection',
      title: 'Reflect with AI Companion',
      description: 'Talk through what you\'re feeling in a safe space.',
      route: '/(tabs)/companion',
      icon: 'MessageCircleHeart',
      priority: 5,
      urgency: state,
    });
  }

  if (state === 'elevated' && !hasDistress) {
    interventions.push({
      id: 'int_checkin',
      type: 'check_in',
      title: 'Check In With Yourself',
      description: 'A brief check-in can help you understand what you need.',
      route: '/check-in',
      icon: 'ClipboardCheck',
      priority: 3,
      urgency: 'elevated',
    });
  }

  return interventions.sort((a, b) => a.priority - b.priority).slice(0, 4);
}

function generateNarrative(state: SafetyState, signals: EscalationSignal[], trend: SafetyPrediction['trend']): string | null {
  if (state === 'calm') return null;

  if (state === 'critical') {
    if (signals.some(s => s.type === 'abandonment_conversation')) {
      return "Abandonment fears are very intense right now. You are safe. Let's take this one step at a time.";
    }
    return "Things are feeling very intense right now. You've been through hard moments before — let's find something to help.";
  }

  if (state === 'high_distress') {
    if (trend === 'escalating') {
      return "Your distress has been rising. Catching this early is a strength — a grounding exercise might help right now.";
    }
    if (signals.some(s => s.type === 'relationship_trigger')) {
      return "Relationship stress is weighing on you. Taking a moment before reacting can protect your peace.";
    }
    return "You're carrying a lot right now. A small step — even one breath — can shift the moment.";
  }

  if (state === 'elevated') {
    if (signals.some(s => s.type === 'repeated_rewrites')) {
      return "You've been rewriting messages a lot. It's okay to step back and take your time.";
    }
    if (signals.some(s => s.type === 'coping_burst')) {
      return "You've been reaching for coping tools frequently. That shows awareness — make sure to rest too.";
    }
    if (trend === 'escalating') {
      return "Some early patterns suggest stress might be building. A small intervention now can prevent bigger distress later.";
    }
    return "Something may be starting to build. Being aware is already a powerful step.";
  }

  return null;
}

export function predictEmotionalSafety(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): SafetyPrediction {
  const signals: EscalationSignal[] = [];

  const risingDistress = detectRisingDistress(journalEntries);
  if (risingDistress) signals.push(risingDistress);

  const relTrigger = detectRelationshipTriggers(journalEntries);
  if (relTrigger) signals.push(relTrigger);

  const rewrites = detectRepeatedRewrites(messageDrafts);
  if (rewrites) signals.push(rewrites);

  const abandonment = detectAbandonmentConversation(journalEntries);
  if (abandonment) signals.push(abandonment);

  const copingBurst = detectCopingBurst(journalEntries);
  if (copingBurst) signals.push(copingBurst);

  const rapidCheckins = detectRapidCheckins(journalEntries);
  if (rapidCheckins) signals.push(rapidCheckins);

  const urgeCluster = detectHighUrgeCluster(journalEntries);
  if (urgeCluster) signals.push(urgeCluster);

  const score = computeScore(signals);
  const state = determineSafetyState(score);
  const trend = computeTrend(journalEntries);
  const interventions = generateInterventions(state, signals);
  const narrative = generateNarrative(state, signals, trend);

  console.log('[EmotionalPredictor] State:', state, 'Score:', score, 'Signals:', signals.length, 'Trend:', trend);

  return {
    state,
    score,
    signals,
    interventions,
    narrative,
    trend,
    lastUpdated: Date.now(),
  };
}
