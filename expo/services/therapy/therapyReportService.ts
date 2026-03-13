import { JournalEntry, MessageDraft } from '@/types';
import {
  TherapyReport,
  TherapyReportEmotionSummary,
  TherapyReportTriggerSummary,
  TherapyReportDistressTrend,
  TherapyReportRelationshipSection,
  TherapyReportCopingSection,
  TherapyReportProgressSection,
  TherapyReportUrgeSection,
  TherapyReportRegulationSection,
  TherapyDiscussionPrompt,
} from '@/types/therapyReport';

function isWithinDays(timestamp: number, days: number): boolean {
  return Date.now() - timestamp < days * 24 * 60 * 60 * 1000;
}

function getDayLabel(timestamp: number): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(timestamp).getDay()];
}

function getDateKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateRange(days: number): string {
  const end = new Date();
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function buildEmotions(entries: JournalEntry[], days: number): TherapyReportEmotionSummary[] {
  const recent = entries.filter(e => isWithinDays(e.timestamp, days));
  const older = entries.filter(e => !isWithinDays(e.timestamp, days) && isWithinDays(e.timestamp, days * 2));

  const counts: Record<string, { count: number; emoji: string }> = {};
  recent.forEach(entry => {
    entry.checkIn.emotions.forEach(em => {
      if (!counts[em.label]) counts[em.label] = { count: 0, emoji: em.emoji };
      counts[em.label].count += 1;
    });
  });

  const olderCounts: Record<string, number> = {};
  older.forEach(entry => {
    entry.checkIn.emotions.forEach(em => {
      olderCounts[em.label] = (olderCounts[em.label] || 0) + 1;
    });
  });

  const total = Object.values(counts).reduce((s, c) => s + c.count, 0);

  return Object.entries(counts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 6)
    .map(([label, data]) => {
      const olderCount = olderCounts[label] ?? 0;
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (data.count > olderCount + 1) trend = 'increasing';
      else if (data.count < olderCount - 1) trend = 'decreasing';

      return {
        label,
        emoji: data.emoji,
        count: data.count,
        percentage: total > 0 ? Math.round((data.count / total) * 100) : 0,
        trend,
      };
    });
}

function buildTriggers(entries: JournalEntry[], days: number): TherapyReportTriggerSummary[] {
  const recent = entries.filter(e => isWithinDays(e.timestamp, days));
  const triggerData: Record<string, { count: number; category: string; emotions: Set<string> }> = {};

  recent.forEach(entry => {
    entry.checkIn.triggers.forEach(t => {
      if (!triggerData[t.label]) triggerData[t.label] = { count: 0, category: t.category, emotions: new Set() };
      triggerData[t.label].count += 1;
      entry.checkIn.emotions.forEach(em => triggerData[t.label].emotions.add(em.label));
    });
  });

  return Object.entries(triggerData)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 6)
    .map(([label, data]) => ({
      label,
      category: data.category,
      count: data.count,
      associatedEmotions: Array.from(data.emotions).slice(0, 3),
    }));
}

function buildDistressTrend(entries: JournalEntry[], days: number): TherapyReportDistressTrend {
  const recent = entries.filter(e => isWithinDays(e.timestamp, days));
  const older = entries.filter(e => !isWithinDays(e.timestamp, days) && isWithinDays(e.timestamp, days * 2));

  const dailyMap: Record<string, { total: number; count: number; label: string }> = {};
  const now = new Date();

  for (let i = Math.min(days - 1, 6); i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const key = getDateKey(date.getTime());
    dailyMap[key] = { total: 0, count: 0, label: getDayLabel(date.getTime()) };
  }

  recent.forEach(entry => {
    const key = getDateKey(entry.timestamp);
    if (dailyMap[key]) {
      dailyMap[key].total += entry.checkIn.intensityLevel;
      dailyMap[key].count += 1;
    }
  });

  const dailyPoints = Object.entries(dailyMap).map(([, data]) => ({
    day: data.label,
    value: data.count > 0 ? Math.round((data.total / data.count) * 10) / 10 : 0,
  }));

  const intensities = recent.map(e => e.checkIn.intensityLevel);
  const avg = intensities.length > 0 ? Math.round((intensities.reduce((s, v) => s + v, 0) / intensities.length) * 10) / 10 : 0;
  const peak = intensities.length > 0 ? Math.max(...intensities) : 0;
  const lowest = intensities.length > 0 ? Math.min(...intensities) : 0;

  const olderAvg = older.length > 0 ? older.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / older.length : avg;

  let direction: 'improving' | 'worsening' | 'stable' = 'stable';
  if (avg < olderAvg - 0.5) direction = 'improving';
  else if (avg > olderAvg + 0.5) direction = 'worsening';

  let narrative = '';
  if (recent.length < 2) {
    narrative = 'More check-ins will provide a clearer picture of distress patterns.';
  } else if (direction === 'improving') {
    narrative = `Average distress has decreased to ${avg}/10, suggesting emotional intensity may be easing.`;
  } else if (direction === 'worsening') {
    narrative = `Average distress has risen to ${avg}/10, indicating this may have been a more challenging period.`;
  } else {
    narrative = `Average distress has remained around ${avg}/10, showing relative emotional stability.`;
  }

  return { average: avg, peak, lowest, direction, dailyPoints, narrative };
}

