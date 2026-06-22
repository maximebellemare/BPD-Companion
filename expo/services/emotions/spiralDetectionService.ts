import { JournalEntry, MessageDraft } from '@/types';
import { AIConversation } from '@/types/ai';
import { SmartJournalEntry } from '@/types/journalEntry';
import {
  SpiralRiskLevel,
  SpiralSignal,
  SpiralSignalType,
  SpiralIntervention,
  SpiralDetectionResult,
  SpiralWeeklyInsight,
  SpiralPausePromptConfig,
} from '@/types/spiral';

function withinHours(timestamp: number, hours: number): boolean {
  return Date.now() - timestamp < hours * 60 * 60 * 1000;
}

function withinDays(timestamp: number, days: number): boolean {
  return Date.now() - timestamp < days * 24 * 60 * 60 * 1000;
}

function getHour(timestamp: number): number {
  return new Date(timestamp).getHours();
}

function entryText(entry: JournalEntry): string {
  return [
    entry.reflection ?? '',
    entry.checkIn.notes ?? '',
    ...entry.checkIn.triggers.map(trigger => trigger.label),
    ...entry.checkIn.emotions.map(emotion => emotion.label),
    ...entry.checkIn.urges.map(urge => urge.label),
  ].join(' ').toLowerCase();
}

function conversationText(conversation: AIConversation): string {
  return [
    conversation.title,
    conversation.preview,
    ...conversation.tags,
    ...conversation.messages.filter(message => message.role === 'user').map(message => message.content),
  ].join(' ').toLowerCase();
}

function includesAny(text: string, terms: string[]): boolean {
  return terms.some(term => text.includes(term));
}

function extractPatternFeatures(
  entries: JournalEntry[],
  drafts: MessageDraft[],
  conversations: AIConversation[],
): Set<string> {
  const features = new Set<string>();
  const text = [
    ...entries.map(entryText),
    ...drafts.map(draft => `${draft.originalText} ${draft.rewrittenText ?? ''}`.toLowerCase()),
    ...conversations.map(conversationText),
  ].join(' ');

  entries.forEach(entry => {
    entry.checkIn.emotions.forEach(emotion => {
      const label = emotion.label.trim().toLowerCase();
      if (label) features.add(`emotion:${label}`);
    });
    entry.checkIn.triggers.forEach(trigger => {
      const label = trigger.label.trim().toLowerCase();
      if (label) features.add(`trigger:${label}`);
      if (trigger.category === 'relationship') features.add('category:relationship');
    });
    entry.checkIn.urges.forEach(urge => {
      const label = urge.label.trim().toLowerCase();
      if (label) features.add(`urge:${label}`);
    });
    if (entry.checkIn.intensityLevel >= 7) features.add('intensity:high');
  });

  if (includesAny(text, ['conflict', 'fight', 'argument', 'criticized', 'criticism'])) features.add('theme:conflict');
  if (includesAny(text, ['abandon', 'ignored', 'no reply', 'delayed reply', 'rejected', 'ghosted'])) features.add('theme:abandonment');
  if (includesAny(text, ['shame', 'ashamed', 'worthless', 'too much', 'my fault'])) features.add('theme:shame');
  if (includesAny(text, ['sleep', 'tired', 'exhausted', 'insomnia', 'no sleep', 'poor sleep'])) features.add('theme:sleep');
  if (includesAny(text, ['text again', 'call repeatedly', 'send', 'reply', 'react'])) features.add('theme:reactive_message');
  if (drafts.some(draft => draft.sent && !draft.paused)) features.add('message:sent_without_pause');
  if (drafts.some(draft => draft.paused || draft.outcome === 'not_sent')) features.add('message:pause_attempt');

  return features;
}

function countFeatureOverlap(a: Set<string>, b: Set<string>): number {
  let overlap = 0;
  a.forEach(feature => {
    if (b.has(feature)) overlap += 1;
  });
  return overlap;
}

