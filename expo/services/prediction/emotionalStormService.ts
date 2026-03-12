import { JournalEntry, MessageDraft } from '@/types';

export type StormIntensity = 'calm' | 'building' | 'approaching' | 'active';

export interface StormPattern {
  id: string;
  type: 'distress_climbing' | 'abandonment_repeated' | 'rewrite_surge' | 'reassurance_seeking' | 'emotional_volatility';
  label: string;
  description: string;
  strength: number;
}

export interface StormSuggestion {
  id: string;
  type: 'grounding' | 'breathing' | 'ai_companion' | 'delay_message';
  title: string;
  description: string;
  route: string;
  icon: string;
}

export interface EmotionalStormResult {
  intensity: StormIntensity;
  patterns: StormPattern[];
  suggestions: StormSuggestion[];
  message: string | null;
  score: number;
}

function withinHours(timestamp: number, hours: number): boolean {
  return Date.now() - timestamp < hours * 60 * 60 * 1000;
}

function detectDistressClimbing(entries: JournalEntry[]): StormPattern | null {
  const recent = entries
    .filter(e => withinHours(e.timestamp, 96))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (recent.length < 3) return null;

  let climbCount = 0;
  let highCount = 0;

  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i].checkIn.intensityLevel - recent[i - 1].checkIn.intensityLevel;
    if (diff >= 1) climbCount++;
    if (recent[i].checkIn.intensityLevel >= 7) highCount++;
  }

  if (recent[recent.length - 1].checkIn.intensityLevel >= 7) highCount++;

  if (climbCount >= 2 || highCount >= 3) {
    const strength = Math.min(climbCount + highCount, 5);
    return {
      id: 'storm_distress_climbing',
      type: 'distress_climbing',
      label: 'Stress levels have been increasing',
      description: 'Your recent check-ins show rising intensity. Slowing down may help.',
      strength,
    };
  }

  return null;
}

function detectAbandonmentRepeated(entries: JournalEntry[]): StormPattern | null {
  const recent = entries.filter(e => withinHours(e.timestamp, 120));
  let hits = 0;

  recent.forEach(entry => {
    const hasTrigger = entry.checkIn.triggers.some(t => {
      const l = t.label.toLowerCase();
      return (
        l.includes('abandon') ||
        l.includes('reject') ||
        l.includes('ignored') ||
        l.includes('ghosted') ||
        l.includes('left out') ||
        l.includes('no reply') ||
        l.includes('silence')
      );
    });

    const hasEmotionalResponse = entry.checkIn.emotions.some(e => {
      const l = e.label.toLowerCase();
      return l.includes('fear') || l.includes('panic') || l.includes('desperate') || l.includes('empty') || l.includes('anxious');
    });

    if (hasTrigger || (hasEmotionalResponse && entry.checkIn.intensityLevel >= 6)) {
      hits++;
    }
  });

  if (hits >= 2) {
    return {
      id: 'storm_abandonment_repeated',
      type: 'abandonment_repeated',
      label: 'Communication uncertainty showing up',
      description: `You've had ${hits} triggers related to communication uncertainty recently.`,
      strength: Math.min(hits, 5),
    };
  }

  return null;
}

function detectRewriteSurge(drafts: MessageDraft[]): StormPattern | null {
  const recent = drafts.filter(d => withinHours(d.timestamp, 72));
  const rewriteCount = recent.filter(d => d.rewrittenText).length;
  const totalCount = recent.length;

  if (rewriteCount >= 3 || totalCount >= 5) {
    const count = Math.max(rewriteCount, totalCount);
    return {
      id: 'storm_rewrite_surge',
      type: 'rewrite_surge',
      label: 'Message drafting has increased',
      description: `You've worked on ${count} messages recently. Pausing before sending can protect your peace.`,
      strength: Math.min(count, 5),
    };
  }

  return null;
}

function detectReassuranceSeeking(entries: JournalEntry[]): StormPattern | null {
  const recent = entries.filter(e => withinHours(e.timestamp, 96));
  let reassuranceHits = 0;

  recent.forEach(entry => {
    const hasUrge = entry.checkIn.urges.some(u => {
      const l = u.label.toLowerCase();
      return (
        l.includes('reassur') ||
        l.includes('text') ||
        l.includes('call') ||
        l.includes('reach out') ||
        l.includes('contact') ||
        l.includes('check phone')
      );
    });

    if (hasUrge && entry.checkIn.intensityLevel >= 5) {
      reassuranceHits++;
    }
  });

  if (reassuranceHits >= 2) {
    return {
      id: 'storm_reassurance_seeking',
      type: 'reassurance_seeking',
      label: 'Reassurance-seeking urges appearing',
      description: 'You may benefit from grounding before reaching out right now.',
      strength: Math.min(reassuranceHits, 5),
    };
  }

  return null;
}