function buildRelationships(entries: JournalEntry[], drafts: MessageDraft[], days: number): TherapyReportRelationshipSection {
  const recent = entries.filter(e => isWithinDays(e.timestamp, days));
  const recentDrafts = drafts.filter(d => isWithinDays(d.timestamp, days));

  const relTriggers: Record<string, number> = {};
  const commPatterns: string[] = [];

  recent.forEach(entry => {
    entry.checkIn.triggers.filter(t => t.category === 'relationship').forEach(t => {
      relTriggers[t.label] = (relTriggers[t.label] || 0) + 1;
    });
  });

  const topTriggers = Object.entries(relTriggers).sort(([, a], [, b]) => b - a).slice(0, 3).map(([l]) => l);
  const rewriteCount = recentDrafts.filter(d => d.rewrittenText).length;
  const pauseCount = recentDrafts.filter(d => d.paused).length;

  if (rewriteCount > 0) commPatterns.push(`Rewrote ${rewriteCount} message${rewriteCount !== 1 ? 's' : ''} for clearer communication`);
  if (pauseCount > 0) commPatterns.push(`Paused ${pauseCount} time${pauseCount !== 1 ? 's' : ''} before sending`);

  const rewriteTypes: Record<string, number> = {};
  recentDrafts.filter(d => d.rewriteType).forEach(d => {
    rewriteTypes[d.rewriteType!] = (rewriteTypes[d.rewriteType!] || 0) + 1;
  });
  const topType = Object.entries(rewriteTypes).sort(([, a], [, b]) => b - a)[0];
  if (topType) commPatterns.push(`Most common rewrite style: ${topType[0]}`);

  let narrative = '';
  if (topTriggers.length > 0) {
    narrative = `Relationship-related triggers included "${topTriggers[0]}"${topTriggers.length > 1 ? ` and "${topTriggers[1]}"` : ''}. `;
  }
  if (rewriteCount > 0 || pauseCount > 0) {
    narrative += 'Message rewriting and pausing suggest growing intentionality in communication.';
  }
  if (!narrative) {
    narrative = 'No strong relationship patterns detected during this period.';
  }

  return { topTriggers, communicationPatterns: commPatterns, rewriteCount, pauseCount, narrative };
}