function detectRapidDistressEscalation(entries: JournalEntry[]): SpiralSignal | null {
  const recent = entries
    .filter(e => withinHours(e.timestamp, 24))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (recent.length < 2) return null;

  let consecutiveRises = 0;
  let maxJump = 0;

  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i].checkIn.intensityLevel - recent[i - 1].checkIn.intensityLevel;
    if (diff > 0) {
      consecutiveRises++;
      if (diff > maxJump) maxJump = diff;
    } else {
      consecutiveRises = 0;
    }
  }

  const latestIntensity = recent[recent.length - 1].checkIn.intensityLevel;
  const firstIntensity = recent[0].checkIn.intensityLevel;
  const totalClimb = latestIntensity - firstIntensity;

  if (consecutiveRises >= 2 || totalClimb >= 3 || maxJump >= 4) {
    const weight = Math.min((consecutiveRises * 1.5) + (totalClimb > 4 ? 2 : 0) + (maxJump >= 4 ? 1.5 : 0), 6);
    return {
      id: 'sp_rapid_escalation',
      type: 'rapid_distress_escalation',
      label: 'Distress climbing quickly',
      narrative: 'Your distress appears to be rising across recent entries. Slowing down now may help reduce escalation.',
      weight,
      dataPoints: recent.length,
      detectedAt: Date.now(),
    };
  }

  return null;
}

function detectRepeatedRejectionLanguage(entries: JournalEntry[]): SpiralSignal | null {
  const recent = entries.filter(e => withinHours(e.timestamp, 48));
  let hits = 0;

  const rejectionKeywords = [
    'reject', 'abandon', 'ignored', 'ghosted', 'left out', 'unwanted',
    'not enough', 'unlovable', 'don\'t care', 'doesn\'t care', 'pulled away',
    'replaced', 'forgotten', 'worthless', 'disposable',
  ];

  recent.forEach(entry => {
    const triggerMatch = entry.checkIn.triggers.some(t => {
      const l = t.label.toLowerCase();
      return rejectionKeywords.some(kw => l.includes(kw)) || t.category === 'relationship';
    });

    const emotionMatch = entry.checkIn.emotions.some(e => {
      const l = e.label.toLowerCase();
      return l.includes('reject') || l.includes('abandon') || l.includes('fear') || l.includes('panic');
    });

    if (triggerMatch && emotionMatch) hits += 2;
    else if (triggerMatch || emotionMatch) hits += 1;
  });

  if (hits >= 3) {
    return {
      id: 'sp_rejection_language',
      type: 'repeated_rejection_language',
      label: 'Rejection themes recurring',
      narrative: 'Rejection or abandonment themes have appeared repeatedly. This may be a useful moment to pause before the feeling grows.',
      weight: Math.min(hits * 0.9, 5),
      dataPoints: hits,
      detectedAt: Date.now(),
    };
  }

  return null;
}

function detectRelationshipConflictLoop(entries: JournalEntry[], drafts: MessageDraft[]): SpiralSignal | null {
  const recentEntries = entries.filter(e => withinHours(e.timestamp, 48));
  const recentDrafts = drafts.filter(d => withinHours(d.timestamp, 48));

  let conflictPoints = 0;

  recentEntries.forEach(entry => {
    const isRelationship = entry.checkIn.triggers.some(t => t.category === 'relationship');
    if (isRelationship && entry.checkIn.intensityLevel >= 6) conflictPoints += 2;
    else if (isRelationship) conflictPoints += 1;
  });

  const emotionalDrafts = recentDrafts.filter(d => d.rewrittenText || d.paused);
  conflictPoints += emotionalDrafts.length * 1.5;

  const sentUnrewritten = recentDrafts.filter(d => d.sent && !d.rewrittenText && !d.paused);
  conflictPoints += sentUnrewritten.length * 0.5;

  if (conflictPoints >= 5) {
    return {
      id: 'sp_conflict_loop',
      type: 'relationship_conflict_loop',
      label: 'Conflict cycle active',
      narrative: 'A relationship conflict cycle may be active. Pausing before responding could help interrupt the pattern.',
      weight: Math.min(conflictPoints * 0.7, 6),
      dataPoints: Math.round(conflictPoints),
      detectedAt: Date.now(),
    };
  }

  return null;
}

function detectLateNightSpike(entries: JournalEntry[]): SpiralSignal | null {
  const recent = entries.filter(e => withinHours(e.timestamp, 48));
  let lateNightIntense = 0;

  recent.forEach(entry => {
    const hour = getHour(entry.timestamp);
    if ((hour >= 22 || hour <= 4) && entry.checkIn.intensityLevel >= 6) {
      lateNightIntense++;
    }
  });

  if (lateNightIntense >= 2) {
    return {
      id: 'sp_late_night_spike',
      type: 'late_night_spike',
      label: 'Late-night emotional intensity',
      narrative: 'Strong emotions may feel more overwhelming at night. A short pause may help you avoid making big decisions while activated.',
      weight: Math.min(lateNightIntense * 1.3, 4),
      dataPoints: lateNightIntense,
      detectedAt: Date.now(),
    };
  }

  return null;
}

