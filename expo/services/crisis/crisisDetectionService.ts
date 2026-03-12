import { JournalEntry, MessageDraft } from '@/types';
import { CrisisSignal, CrisisDetectionResult } from '@/types/crisis';

function hoursAgo(timestamp: number): number {
  return (Date.now() - timestamp) / (1000 * 60 * 60);
}

function detectHighDistress(entries: JournalEntry[]): CrisisSignal | null {
  const recent = entries.filter(e => hoursAgo(e.timestamp) <= 24);
  const highDistress = recent.filter(e => e.checkIn.intensityLevel >= 8);

  if (highDistress.length >= 1) {
    const maxIntensity = Math.max(...highDistress.map(e => e.checkIn.intensityLevel));
    return {
      id: 'crisis_high_distress',
      reason: 'high_distress',
      label: 'Distress level is very high',
      description: `Your distress has reached ${maxIntensity}/10 recently. This is a moment to slow down and care for yourself.`,
      detectedAt: Date.now(),
      severity: maxIntensity >= 9 ? 5 : 4,
    };
  }

  return null;
}

function detectRapidRewrites(drafts: MessageDraft[]): CrisisSignal | null {
  const last2Hours = drafts.filter(d => hoursAgo(d.timestamp) <= 2);
  const rewriteCount = last2Hours.filter(d => d.rewrittenText).length;

  if (rewriteCount >= 3) {
    return {
      id: 'crisis_rapid_rewrites',
      reason: 'rapid_rewrites',
      label: 'Rapid message rewriting',
      description: `You've rewritten ${rewriteCount} messages in a short period. This often signals rising emotional intensity.`,
      detectedAt: Date.now(),
      severity: rewriteCount >= 5 ? 5 : 3,
    };
  }

  return null;
}

function detectRepeatedTriggers(entries: JournalEntry[]): CrisisSignal | null {
  const last6Hours = entries.filter(e => hoursAgo(e.timestamp) <= 6);

  if (last6Hours.length < 2) return null;

  const triggerCounts: Record<string, number> = {};
  last6Hours.forEach(entry => {
    entry.checkIn.triggers.forEach(t => {
      triggerCounts[t.label] = (triggerCounts[t.label] || 0) + 1;
    });
  });

  const repeatedTriggers = Object.entries(triggerCounts).filter(([, count]) => count >= 2);

  if (repeatedTriggers.length > 0) {
    const topTrigger = repeatedTriggers.sort(([, a], [, b]) => b - a)[0];
    return {
      id: 'crisis_repeated_triggers',
      reason: 'repeated_triggers',
      label: 'Same triggers appearing repeatedly',
      description: `"${topTrigger[0]}" has come up ${topTrigger[1]} times in the last few hours. Repeated triggers can build intensity quickly.`,
      detectedAt: Date.now(),
      severity: repeatedTriggers.length >= 2 ? 4 : 3,
    };
  }

  return null;
}

function detectEscalation(entries: JournalEntry[]): CrisisSignal | null {
  const last12Hours = entries
    .filter(e => hoursAgo(e.timestamp) <= 12)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (last12Hours.length < 3) return null;

  let escalationSteps = 0;
  for (let i = 1; i < last12Hours.length; i++) {
    if (last12Hours[i].checkIn.intensityLevel > last12Hours[i - 1].checkIn.intensityLevel) {
      escalationSteps++;
    }
  }

  if (escalationSteps >= 2 && last12Hours[last12Hours.length - 1].checkIn.intensityLevel >= 7) {
    return {
      id: 'crisis_escalation',
      reason: 'escalation_detected',
      label: 'Emotional intensity is climbing',
      description: 'Your distress has been rising steadily. Catching this early gives you a chance to slow down.',
      detectedAt: Date.now(),
      severity: 4,
    };
  }

  return null;
}

function calculateSeverity(signals: CrisisSignal[]): number {
  if (signals.length === 0) return 0;
  const total = signals.reduce((sum, s) => sum + s.severity, 0);
  const multiplier = signals.length >= 3 ? 1.4 : signals.length >= 2 ? 1.2 : 1;
  return Math.min(Math.round(total * multiplier), 10);
}

function generateMessage(severity: number, signals: CrisisSignal[]): string | null {
  if (signals.length === 0) return null;

  if (severity >= 8) {
    return "This seems like an intense moment. Crisis Mode can help you slow down and find calm.";
  }

  if (severity >= 5) {
    return "Your emotional intensity is building. A few minutes of breathing and grounding may help right now.";
  }

  const hasRewrites = signals.some(s => s.reason === 'rapid_rewrites');
  if (hasRewrites) {
    return "You've been working through a lot of messages. Taking a pause before sending may help.";
  }

  return "Some signals suggest stress is building. A brief pause could make a difference.";
}

export function detectCrisis(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
): CrisisDetectionResult {
  const signals: CrisisSignal[] = [];

  const highDistress = detectHighDistress(journalEntries);
  if (highDistress) signals.push(highDistress);

  const rapidRewrites = detectRapidRewrites(messageDrafts);
  if (rapidRewrites) signals.push(rapidRewrites);

  const repeatedTriggers = detectRepeatedTriggers(journalEntries);
  if (repeatedTriggers) signals.push(repeatedTriggers);

  const escalation = detectEscalation(journalEntries);
  if (escalation) signals.push(escalation);

  const severity = calculateSeverity(signals);
  const shouldActivate = severity >= 5 || signals.some(s => s.severity >= 4);
  const message = generateMessage(severity, signals);

  console.log('[CrisisDetection] Severity:', severity, 'Activate:', shouldActivate, 'Signals:', signals.length);

  return {
    shouldActivate,
    signals,
    severity,
    message,
  };
}