function detectEmotionalVolatility(entries: JournalEntry[]): StormPattern | null {
  const recent = entries
    .filter(e => withinHours(e.timestamp, 72))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (recent.length < 3) return null;

  let swingCount = 0;
  for (let i = 1; i < recent.length; i++) {
    const diff = Math.abs(recent[i].checkIn.intensityLevel - recent[i - 1].checkIn.intensityLevel);
    if (diff >= 3) swingCount++;
  }

  if (swingCount >= 2) {
    return {
      id: 'storm_emotional_volatility',
      type: 'emotional_volatility',
      label: 'Emotions have been shifting quickly',
      description: 'Your intensity levels have been swinging. Extra self-care may help stabilize.',
      strength: Math.min(swingCount + 1, 5),
    };
  }

  return null;
}

function calculateStormScore(patterns: StormPattern[]): number {
  if (patterns.length === 0) return 0;
  const total = patterns.reduce((sum, p) => sum + p.strength, 0);
  return Math.min(total, 15);
}

function determineIntensity(score: number): StormIntensity {
  if (score >= 10) return 'active';
  if (score >= 6) return 'approaching';
  if (score >= 3) return 'building';
  return 'calm';
}

function generateStormSuggestions(patterns: StormPattern[]): StormSuggestion[] {
  const suggestions: StormSuggestion[] = [];
  const added = new Set<string>();

  const hasDistress = patterns.some(p => p.type === 'distress_climbing' || p.type === 'emotional_volatility');
  const hasAbandonment = patterns.some(p => p.type === 'abandonment_repeated' || p.type === 'reassurance_seeking');
  const hasMessaging = patterns.some(p => p.type === 'rewrite_surge');

  if (hasDistress) {
    suggestions.push({
      id: 'storm_grounding',
      type: 'grounding',
      title: 'Try a grounding exercise',
      description: 'Reconnect with the present through your senses.',
      route: '/exercise?id=c2',
      icon: 'Anchor',
    });
    added.add('grounding');
  }

  if (hasDistress || hasAbandonment) {
    suggestions.push({
      id: 'storm_breathing',
      type: 'breathing',
      title: 'Take a 2-minute breathing pause',
      description: 'Slow breathing calms your nervous system quickly.',
      route: '/exercise?id=c1',
      icon: 'Wind',
    });
    added.add('breathing');
  }

  if (hasAbandonment || patterns.length >= 2) {
    suggestions.push({
      id: 'storm_companion',
      type: 'ai_companion',
      title: 'Talk to AI Companion',
      description: 'Process what you\'re feeling in a calm space.',
      route: '/(tabs)/companion',
      icon: 'Sparkles',
    });
    added.add('ai_companion');
  }

  if (hasMessaging) {
    suggestions.push({
      id: 'storm_delay',
      type: 'delay_message',
      title: 'Delay sending a message',
      description: 'Give yourself space before pressing send.',
      route: '/(tabs)/messages',
      icon: 'Clock',
    });
    added.add('delay_message');
  }

  if (suggestions.length === 0 && patterns.length > 0) {
    suggestions.push({
      id: 'storm_breathing_default',
      type: 'breathing',
      title: 'Take a 2-minute breathing pause',
      description: 'A few slow breaths can help you feel more centered.',
      route: '/exercise?id=c1',
      icon: 'Wind',
    });
  }

  return suggestions;
}

function generateStormMessage(intensity: StormIntensity, patterns: StormPattern[]): string | null {
  if (patterns.length === 0) return null;

  if (intensity === 'active') {
    return 'You may benefit from slowing things down right now. A grounding exercise could help.';
  }

  if (intensity === 'approaching') {
    if (patterns.some(p => p.type === 'abandonment_repeated')) {
      return 'You\'ve had several triggers related to communication uncertainty. Being gentle with yourself matters.';
    }
    if (patterns.some(p => p.type === 'rewrite_surge')) {
      return 'You\'ve been working through a lot of messages lately. A pause might bring more clarity.';
    }
    return 'Your stress levels have been increasing this week. A small act of self-care can make a difference.';
  }

  if (patterns.some(p => p.type === 'emotional_volatility')) {
    return 'Your emotions have been shifting quickly. Extra gentleness with yourself may help.';
  }

  if (patterns.some(p => p.type === 'reassurance_seeking')) {
    return 'Reassurance-seeking urges have been showing up. Grounding first can bring more clarity.';
  }

  return 'Some patterns suggest things are building up. Taking a moment for yourself could help.';
}

export function detectEmotionalStorm(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): EmotionalStormResult {
  const patterns: StormPattern[] = [];

  const distress = detectDistressClimbing(journalEntries);
  if (distress) patterns.push(distress);

  const abandonment = detectAbandonmentRepeated(journalEntries);
  if (abandonment) patterns.push(abandonment);

  const rewrite = detectRewriteSurge(messageDrafts);
  if (rewrite) patterns.push(rewrite);

  const reassurance = detectReassuranceSeeking(journalEntries);
  if (reassurance) patterns.push(reassurance);

  const volatility = detectEmotionalVolatility(journalEntries);
  if (volatility) patterns.push(volatility);

  const score = calculateStormScore(patterns);
  const intensity = determineIntensity(score);
  const suggestions = generateStormSuggestions(patterns);
  const message = generateStormMessage(intensity, patterns);

  console.log('[EmotionalStorm] Score:', score, 'Intensity:', intensity, 'Patterns:', patterns.length);

  return {
    intensity,
    patterns,
    suggestions,
    message,
    score,
  };
}