function detectEmotionalVolatility(entries: JournalEntry[]): SpiralSignal | null {
  const recent = entries
    .filter(e => withinHours(e.timestamp, 36))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (recent.length < 3) return null;

  let swingCount = 0;
  let maxSwing = 0;

  for (let i = 1; i < recent.length; i++) {
    const diff = Math.abs(recent[i].checkIn.intensityLevel - recent[i - 1].checkIn.intensityLevel);
    if (diff >= 3) {
      swingCount++;
      if (diff > maxSwing) maxSwing = diff;
    }
  }

  if (swingCount >= 2 || maxSwing >= 5) {
    return {
      id: 'sp_emotional_volatility',
      type: 'emotional_volatility',
      label: 'Emotional shifts intensifying',
      narrative: 'Your emotions appear to be shifting rapidly. Grounding may help before the pattern escalates.',
      weight: Math.min(swingCount * 1.2 + (maxSwing >= 5 ? 1.5 : 0), 5),
      dataPoints: swingCount,
      detectedAt: Date.now(),
    };
  }

  return null;
}

function detectShameCascade(entries: JournalEntry[]): SpiralSignal | null {
  const recent = entries.filter(e => withinHours(e.timestamp, 48));
  let shameHits = 0;

  const shameKeywords = ['shame', 'guilt', 'worthless', 'bad person', 'hate myself', 'disgusting', 'failure'];

  recent.forEach(entry => {
    const hasShame = entry.checkIn.emotions.some(e => {
      const l = e.label.toLowerCase();
      return shameKeywords.some(kw => l.includes(kw));
    });
    const hasTrigger = entry.checkIn.triggers.some(t => {
      const l = t.label.toLowerCase();
      return shameKeywords.some(kw => l.includes(kw));
    });

    if (hasShame && entry.checkIn.intensityLevel >= 6) shameHits += 2;
    else if (hasShame || hasTrigger) shameHits += 1;
  });

  if (shameHits >= 3) {
    return {
      id: 'sp_shame_cascade',
      type: 'shame_cascade',
      label: 'Shame pattern building',
      narrative: 'Shame appears to be building. It may help to treat this as an emotion, not a verdict about who you are.',
      weight: Math.min(shameHits * 1.1, 5),
      dataPoints: shameHits,
      detectedAt: Date.now(),
    };
  }

  return null;
}

function detectUrgeIntensification(entries: JournalEntry[]): SpiralSignal | null {
  const recent = entries
    .filter(e => withinHours(e.timestamp, 36))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (recent.length < 2) return null;

  let highRiskUrgeCount = 0;
  let urgeLabels: string[] = [];

  recent.forEach(entry => {
    entry.checkIn.urges.forEach(u => {
      if (u.risk === 'high') {
        highRiskUrgeCount++;
        urgeLabels.push(u.label);
      }
    });
  });

  if (highRiskUrgeCount >= 3) {
    return {
      id: 'sp_urge_intensification',
      type: 'urge_intensification',
      label: 'Strong urges recurring',
      narrative: 'Strong urges have been showing up repeatedly. Naming them may create a little more space before acting.',
      weight: Math.min(highRiskUrgeCount * 1.0, 5),
      dataPoints: highRiskUrgeCount,
      detectedAt: Date.now(),
    };
  }

  return null;
}

function detectCopingAbandonment(entries: JournalEntry[]): SpiralSignal | null {
  const recent = entries.filter(e => withinHours(e.timestamp, 72));
  const older = entries.filter(e => !withinHours(e.timestamp, 72) && withinDays(e.timestamp, 14));

  if (recent.length < 2 || older.length < 3) return null;

  const recentCopingRate = recent.filter(e => e.checkIn.copingUsed && e.checkIn.copingUsed.length > 0).length / recent.length;
  const olderCopingRate = older.filter(e => e.checkIn.copingUsed && e.checkIn.copingUsed.length > 0).length / older.length;

  const recentAvgDistress = recent.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / recent.length;

  if (olderCopingRate > 0.3 && recentCopingRate < olderCopingRate * 0.4 && recentAvgDistress >= 5) {
    return {
      id: 'sp_coping_abandonment',
      type: 'coping_abandonment',
      label: 'Coping tools dropped off',
      narrative: 'Coping tools appear less often while distress is rising. A small support step may help right now.',
      weight: 3,
      dataPoints: recent.length,
      detectedAt: Date.now(),
    };
  }

  return null;
}

