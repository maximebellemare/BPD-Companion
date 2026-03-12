import { MemoryProfile } from '@/types/memory';
import { SupportiveInterpretation } from '@/types/ai';

export function generateSupportiveInterpretations(profile: MemoryProfile): SupportiveInterpretation[] {
  const interpretations: SupportiveInterpretation[] = [];

  if (profile.topTriggers.length > 0) {
    const topTrigger = profile.topTriggers[0].label.toLowerCase();

    if (topTrigger.includes('reject') || topTrigger.includes('abandon') || topTrigger.includes('ignor')) {
      interpretations.push({
        id: 'interp-trigger-abandon',
        text: 'You seem to feel most activated when connection feels uncertain. That makes sense — your need for reassurance is valid.',
        category: 'trigger',
        sentiment: 'gentle',
      });
    } else if (topTrigger.includes('conflict') || topTrigger.includes('criticiz')) {
      interpretations.push({
        id: 'interp-trigger-conflict',
        text: 'Conflict seems to be a strong trigger for you. Remember — disagreement doesn\'t mean disconnection.',
        category: 'trigger',
        sentiment: 'gentle',
      });
    } else {
      interpretations.push({
        id: 'interp-trigger-general',
        text: `"${profile.topTriggers[0].label}" comes up often in your check-ins. Noticing this pattern is already a form of growth.`,
        category: 'trigger',
        sentiment: 'observational',
      });
    }
  }

  if (profile.mostEffectiveCoping) {
    interpretations.push({
      id: 'interp-coping-effective',
      text: `"${profile.mostEffectiveCoping.label}" seems to work well for you. Leaning into what helps is a sign of self-awareness.`,
      category: 'coping',
      sentiment: 'encouraging',
    });
  }

  if (profile.copingToolsUsed.length >= 3) {
    interpretations.push({
      id: 'interp-coping-variety',
      text: 'You\'re building a diverse toolkit of coping strategies. Having options means more resilience in difficult moments.',
      category: 'coping',
      sentiment: 'encouraging',
    });
  }

  if (profile.intensityTrend === 'rising') {
    interpretations.push({
      id: 'interp-trend-rising',
      text: 'Your emotional intensity has been higher recently. This isn\'t a failure — it may mean you\'re processing something important. Be extra gentle with yourself.',
      category: 'pattern',
      sentiment: 'gentle',
    });
  } else if (profile.intensityTrend === 'falling') {
    interpretations.push({
      id: 'interp-trend-falling',
      text: 'Your distress levels have been trending downward. That\'s real progress, even if it doesn\'t always feel like it.',
      category: 'pattern',
      sentiment: 'encouraging',
    });
  }

  if (profile.topEmotions.length > 0) {
    const topEmotion = profile.topEmotions[0].label.toLowerCase();

    if (topEmotion.includes('anxious') || topEmotion.includes('fear') || topEmotion.includes('worry')) {
      interpretations.push({
        id: 'interp-emotion-anxiety',
        text: 'Anxiety appears frequently in your check-ins. Your nervous system is trying to protect you — grounding exercises can help signal safety.',
        category: 'emotion',
        sentiment: 'gentle',
      });
    } else if (topEmotion.includes('sad') || topEmotion.includes('empty') || topEmotion.includes('lonely')) {
      interpretations.push({
        id: 'interp-emotion-sadness',
        text: 'Sadness has been a recurring feeling. Allowing yourself to feel it — rather than pushing it away — is actually a healthy response.',
        category: 'emotion',
        sentiment: 'gentle',
      });
    } else {
      interpretations.push({
        id: 'interp-emotion-general',
        text: `"${profile.topEmotions[0].label}" is your most frequent emotion. Understanding this gives you power to respond to it more skillfully.`,
        category: 'emotion',
        sentiment: 'observational',
      });
    }
  }

  if (profile.relationshipPatterns.length > 0) {
    const rp = profile.relationshipPatterns[0];
    interpretations.push({
      id: 'interp-relationship-pattern',
      text: `${rp.pattern} Recognizing this connection can help you respond differently next time.`,
      category: 'relationship',
      sentiment: 'observational',
    });
  }

  if (profile.copingSuccessRate >= 50) {
    interpretations.push({
      id: 'interp-success-rate',
      text: `You're managing your emotions effectively ${profile.copingSuccessRate}% of the time. That resilience is real and earned.`,
      category: 'coping',
      sentiment: 'encouraging',
    });
  }

  if (profile.weeklyCheckInAvg >= 3) {
    interpretations.push({
      id: 'interp-consistency',
      text: 'Your consistent check-ins show genuine commitment to understanding yourself. That takes courage.',
      category: 'pattern',
      sentiment: 'encouraging',
    });
  }

  return interpretations;
}
