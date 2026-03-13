import { JournalEntry, MessageDraft } from '@/types';
import { GuardSignalSummary } from '@/types/relationshipSpiral';

function withinHours(timestamp: number, hours: number): boolean {
  return Date.now() - timestamp < hours * 60 * 60 * 1000;
}

function analyzeCommunicationAnxiety(entries: JournalEntry[]): GuardSignalSummary | null {
  const recent = entries.filter(e => withinHours(e.timestamp, 72));
  let hits = 0;
  const triggers: string[] = [];

  recent.forEach(entry => {
    const hasCommTrigger = entry.checkIn.triggers.some(t => {
      const l = t.label.toLowerCase();
      return (
        l.includes('no reply') || l.includes('silence') || l.includes('ignored') ||
        l.includes('ghosted') || l.includes('waiting') || l.includes('left on read') ||
        l.includes('uncertain') || l.includes('distant') || l.includes('cold') ||
        (t.category === 'relationship' && entry.checkIn.intensityLevel >= 6)
      );
    });

    const hasAnxiousResponse = entry.checkIn.emotions.some(e => {
      const l = e.label.toLowerCase();
      return l.includes('anxious') || l.includes('fear') || l.includes('panic') || l.includes('worried') || l.includes('dread');
    });

    if (hasCommTrigger && hasAnxiousResponse) {
      hits++;
      entry.checkIn.triggers
        .filter(t => t.category === 'relationship')
        .forEach(t => { if (!triggers.includes(t.label)) triggers.push(t.label); });
    }
  });

  if (hits >= 2) {
    return {
      id: 'guard_comm_anxiety',
      category: 'communication',
      title: 'Communication uncertainty rising',
      narrative: `Communication-related anxiety has shown up ${hits} times recently. This pattern often builds into urgency quickly.`,
      strength: Math.min(hits + 1, 5),
      detectedAt: Date.now(),
      relatedTriggers: triggers,
    };
  }
  return null;
}

function analyzeAbandonmentActivation(entries: JournalEntry[]): GuardSignalSummary | null {
  const recent = entries.filter(e => withinHours(e.timestamp, 96));
  let cascadeHits = 0;
  const triggers: string[] = [];

  const abandonmentKeywords = [
    'abandon', 'reject', 'left', 'alone', 'unwanted', 'replaced',
    'forgotten', 'discarded', 'invisible',
  ];

  recent.forEach(entry => {
    const hasAbandonTrigger = entry.checkIn.triggers.some(t => {
      const l = t.label.toLowerCase();
      return abandonmentKeywords.some(kw => l.includes(kw));
    });

    const hasIntenseEmotion = entry.checkIn.emotions.some(e => {
      const l = e.label.toLowerCase();
      return l.includes('desperate') || l.includes('panic') || l.includes('empty') || l.includes('terror') || l.includes('fear');
    });

    if (hasAbandonTrigger && (hasIntenseEmotion || entry.checkIn.intensityLevel >= 7)) {
      cascadeHits++;
      entry.checkIn.triggers.forEach(t => {
        if (!triggers.includes(t.label)) triggers.push(t.label);
      });
    }
  });

  if (cascadeHits >= 2) {
    return {
      id: 'guard_abandonment',
      category: 'abandonment',
      title: 'Abandonment fears intensifying',
      narrative: 'Multiple moments of intense abandonment-related distress have appeared. This can make communication feel extremely urgent.',
      strength: Math.min(cascadeHits + 1, 5),
      detectedAt: Date.now(),
      relatedTriggers: triggers,
    };
  }
  return null;
}

function analyzeReassurancePattern(entries: JournalEntry[], drafts: MessageDraft[]): GuardSignalSummary | null {
  const recentEntries = entries.filter(e => withinHours(e.timestamp, 48));
  let reassuranceHits = 0;
  const triggers: string[] = [];

  const reassuranceKeywords = [
    'reassur', 'text', 'call', 'reach out', 'contact',
    'check phone', 'ask if ok', 'need to know', 'confirm',
  ];

  recentEntries.forEach(entry => {
    const hasUrge = entry.checkIn.urges.some(u => {
      const l = u.label.toLowerCase();
      return reassuranceKeywords.some(kw => l.includes(kw));
    });

    const hasRelContext = entry.checkIn.triggers.some(t => t.category === 'relationship');

    if (hasUrge && (hasRelContext || entry.checkIn.intensityLevel >= 5)) {
      reassuranceHits++;
      entry.checkIn.triggers
        .filter(t => t.category === 'relationship')
        .forEach(t => { if (!triggers.includes(t.label)) triggers.push(t.label); });
    }
  });

  const recentDraftCount = drafts.filter(d => withinHours(d.timestamp, 48)).length;
  const messageBurst = recentDraftCount >= 3;

  if (reassuranceHits >= 2 || (reassuranceHits >= 1 && messageBurst)) {
    return {
      id: 'guard_reassurance',
      category: 'reassurance',
      title: 'Reassurance-seeking urges building',
      narrative: 'The urge to seek reassurance has been appearing frequently. This urge often feels more urgent than it actually is.',
      strength: Math.min(reassuranceHits + (messageBurst ? 2 : 0), 5),
      detectedAt: Date.now(),
      relatedTriggers: triggers,
    };
  }
  return null;
}