function detectIsolationPattern(entries: JournalEntry[]): SpiralSignal | null {
  const recent = entries.filter(e => withinDays(e.timestamp, 5));
  let isolationHits = 0;

  const isolationKeywords = ['alone', 'isolat', 'withdraw', 'hiding', 'no one', 'nobody', 'lonely', 'disconnect'];

  recent.forEach(entry => {
    const hasIsolation = entry.checkIn.emotions.some(e =>
      isolationKeywords.some(kw => e.label.toLowerCase().includes(kw))
    ) || entry.checkIn.triggers.some(t =>
      isolationKeywords.some(kw => t.label.toLowerCase().includes(kw))
    );

    if (hasIsolation) isolationHits++;
  });

  if (isolationHits >= 2) {
    return {
      id: 'sp_isolation_pattern',
      type: 'isolation_pattern',
      label: 'Withdrawal pattern emerging',
      narrative: 'Withdrawal has been showing up in your entries. A small moment of connection may help soften this pattern.',
      weight: Math.min(isolationHits * 1.2, 4),
      dataPoints: isolationHits,
      detectedAt: Date.now(),
    };
  }

  return null;
}

function detectPoorSleepVulnerability(entries: JournalEntry[]): SpiralSignal | null {
  const recent = entries.filter(e => withinDays(e.timestamp, 5));
  if (recent.length < 2) return null;

  let sleepMentions = 0;
  let highIntensityAfterSleep = 0;

  recent.forEach(entry => {
    const text = entryText(entry);
    const hasSleepSignal = includesAny(text, ['poor sleep', 'bad sleep', 'no sleep', 'insomnia', 'exhausted', 'tired', 'sleep']);
    if (!hasSleepSignal) return;
    sleepMentions++;
    if (entry.checkIn.intensityLevel >= 6) highIntensityAfterSleep++;
  });

  if (sleepMentions >= 2 && highIntensityAfterSleep >= 1) {
    return {
      id: 'sp_poor_sleep_vulnerability',
      type: 'poor_sleep_vulnerability',
      label: 'Sleep may be affecting vulnerability',
      narrative: 'Sleep or exhaustion has appeared near recent intense check-ins. This may be a moment for extra gentleness and fewer big decisions.',
      weight: Math.min(sleepMentions + highIntensityAfterSleep, 5),
      dataPoints: sleepMentions,
      detectedAt: Date.now(),
    };
  }

  return null;
}

function detectConversationSpiralLanguage(conversations: AIConversation[]): SpiralSignal | null {
  const recent = conversations.filter(conversation => withinHours(conversation.updatedAt, 72));
  if (recent.length === 0) return null;

  let hits = 0;
  const spiralTerms = [
    'spiraling',
    'spiral',
    'can\'t stop thinking',
    'cannot stop thinking',
    'what if',
    'they hate me',
    'they are leaving',
    'i need to text',
    'i want to text',
    'i feel abandoned',
    'i feel rejected',
    'ignored',
    'no reply',
  ];

  recent.forEach(conversation => {
    const text = conversationText(conversation);
    const termHits = spiralTerms.filter(term => text.includes(term)).length;
    if (termHits > 0) hits += Math.min(termHits, 3);
  });

  if (hits >= 3) {
    return {
      id: 'sp_conversation_spiral_language',
      type: 'conversation_spiral_language',
      label: 'Spiral language in recent conversations',
      narrative: 'Recent Companion conversations include language that often appears when emotions are starting to loop.',
      weight: Math.min(hits * 0.9, 5),
      dataPoints: hits,
      detectedAt: Date.now(),
    };
  }

  return null;
}