function buildCoping(entries: JournalEntry[], days: number): TherapyReportCopingSection {
  const recent = entries.filter(e => isWithinDays(e.timestamp, days));
  const sorted = [...recent].sort((a, b) => a.timestamp - b.timestamp);

  const toolData: Record<string, { count: number; improved: number }> = {};

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const coping = entry.checkIn.copingUsed;
    if (!coping || coping.length === 0) continue;

    const before = entry.checkIn.intensityLevel;
    const next = sorted[i + 1];
    const after = next ? next.checkIn.intensityLevel : Math.max(1, before - 2);

    coping.forEach(tool => {
      if (!toolData[tool]) toolData[tool] = { count: 0, improved: 0 };
      toolData[tool].count += 1;
      if (after < before) toolData[tool].improved += 1;
    });
  }

  const toolsUsed = Object.entries(toolData)
    .map(([tool, data]) => {
      const rate = data.count > 0 ? data.improved / data.count : 0;
      let effectiveness: 'helpful' | 'moderate' | 'unclear' = 'unclear';
      if (rate >= 0.6) effectiveness = 'helpful';
      else if (rate >= 0.3) effectiveness = 'moderate';
      return { tool, count: data.count, effectiveness };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const mostEffective = toolsUsed.find(t => t.effectiveness === 'helpful')?.tool ?? null;

  let narrative = '';
  if (toolsUsed.length > 0) {
    narrative = `${toolsUsed.length} coping tool${toolsUsed.length !== 1 ? 's were' : ' was'} used during this period.`;
    if (mostEffective) narrative += ` "${mostEffective}" appears to be the most effective.`;
  } else {
    narrative = 'No coping tools were recorded during this period.';
  }

  return { toolsUsed, mostEffective, narrative };
}

function buildUrges(entries: JournalEntry[], days: number): TherapyReportUrgeSection {
  const recent = entries.filter(e => isWithinDays(e.timestamp, days));
  const urgeCounts: Record<string, { count: number; risk: string }> = {};

  recent.forEach(entry => {
    entry.checkIn.urges.forEach(u => {
      if (!urgeCounts[u.label]) urgeCounts[u.label] = { count: 0, risk: u.risk };
      urgeCounts[u.label].count += 1;
    });
  });

  const topUrges = Object.entries(urgeCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([label, data]) => ({ label, count: data.count, risk: data.risk }));

  let narrative = '';
  if (topUrges.length > 0) {
    const highRisk = topUrges.filter(u => u.risk === 'high');
    if (highRisk.length > 0) {
      narrative = `High-intensity urges like "${highRisk[0].label}" appeared ${highRisk[0].count} time${highRisk[0].count !== 1 ? 's' : ''}. This may be an area to explore in session.`;
    } else {
      narrative = `The most frequent urge was "${topUrges[0].label}" (${topUrges[0].count} time${topUrges[0].count !== 1 ? 's' : ''}). Most urges remained at moderate or low intensity.`;
    }
  } else {
    narrative = 'No urges were recorded during this period.';
  }

  return { topUrges, narrative };
}

function buildProgress(entries: JournalEntry[], drafts: MessageDraft[], days: number): TherapyReportProgressSection {
  const recent = entries.filter(e => isWithinDays(e.timestamp, days));
  const older = entries.filter(e => !isWithinDays(e.timestamp, days) && isWithinDays(e.timestamp, days * 2));
  const recentDrafts = drafts.filter(d => isWithinDays(d.timestamp, days));
  const highlights: string[] = [];
  const skillsGained: string[] = [];

  const recentAvg = recent.length > 0 ? recent.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / recent.length : 0;
  const olderAvg = older.length > 0 ? older.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / older.length : 0;

  if (olderAvg > 0 && recentAvg < olderAvg) {
    const drop = Math.round(((olderAvg - recentAvg) / olderAvg) * 100);
    highlights.push(`Average distress decreased by ${drop}% compared to the prior period`);
  }

  if (recent.length >= 3) {
    highlights.push(`Completed ${recent.length} check-ins, showing consistency in self-monitoring`);
  }

  const reflections = recent.filter(e => e.reflection && e.reflection.length > 15).length;
  if (reflections >= 2) {
    highlights.push(`Wrote ${reflections} detailed reflections`);
    skillsGained.push('Self-reflection');
  }

  const pauseCount = recentDrafts.filter(d => d.paused).length;
  if (pauseCount > 0) {
    highlights.push(`Paused before sending ${pauseCount} message${pauseCount !== 1 ? 's' : ''}`);
    skillsGained.push('Impulse regulation');
  }

  const copingCount = recent.reduce((s, e) => s + (e.checkIn.copingUsed?.length ?? 0), 0);
  if (copingCount > 0) {
    highlights.push(`Used coping tools ${copingCount} time${copingCount !== 1 ? 's' : ''}`);
    skillsGained.push('Active coping');
  }

  const managedCount = recent.filter(e => e.outcome === 'managed').length;
  if (managedCount > 0) {
    highlights.push(`Reported managing emotions well ${managedCount} time${managedCount !== 1 ? 's' : ''}`);
    skillsGained.push('Emotional management');
  }

  let narrative = '';
  if (highlights.length > 0) {
    narrative = `Key areas of progress include: ${highlights.slice(0, 3).join('; ').toLowerCase()}.`;
  } else {
    narrative = 'As more data is gathered, progress patterns will become clearer.';
  }

  return { highlights, skillsGained, narrative };
}

function buildOverview(entries: JournalEntry[], drafts: MessageDraft[], days: number): string {
  const recent = entries.filter(e => isWithinDays(e.timestamp, days));
  const recentDrafts = drafts.filter(d => isWithinDays(d.timestamp, days));

  if (recent.length < 2) {
    return 'This report covers a limited data set. More check-ins will provide richer insight for therapy discussions.';
  }

  const parts: string[] = [];
  const avgDistress = recent.reduce((s, e) => s + e.checkIn.intensityLevel, 0) / recent.length;
  const topEmo = getTopItem(recent.flatMap(e => e.checkIn.emotions.map(em => em.label)));
  const topTrig = getTopItem(recent.flatMap(e => e.checkIn.triggers.map(t => t.label)));
  const managedCount = recent.filter(e => e.outcome === 'managed').length;
  const struggledCount = recent.filter(e => e.outcome === 'struggled').length;

  if (topEmo) parts.push(`The most frequently reported emotion was ${topEmo.toLowerCase()}.`);
  if (topTrig) parts.push(`"${topTrig}" was the most common trigger.`);

  if (avgDistress >= 6) {
    parts.push(`Average distress was elevated at ${Math.round(avgDistress * 10) / 10}/10, indicating a challenging period.`);
  } else if (avgDistress <= 3) {
    parts.push(`Average distress remained low at ${Math.round(avgDistress * 10) / 10}/10, suggesting relative stability.`);
  } else {
    parts.push(`Average distress was moderate at ${Math.round(avgDistress * 10) / 10}/10.`);
  }

  if (managedCount > 0 && struggledCount > 0) {
    parts.push(`The client reported managing emotions well ${managedCount} time${managedCount !== 1 ? 's' : ''} and struggling ${struggledCount} time${struggledCount !== 1 ? 's' : ''}.`);
  } else if (managedCount > 0) {
    parts.push(`The client reported managing emotions well ${managedCount} time${managedCount !== 1 ? 's' : ''}.`);
  }

  const pauseCount = recentDrafts.filter(d => d.paused).length;
  const rewriteCount = recentDrafts.filter(d => d.rewrittenText).length;
  if (pauseCount > 0 || rewriteCount > 0) {
    const regulationParts: string[] = [];
    if (pauseCount > 0) regulationParts.push(`paused before sending ${pauseCount} time${pauseCount !== 1 ? 's' : ''}`);
    if (rewriteCount > 0) regulationParts.push(`rewrote ${rewriteCount} message${rewriteCount !== 1 ? 's' : ''}`);
    parts.push(`The client ${regulationParts.join(' and ')}, suggesting growing intentionality in communication.`);
  }

  return parts.join(' ');
}

function buildTherapistNote(entries: JournalEntry[], drafts: MessageDraft[], days: number): string {
  const recent = entries.filter(e => isWithinDays(e.timestamp, days));
  const recentDrafts = drafts.filter(d => isWithinDays(d.timestamp, days));
  const parts: string[] = [];

  const highDistress = recent.filter(e => e.checkIn.intensityLevel >= 7);
  if (highDistress.length > 0) {
    parts.push(`There were ${highDistress.length} high-distress check-in${highDistress.length !== 1 ? 's' : ''} (7+/10) during this period that may be worth exploring.`);
  }

  const highUrges = recent.filter(e => e.checkIn.urges.some(u => u.risk === 'high'));
  if (highUrges.length > 0) {
    parts.push(`High-risk urges were reported ${highUrges.length} time${highUrges.length !== 1 ? 's' : ''}.`);
  }

  const relTriggerCount = recent.filter(e => e.checkIn.triggers.some(t => t.category === 'relationship')).length;
  if (relTriggerCount > 2) {
    parts.push(`Relationship-related triggers appeared in ${relTriggerCount} check-ins, suggesting interpersonal stress.`);
  }

  const rapidRewrites = recentDrafts.filter(d => d.rewrittenText).length;
  if (rapidRewrites >= 3) {
    parts.push(`${rapidRewrites} messages were rewritten, which may indicate communication anxiety.`);
  }

  const madeWorseOutcomes = recentDrafts.filter(d => d.outcome === 'made_worse').length;
  if (madeWorseOutcomes > 0) {
    parts.push(`${madeWorseOutcomes} communication outcome${madeWorseOutcomes !== 1 ? 's were' : ' was'} self-reported as making things worse, which may indicate patterns worth exploring.`);
  }

  const helpedOutcomes = recentDrafts.filter(d => d.outcome === 'helped').length;
  const totalOutcomes = recentDrafts.filter(d => d.outcome).length;
  if (helpedOutcomes > 0 && totalOutcomes > 0) {
    const helpRate = Math.round((helpedOutcomes / totalOutcomes) * 100);
    parts.push(`Of ${totalOutcomes} recorded communication outcomes, ${helpRate}% were rated as helpful.`);
  }

  if (parts.length === 0) {
    parts.push('No urgent patterns were detected. Consider reviewing the emotional trends and triggers together in session.');
  }

  return parts.join(' ');
}

function getTopItem(items: string[]): string | null {
  const counts: Record<string, number> = {};
  items.forEach(item => { counts[item] = (counts[item] || 0) + 1; });
  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
  return sorted[0]?.[0] ?? null;
}

function buildDiscussionPrompts(
  entries: JournalEntry[],
  drafts: MessageDraft[],
  days: number,
): TherapyDiscussionPrompt[] {
  const recent = entries.filter(e => isWithinDays(e.timestamp, days));
  const recentDrafts = drafts.filter(d => isWithinDays(d.timestamp, days));
  const prompts: TherapyDiscussionPrompt[] = [];

  const relTriggerCount = recent.filter(e =>
    e.checkIn.triggers.some(t => t.category === 'relationship')
  ).length;
  if (relTriggerCount >= 2) {
    prompts.push({
      topic: 'Why does uncertainty in communication feel so destabilizing?',
      context: `Relationship-related triggers appeared in ${relTriggerCount} check-ins during this period.`,
      category: 'relational',
    });
  }

  const reassuranceUrges = recent.filter(e =>
    e.checkIn.urges.some(u => u.label.toLowerCase().includes('reassurance'))
  ).length;
  if (reassuranceUrges > 0) {
    prompts.push({
      topic: 'What happens internally before reassurance-seeking becomes urgent?',
      context: `Reassurance-seeking urges appeared ${reassuranceUrges} time${reassuranceUrges !== 1 ? 's' : ''}.`,
      category: 'behavioral',
    });
  }

  const highDistress = recent.filter(e => e.checkIn.intensityLevel >= 7);
  if (highDistress.length >= 2) {
    prompts.push({
      topic: 'What makes certain moments feel so much more intense than others?',
      context: `There were ${highDistress.length} high-distress moments (7+/10) this period.`,
      category: 'emotional',
    });
  }

  const shameEntries = recent.filter(e =>
    e.checkIn.emotions.some(em => ['Shame', 'Guilt', 'Worthless'].includes(em.label))
  );
  if (shameEntries.length >= 2) {
    prompts.push({
      topic: 'How can I respond to shame without withdrawing or overexplaining?',
      context: `Shame-related emotions appeared in ${shameEntries.length} check-ins.`,
      category: 'emotional',
    });
  }

  const rewriteCount = recentDrafts.filter(d => d.rewrittenText).length;
  if (rewriteCount >= 2) {
    prompts.push({
      topic: 'How can I protect my dignity while still asking for connection?',
      context: `${rewriteCount} messages were rewritten, suggesting communication anxiety.`,
      category: 'relational',
    });
  }

  const abandonmentTriggers = recent.filter(e =>
    e.checkIn.triggers.some(t =>
      t.label.toLowerCase().includes('abandon') || t.label.toLowerCase().includes('rejection')
    )
  ).length;
  if (abandonmentTriggers > 0) {
    prompts.push({
      topic: 'What does abandonment fear feel like in the body, and what helps ground it?',
      context: `Abandonment or rejection triggers appeared ${abandonmentTriggers} time${abandonmentTriggers !== 1 ? 's' : ''}.`,
      category: 'emotional',
    });
  }

  const copingCount = recent.reduce((s, e) => s + (e.checkIn.copingUsed?.length ?? 0), 0);
  if (copingCount >= 3) {
    prompts.push({
      topic: 'Which coping strategies feel most natural, and which still feel forced?',
      context: `Coping tools were used ${copingCount} times this period.`,
      category: 'growth',
    });
  }

  const reflections = recent.filter(e => e.reflection && e.reflection.length > 15).length;
  if (reflections >= 3) {
    prompts.push({
      topic: 'What patterns am I noticing in my own reflections?',
      context: `${reflections} detailed reflections were written this period.`,
      category: 'growth',
    });
  }

  const helpedOutcomes = recentDrafts.filter(d => d.outcome === 'helped').length;
  const madeWorseOutcomes = recentDrafts.filter(d => d.outcome === 'made_worse').length;
  const totalOutcomes = recentDrafts.filter(d => d.outcome).length;

  if (totalOutcomes > 0 && helpedOutcomes > 0 && madeWorseOutcomes > 0) {
    prompts.push({
      topic: 'What was different about conversations that went well versus those that didn\'t?',
      context: `Of ${totalOutcomes} recorded outcomes, ${helpedOutcomes} helped and ${madeWorseOutcomes} made things harder.`,
      category: 'relational',
    });
  }

  if (madeWorseOutcomes >= 2) {
    prompts.push({
      topic: 'What patterns do I notice in the conversations that made things harder?',
      context: `${madeWorseOutcomes} communication outcomes were self-reported as making things worse.`,
      category: 'behavioral',
    });
  }

  const pausedThenHelped = recentDrafts.filter(d => d.paused && d.outcome === 'helped').length;
  if (pausedThenHelped > 0) {
    prompts.push({
      topic: 'How does pausing before responding change the outcome of conversations?',
      context: `${pausedThenHelped} paused message${pausedThenHelped !== 1 ? 's' : ''} led to helpful outcomes.`,
      category: 'growth',
    });
  }

  if (prompts.length === 0) {
    prompts.push({
      topic: 'What felt most emotionally significant this week?',
      context: 'A general reflection to open the session.',
      category: 'emotional',
    });
    prompts.push({
      topic: 'What is one thing I am learning about myself through tracking?',
      context: 'Exploring self-awareness growth.',
      category: 'growth',
    });
  }

  return prompts.slice(0, 6);
}

function buildRegulation(drafts: MessageDraft[], days: number): TherapyReportRegulationSection {
  const recentDrafts = drafts.filter(d => isWithinDays(d.timestamp, days));

  const totalPauses = recentDrafts.filter(d => d.paused).length;
  const totalRewrites = recentDrafts.filter(d => d.rewrittenText).length;
  const sentWithoutPause = recentDrafts.filter(d => d.sent && !d.paused && !d.rewrittenText).length;
  const outcomesRecorded = recentDrafts.filter(d => d.outcome).length;
  const helpedCount = recentDrafts.filter(d => d.outcome === 'helped').length;
  const madeWorseCount = recentDrafts.filter(d => d.outcome === 'made_worse').length;

  const parts: string[] = [];

  if (totalPauses > 0 || totalRewrites > 0) {
    parts.push(`The client paused ${totalPauses} time${totalPauses !== 1 ? 's' : ''} and rewrote ${totalRewrites} message${totalRewrites !== 1 ? 's' : ''} during this period.`);
  }

  if (sentWithoutPause > 0 && totalPauses > 0) {
    const pauseRate = Math.round((totalPauses / (totalPauses + sentWithoutPause)) * 100);
    parts.push(`Pause-before-send rate was approximately ${pauseRate}%.`);
  }

  if (helpedCount > 0) {
    parts.push(`${helpedCount} communication outcome${helpedCount !== 1 ? 's were' : ' was'} recorded as helpful.`);
  }

  if (madeWorseCount > 0) {
    parts.push(`${madeWorseCount} outcome${madeWorseCount !== 1 ? 's were' : ' was'} recorded as making things harder, which may be worth exploring.`);
  }

  if (parts.length === 0) {
    parts.push('No message regulation data was recorded during this period.');
  }

  return {
    totalPauses,
    totalRewrites,
    sentWithoutPause,
    outcomesRecorded,
    helpedCount,
    madeWorseCount,
    narrative: parts.join(' '),
  };
}

function getPeriodLabel(days: number): string {
  if (days <= 7) return 'This Week';
  if (days <= 14) return 'Past Two Weeks';
  return 'Past Month';
}

export function generateTherapyReport(
  journalEntries: JournalEntry[],
  messageDrafts: MessageDraft[],
  periodDays: number = 7,
): TherapyReport {
  console.log('[TherapyReport] Generating report for', periodDays, 'days with', journalEntries.length, 'entries');

  const recent = journalEntries.filter(e => isWithinDays(e.timestamp, periodDays));

  const report: TherapyReport = {
    id: `therapy_report_${Date.now()}`,
    generatedAt: Date.now(),
    periodDays,
    periodLabel: getPeriodLabel(periodDays),
    dateRange: formatDateRange(periodDays),
    overviewNarrative: buildOverview(journalEntries, messageDrafts, periodDays),
    emotions: buildEmotions(journalEntries, periodDays),
    triggers: buildTriggers(journalEntries, periodDays),
    distressTrend: buildDistressTrend(journalEntries, periodDays),
    relationships: buildRelationships(journalEntries, messageDrafts, periodDays),
    coping: buildCoping(journalEntries, periodDays),
    urges: buildUrges(journalEntries, periodDays),
    regulation: buildRegulation(messageDrafts, periodDays),
    progress: buildProgress(journalEntries, messageDrafts, periodDays),
    therapistNote: buildTherapistNote(journalEntries, messageDrafts, periodDays),
    discussionPrompts: buildDiscussionPrompts(journalEntries, messageDrafts, periodDays),
    checkInCount: recent.length,
    journalReflectionCount: recent.filter(e => e.reflection && e.reflection.length > 10).length,
    hasEnoughData: recent.length >= 2,
  };

  console.log('[TherapyReport] Report generated:', {
    emotions: report.emotions.length,
    triggers: report.triggers.length,
    urges: report.urges.topUrges.length,
    copingTools: report.coping.toolsUsed.length,
    highlights: report.progress.highlights.length,
  });

  return report;
}

export function formatReportAsText(report: TherapyReport): string {
  const lines: string[] = [];

  lines.push(`THERAPY SESSION REPORT`);
  lines.push(`Period: ${report.periodLabel} (${report.dateRange})`);
  lines.push(`Generated: ${new Date(report.generatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`);
  lines.push(`Check-ins: ${report.checkInCount} | Reflections: ${report.journalReflectionCount}`);
  lines.push('');

  lines.push('--- OVERVIEW ---');
  lines.push(report.overviewNarrative);
  lines.push('');

  lines.push('--- EMOTIONAL PATTERNS ---');
  report.emotions.forEach(em => {
    lines.push(`  ${em.emoji} ${em.label}: ${em.percentage}% (${em.trend})`);
  });
  lines.push('');

  lines.push('--- TOP TRIGGERS ---');
  report.triggers.forEach(t => {
    lines.push(`  • ${t.label} (${t.count}x) — associated with: ${t.associatedEmotions.join(', ')}`);
  });
  lines.push('');

  lines.push('--- DISTRESS TREND ---');
  lines.push(`  Average: ${report.distressTrend.average}/10 | Peak: ${report.distressTrend.peak}/10 | Direction: ${report.distressTrend.direction}`);
  lines.push(`  ${report.distressTrend.narrative}`);
  lines.push('');

  if (report.urges.topUrges.length > 0) {
    lines.push('--- URGES ---');
    report.urges.topUrges.forEach(u => {
      lines.push(`  • ${u.label} (${u.count}x, ${u.risk} risk)`);
    });
    lines.push(`  ${report.urges.narrative}`);
    lines.push('');
  }

  lines.push('--- RELATIONSHIP PATTERNS ---');
  lines.push(`  ${report.relationships.narrative}`);
  if (report.relationships.communicationPatterns.length > 0) {
    report.relationships.communicationPatterns.forEach(p => lines.push(`  • ${p}`));
  }
  lines.push('');

  lines.push('--- COPING STRATEGIES ---');
  lines.push(`  ${report.coping.narrative}`);
  report.coping.toolsUsed.forEach(t => {
    lines.push(`  • ${t.tool}: used ${t.count}x (${t.effectiveness})`);
  });
  lines.push('');

  lines.push('--- PROGRESS HIGHLIGHTS ---');
  lines.push(`  ${report.progress.narrative}`);
  report.progress.highlights.forEach(h => lines.push(`  • ${h}`));
  if (report.progress.skillsGained.length > 0) {
    lines.push(`  Skills demonstrated: ${report.progress.skillsGained.join(', ')}`);
  }
  lines.push('');

  lines.push('--- NOTE FOR THERAPIST ---');
  lines.push(`  ${report.therapistNote}`);
  lines.push('');

  lines.push('---');
  lines.push('Generated by BPD Companion App. This report reflects self-reported data and should be discussed with a licensed professional.');

  return lines.join('\n');
}