function analyzeMessagingSurge(drafts: MessageDraft[]): GuardSignalSummary | null {
  const short = drafts.filter(d => withinHours(d.timestamp, 24));
  const medium = drafts.filter(d => withinHours(d.timestamp, 48));

  const shortRewrites = short.filter(d => d.rewrittenText).length;
  const mediumTotal = medium.length;
  const pausedCount = medium.filter(d => d.paused).length;

  if (shortRewrites >= 3 || mediumTotal >= 5 || (shortRewrites >= 2 && pausedCount >= 1)) {
    const count = Math.max(shortRewrites, mediumTotal);
    return {
      id: 'guard_messaging_surge',
      category: 'messaging',
      title: 'Message activity has spiked',
      narrative: `You've worked on ${count} messages recently. High messaging activity often signals building relationship tension.`,
      strength: Math.min(count, 5),
      detectedAt: Date.now(),
      relatedTriggers: [],
    };
  }
  return null;
}

function analyzeConflictShamePattern(entries: JournalEntry[]): GuardSignalSummary | null {
  const recent = entries
    .filter(e => withinHours(e.timestamp, 96))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (recent.length < 2) return null;

  let chainDetected = false;
  const triggers: string[] = [];

  for (let i = 0; i < recent.length - 1; i++) {
    const current = recent[i];
    const next = recent[i + 1];

    const hasConflict = current.checkIn.triggers.some(t =>
      t.category === 'relationship' && current.checkIn.intensityLevel >= 6
    );

    const hasShame = next.checkIn.emotions.some(e => {
      const l = e.label.toLowerCase();
      return l.includes('shame') || l.includes('guilt') || l.includes('worthless') || l.includes('disgusted with self');
    });

    const hasWithdrawal = next.checkIn.urges.some(u => {
      const l = u.label.toLowerCase();
      return l.includes('withdraw') || l.includes('hide') || l.includes('isolate') || l.includes('shut down') || l.includes('disappear');
    });

    if (hasConflict && (hasShame || hasWithdrawal)) {
      chainDetected = true;
      current.checkIn.triggers.forEach(t => {
        if (!triggers.includes(t.label)) triggers.push(t.label);
      });
    }
  }

  if (chainDetected) {
    return {
      id: 'guard_conflict_shame',
      category: 'conflict',
      title: 'Conflict-shame-withdrawal cycle',
      narrative: 'A conflict appears to have been followed by shame and withdrawal urges. This cycle can feel overwhelming, but recognizing it gives you more choice.',
      strength: 4,
      detectedAt: Date.now(),
      relatedTriggers: triggers,
    };
  }
  return null;
}

function analyzeDistressEscalation(entries: JournalEntry[]): GuardSignalSummary | null {
  const recent = entries
    .filter(e => withinHours(e.timestamp, 48))
    .sort((a, b) => a.timestamp - b.timestamp);

  if (recent.length < 2) return null;

  let risingCount = 0;
  let peakIntensity = 0;
  const hasRelContext = recent.some(e => e.checkIn.triggers.some(t => t.category === 'relationship'));

  for (let i = 0; i < recent.length; i++) {
    const level = recent[i].checkIn.intensityLevel;
    if (level > peakIntensity) peakIntensity = level;
    if (i > 0 && level > recent[i - 1].checkIn.intensityLevel) {
      risingCount++;
    }
  }

  if (hasRelContext && (risingCount >= 2 || peakIntensity >= 8)) {
    return {
      id: 'guard_distress_escalation',
      category: 'distress',
      title: 'Relationship-linked distress climbing',
      narrative: 'Your distress levels have been rising alongside relationship triggers. This combination often leads to impulsive communication.',
      strength: Math.min(risingCount + (peakIntensity >= 8 ? 2 : 0), 5),
      detectedAt: Date.now(),
      relatedTriggers: [],
    };
  }
  return null;
}

export function analyzeRelationshipSignals(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): GuardSignalSummary[] {
  const signals: GuardSignalSummary[] = [];

  const comm = analyzeCommunicationAnxiety(journalEntries);
  if (comm) signals.push(comm);

  const abandon = analyzeAbandonmentActivation(journalEntries);
  if (abandon) signals.push(abandon);

  const reassurance = analyzeReassurancePattern(journalEntries, messageDrafts);
  if (reassurance) signals.push(reassurance);

  const messaging = analyzeMessagingSurge(messageDrafts);
  if (messaging) signals.push(messaging);

  const conflict = analyzeConflictShamePattern(journalEntries);
  if (conflict) signals.push(conflict);

  const distress = analyzeDistressEscalation(journalEntries);
  if (distress) signals.push(distress);

  console.log('[RelationshipSignalAnalyzer] Detected signals:', signals.length);
  return signals;
}