function detectFamiliarSpiralPattern(
  entries: JournalEntry[],
  drafts: MessageDraft[],
  conversations: AIConversation[],
): SpiralSignal | null {
  const recentEntries = entries.filter(e => withinHours(e.timestamp, 72));
  const recentDrafts = drafts.filter(d => withinHours(d.timestamp, 72));
  const recentConversations = conversations.filter(c => withinHours(c.updatedAt, 72));

  if (recentEntries.length + recentDrafts.length + recentConversations.length < 2) return null;

  const olderEntries = entries.filter(e => !withinHours(e.timestamp, 72) && withinDays(e.timestamp, 45));
  const olderDrafts = drafts.filter(d => !withinHours(d.timestamp, 72) && withinDays(d.timestamp, 45));
  const olderConversations = conversations.filter(c => !withinHours(c.updatedAt, 72) && withinDays(c.updatedAt, 45));
  if (olderEntries.length + olderDrafts.length + olderConversations.length < 3) return null;

  const recentFeatures = extractPatternFeatures(recentEntries, recentDrafts, recentConversations);
  if (recentFeatures.size < 2) return null;

  const matchingOlderEpisodes = olderEntries.filter(entry => {
    const windowStart = entry.timestamp - 12 * 60 * 60 * 1000;
    const windowEnd = entry.timestamp + 12 * 60 * 60 * 1000;
    const pairedDrafts = olderDrafts.filter(draft => draft.timestamp >= windowStart && draft.timestamp <= windowEnd);
    const pairedConversations = olderConversations.filter(conversation => conversation.updatedAt >= windowStart && conversation.updatedAt <= windowEnd);
    const features = extractPatternFeatures([entry], pairedDrafts, pairedConversations);
    const overlap = countFeatureOverlap(recentFeatures, features);
    return overlap >= 2 && entry.checkIn.intensityLevel >= 6;
  });

  if (matchingOlderEpisodes.length < 2) return null;

  const highDistressMatches = matchingOlderEpisodes.filter(entry => entry.checkIn.intensityLevel >= 7).length;
  const overlapStrength = matchingOlderEpisodes.reduce((sum, entry) => {
    const features = extractPatternFeatures([entry], [], []);
    return sum + countFeatureOverlap(recentFeatures, features);
  }, 0);

  return {
    id: 'sp_familiar_pattern',
    type: 'familiar_spiral_pattern',
    label: 'Familiar pattern detected',
    narrative: 'This resembles a pattern that previously led to distress. It may be a good moment to slow down before the next step.',
    weight: Math.min(4 + highDistressMatches + overlapStrength * 0.25, 7),
    dataPoints: matchingOlderEpisodes.length,
    detectedAt: Date.now(),
  };
}

function calculateRiskLevel(signals: SpiralSignal[]): SpiralRiskLevel {
  if (signals.length === 0) return 'low';

  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);

  if (totalWeight >= 10 || signals.length >= 4) return 'high';
  if (totalWeight >= 5 || signals.length >= 2) return 'moderate';
  return 'low';
}

function calculateConfidence(signals: SpiralSignal[]): number {
  if (signals.length === 0) return 0;
  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
  const totalData = signals.reduce((sum, s) => sum + s.dataPoints, 0);
  const base = Math.min(totalWeight / 12, 0.8);
  const dataBonus = Math.min(totalData / 25, 0.2);
  return Math.min(base + dataBonus, 1);
}

function generateInterventions(signals: SpiralSignal[], riskLevel: SpiralRiskLevel): SpiralIntervention[] {
  const interventions: SpiralIntervention[] = [
    {
      id: 'sp_int_calm_now',
      type: 'grounding',
      title: 'Calm Me Down',
      description: 'Use a short grounding flow before this escalates.',
      route: '/grounding-mode',
      icon: 'Anchor',
      priority: 1,
    },
    {
      id: 'sp_int_companion',
      type: 'ai_companion',
      title: 'Companion',
      description: 'Talk through what is happening before it builds.',
      route: '/(tabs)/companion',
      icon: 'Sparkles',
      priority: 2,
    },
    {
      id: 'sp_int_dont_send_it',
      type: 'message_guard',
      title: 'Don’t Send It',
      description: 'Check a message before sending from intensity.',
      route: '/dont-send-it',
      icon: 'PenLine',
      priority: 3,
    },
  ];
  const types = new Set(signals.map(s => s.type));

  if (riskLevel === 'high') {
    interventions.push({
      id: 'sp_int_grounding_mode',
      type: 'grounding',
      title: 'Open Calm Me Down',
      description: 'A calm, simplified space to help you settle.',
      route: '/grounding-mode',
      icon: 'Anchor',
      priority: 4,
    });
  }

  if (types.has('rapid_distress_escalation') || types.has('emotional_volatility')) {
    interventions.push({
      id: 'sp_int_breathing',
      type: 'breathing',
      title: 'Breathing exercise',
      description: 'A few slow breaths to calm your nervous system.',
      route: '/exercise?id=c1',
      icon: 'Wind',
      priority: 5,
    });
  }

  if (types.has('relationship_conflict_loop') || types.has('repeated_rejection_language')) {
    interventions.push({
      id: 'sp_int_pause',
      type: 'message_guard',
      title: 'Don’t Send It',
      description: 'Pause and check a message before sending.',
      route: '/dont-send-it',
      icon: 'Timer',
      priority: 6,
    });
  }

  if (types.has('shame_cascade')) {
    interventions.push({
      id: 'sp_int_dbt',
      type: 'dbt_tool',
      title: 'Shame recovery tool',
      description: 'Work through shame step by step.',
      route: '/journal-guided',
      icon: 'Shield',
      priority: 7,
    });
  }

  if (types.has('relationship_conflict_loop') || types.has('repeated_rejection_language')) {
    interventions.push({
      id: 'sp_int_copilot',
      type: 'relationship_copilot',
      title: 'Relationship Copilot',
      description: 'Navigate what\'s happening with support.',
      route: '/relationship-copilot',
      icon: 'HeartHandshake',
      priority: 8,
    });
  }

  interventions.push({
    id: 'sp_int_journal',
    type: 'journal',
    title: 'Quick journal reflection',
    description: 'Write it out to process what you\'re feeling.',
    route: '/journal-write',
    icon: 'BookOpen',
    priority: 9,
  });

  const unique = new Map<string, SpiralIntervention>();
  interventions
    .sort((a, b) => a.priority - b.priority)
    .forEach(intervention => {
      if (!unique.has(intervention.route)) unique.set(intervention.route, intervention);
    });
  return [...unique.values()];
}

function generateNarrative(riskLevel: SpiralRiskLevel, signals: SpiralSignal[]): string | null {
  if (signals.length === 0) return null;

  const types = new Set(signals.map(s => s.type));

  if (riskLevel === 'high') {
    if (types.has('familiar_spiral_pattern')) {
      return 'We’ve seen similar patterns before. This resembles a pattern that previously led to distress, so slowing down now may help.';
    }
    if (signals.length >= 2) {
      return 'We’ve seen similar patterns before. You may be entering a period of heightened emotional vulnerability, so this could be a good moment to slow down before acting.';
    }
    if (types.has('relationship_conflict_loop') && types.has('rapid_distress_escalation')) {
      return 'Things appear emotionally intense right now, especially around a relationship. This may be a moment to slow down and take care of yourself first.';
    }
    if (types.has('shame_cascade')) {
      return 'Shame seems to be building strongly. Right now, being gentle with yourself may matter more than solving everything.';
    }
    return 'Multiple signs suggest your emotions may be escalating. A brief pause may help reduce the chance of spiraling further.';
  }

  if (riskLevel === 'moderate') {
    if (types.has('late_night_spike')) {
      return 'Emotions tend to feel more overwhelming at night. Would a quick grounding reset help before bed?';
    }
    if (types.has('repeated_rejection_language')) {
      return 'Rejection themes have been showing up in your recent entries. Noticing this early may help you choose a steadier next step.';
    }
    if (types.has('emotional_volatility')) {
      return 'Your emotions have been shifting more than usual. A moment of stillness may help you find your center.';
    }
    return 'Today appears emotionally intense. Would a quick grounding reset help?';
  }

  return null;
}

export function detectSpiral(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
  conversations: AIConversation[] = [],
): SpiralDetectionResult {
  const signals: SpiralSignal[] = [];

  const rapid = detectRapidDistressEscalation(journalEntries);
  if (rapid) signals.push(rapid);

  const rejection = detectRepeatedRejectionLanguage(journalEntries);
  if (rejection) signals.push(rejection);

  const conflict = detectRelationshipConflictLoop(journalEntries, messageDrafts);
  if (conflict) signals.push(conflict);

  const lateNight = detectLateNightSpike(journalEntries);
  if (lateNight) signals.push(lateNight);

  const volatility = detectEmotionalVolatility(journalEntries);
  if (volatility) signals.push(volatility);

  const shame = detectShameCascade(journalEntries);
  if (shame) signals.push(shame);

  const urge = detectUrgeIntensification(journalEntries);
  if (urge) signals.push(urge);

  const coping = detectCopingAbandonment(journalEntries);
  if (coping) signals.push(coping);

  const isolation = detectIsolationPattern(journalEntries);
  if (isolation) signals.push(isolation);

  const sleep = detectPoorSleepVulnerability(journalEntries);
  if (sleep) signals.push(sleep);

  const conversation = detectConversationSpiralLanguage(conversations);
  if (conversation) signals.push(conversation);

  const familiar = detectFamiliarSpiralPattern(journalEntries, messageDrafts, conversations);
  if (familiar) signals.push(familiar);

  const riskLevel = calculateRiskLevel(signals);
  const confidenceScore = calculateConfidence(signals);
  const interventions = generateInterventions(signals, riskLevel);
  const narrative = generateNarrative(riskLevel, signals);
  const shouldIntervene = riskLevel !== 'low' && signals.length > 0;

  console.log('[SpiralDetection] Risk:', riskLevel, 'Signals:', signals.length, 'Confidence:', confidenceScore.toFixed(2));

  return {
    riskLevel,
    signals,
    interventions,
    narrative,
    confidenceScore,
    shouldIntervene,
    suggestedAction: interventions[0] ?? null,
    detectedAt: Date.now(),
  };
}

export function detectSpiralFromSmartEntries(
  smartEntries: SmartJournalEntry[],
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
  conversations: AIConversation[] = [],
): SpiralDetectionResult {
  const baseResult = detectSpiral(journalEntries, messageDrafts, conversations);

  const recentSmart = smartEntries.filter(e => withinHours(e.timestamp, 48));
  let extraWeight = 0;

  recentSmart.forEach(entry => {
    if (entry.distressLevel >= 7) extraWeight += 1;
    if (entry.format === 'relationship_conflict') extraWeight += 0.5;
    if (entry.emotions.some(e => e.label.toLowerCase().includes('shame'))) extraWeight += 0.5;
  });

  if (extraWeight > 0 && baseResult.riskLevel === 'low' && extraWeight >= 2) {
    return {
      ...baseResult,
      riskLevel: 'moderate',
      shouldIntervene: true,
      narrative: baseResult.narrative ?? 'Recent journal entries suggest emotional intensity may be building.',
    };
  }

  if (extraWeight >= 3 && baseResult.riskLevel === 'moderate') {
    return {
      ...baseResult,
      riskLevel: 'high',
      interventions: generateInterventions(baseResult.signals, 'high'),
      narrative: baseResult.narrative ?? 'Multiple signals from your journal suggest this may be a moment to pause and ground.',
    };
  }

  return baseResult;
}

export function generateWeeklySpiralInsight(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): SpiralWeeklyInsight | null {
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const weekEntries = journalEntries.filter(e => now - e.timestamp < weekMs);

  if (weekEntries.length < 3) return null;

  const signalCounts: Record<string, number> = {};
  const hourCounts: Record<number, number> = {};
  const triggerLabels: string[] = [];

  weekEntries.forEach(entry => {
    const hour = getHour(entry.timestamp);
    if (entry.checkIn.intensityLevel >= 6) {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
    entry.checkIn.triggers.forEach(t => triggerLabels.push(t.label));
  });

  const dailyResults: SpiralDetectionResult[] = [];
  for (let d = 0; d < 7; d++) {
    const dayStart = now - (d + 1) * 24 * 60 * 60 * 1000;
    const dayEnd = now - d * 24 * 60 * 60 * 1000;
    const dayEntries = journalEntries.filter(e => e.timestamp >= dayStart && e.timestamp < dayEnd);
    const dayDrafts = messageDrafts.filter(d => d.timestamp >= dayStart && d.timestamp < dayEnd);
    if (dayEntries.length > 0) {
      const result = detectSpiral(dayEntries, dayDrafts);
      dailyResults.push(result);
      result.signals.forEach(s => {
        signalCounts[s.type] = (signalCounts[s.type] || 0) + 1;
      });
    }
  }

  const peakRisk = dailyResults.reduce<SpiralRiskLevel>((peak, r) => {
    if (r.riskLevel === 'high') return 'high';
    if (r.riskLevel === 'moderate' && peak !== 'high') return 'moderate';
    return peak;
  }, 'low');

  const mostCommonSignals = Object.entries(signalCounts)
    .map(([type, count]) => ({ type: type as SpiralSignalType, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const peakHour = Object.entries(hourCounts).sort(([, a], [, b]) => b - a)[0];
  let spikeTimeOfDay: string | null = null;
  if (peakHour) {
    const h = parseInt(peakHour[0]);
    if (h >= 22 || h <= 5) spikeTimeOfDay = 'late night';
    else if (h >= 6 && h <= 11) spikeTimeOfDay = 'morning';
    else if (h >= 12 && h <= 17) spikeTimeOfDay = 'afternoon';
    else spikeTimeOfDay = 'evening';
  }

  const triggerCounts: Record<string, number> = {};
  triggerLabels.forEach(t => { triggerCounts[t] = (triggerCounts[t] || 0) + 1; });
  const commonTriggers = Object.entries(triggerCounts).sort(([, a], [, b]) => b - a).slice(0, 3).map(([l]) => l);

  const relCount = weekEntries.filter(e =>
    e.checkIn.triggers.some(t => t.category === 'relationship')
  ).length;

  const copingLabels: string[] = [];
  weekEntries.forEach(e => {
    e.checkIn.copingUsed?.forEach(c => copingLabels.push(c));
  });
  const copingCounts: Record<string, number> = {};
  copingLabels.forEach(c => { copingCounts[c] = (copingCounts[c] || 0) + 1; });
  const toolsThatHelped = Object.entries(copingCounts).sort(([, a], [, b]) => b - a).slice(0, 3).map(([l]) => l);

  let narrative = '';
  if (peakRisk === 'high') {
    narrative = 'This week had some intense moments. ';
  } else if (peakRisk === 'moderate') {
    narrative = 'This week had some emotionally challenging moments. ';
  } else {
    narrative = 'This week was relatively steady emotionally. ';
  }

  if (spikeTimeOfDay) {
    narrative += `Emotional spikes tended to happen in the ${spikeTimeOfDay}. `;
  }
  if (commonTriggers.length > 0) {
    narrative += `Common triggers included ${commonTriggers.slice(0, 2).join(' and ')}. `;
  }
  if (toolsThatHelped.length > 0) {
    narrative += `Tools that helped most: ${toolsThatHelped.join(', ')}.`;
  }

  return {
    id: `swi_${now}`,
    weekStart: now - weekMs,
    weekEnd: now,
    peakRiskLevel: peakRisk,
    mostCommonSignals,
    spikeTimeOfDay,
    commonTriggers,
    relationshipTriggerCount: relCount,
    toolsThatHelped,
    narrative: narrative.trim(),
  };
}

export function getSpiralPausePrompt(signals: SpiralSignal[]): SpiralPausePromptConfig {
  const types = new Set(signals.map(s => s.type));

  if (types.has('relationship_conflict_loop') || types.has('repeated_rejection_language')) {
    return {
      title: 'We’ve seen similar patterns before.',
      message: 'This resembles a pattern that previously led to distress. It is not certain, but it may be a good moment to pause before responding.',
      options: [
        { id: 'calm_down', label: 'Calm Me Down', route: '/grounding-mode', icon: 'Anchor' },
        { id: 'companion', label: 'Companion', route: '/(tabs)/companion', icon: 'Sparkles' },
        { id: 'dont_send_it', label: 'Don’t Send It', route: '/dont-send-it', icon: 'PenLine' },
        { id: 'continue', label: 'Not now', route: null, icon: 'ArrowRight' },
      ],
    };
  }

  if (types.has('familiar_spiral_pattern')) {
    return {
      title: 'We’ve seen similar patterns before.',
      message: 'This resembles a pattern that previously led to distress. It is only a signal, but slowing down now may help.',
      options: [
        { id: 'calm_down', label: 'Calm Me Down', route: '/grounding-mode', icon: 'Anchor' },
        { id: 'companion', label: 'Companion', route: '/(tabs)/companion', icon: 'Sparkles' },
        { id: 'dont_send_it', label: 'Don’t Send It', route: '/dont-send-it', icon: 'PenLine' },
        { id: 'continue', label: 'Not now', route: null, icon: 'ArrowRight' },
      ],
    };
  }

  if (types.has('shame_cascade')) {
    return {
      title: 'A gentle pause',
      message: 'Shame can feel overwhelming. You may not need to act on it right now.',
      options: [
        { id: 'calm_down', label: 'Calm Me Down', route: '/grounding-mode', icon: 'Anchor' },
        { id: 'companion', label: 'Companion', route: '/(tabs)/companion', icon: 'Sparkles' },
        { id: 'dont_send_it', label: 'Don’t Send It', route: '/dont-send-it', icon: 'PenLine' },
        { id: 'continue', label: 'I’m okay', route: null, icon: 'ArrowRight' },
      ],
    };
  }

  return {
    title: 'We’ve seen similar patterns before.',
    message: 'You may be entering a period of heightened emotional vulnerability. This is not certain, but a small pause could help.',
    options: [
      { id: 'calm_down', label: 'Calm Me Down', route: '/grounding-mode', icon: 'Anchor' },
      { id: 'companion', label: 'Companion', route: '/(tabs)/companion', icon: 'Sparkles' },
      { id: 'dont_send_it', label: 'Don’t Send It', route: '/dont-send-it', icon: 'PenLine' },
      { id: 'continue', label: 'Not now', route: null, icon: 'ArrowRight' },
    ],
  };
}
