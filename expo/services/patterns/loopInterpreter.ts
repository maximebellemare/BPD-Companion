import {
  EmotionalLoop,
  InterruptPoint,
  InterruptSuggestion,
} from '@/types/emotionalLoop';

const INTERRUPT_SUGGESTIONS: Record<string, InterruptSuggestion[]> = {
  trigger: [
    { id: 'is_pause', label: 'Pause', description: 'Take a moment before reacting', route: '/exercise?id=c6', icon: 'Timer', effectiveness: 0.7 },
    { id: 'is_ground', label: 'Grounding', description: 'Reconnect with the present moment', route: '/exercise?id=c1', icon: 'Anchor', effectiveness: 0.8 },
  ],
  emotion: [
    { id: 'is_breathe', label: 'Breathing', description: 'A few slow breaths may ease intensity', route: '/exercise?id=c1', icon: 'Wind', effectiveness: 0.75 },
    { id: 'is_journal', label: 'Journal', description: 'Write what you notice without judgment', route: '/(tabs)/journal', icon: 'BookOpen', effectiveness: 0.65 },
  ],
  urge: [
    { id: 'is_rewrite', label: 'Message support', description: 'Rewrite before sending', route: '/(tabs)/messages', icon: 'Sparkles', effectiveness: 0.8 },
    { id: 'is_pause_urge', label: 'Pause', description: 'Wait a few minutes before acting', route: '/exercise?id=c6', icon: 'Timer', effectiveness: 0.85 },
  ],
  behavior: [
    { id: 'is_reflect', label: 'Reflect', description: 'Check in with yourself before continuing', route: '/check-in', icon: 'Anchor', effectiveness: 0.7 },
    { id: 'is_companion', label: 'AI Companion', description: 'Talk through what is happening', route: '/(tabs)/companion', icon: 'Sparkles', effectiveness: 0.75 },
  ],
};

function generateNarrative(loop: EmotionalLoop): string {
  const labels = loop.nodes.map(n => n.label.toLowerCase());

  if (labels.length === 0) return '';

  if (loop.category === 'trigger_chain') {
    if (labels.length === 2) {
      return `When ${labels[0]} happens, ${labels[1]} often follows.`;
    }
    if (labels.length >= 3) {
      const middle = labels.slice(1, -1).join(', then ');
      return `When ${labels[0]} happens, ${middle} often follows, which may lead to ${labels[labels.length - 1]}.`;
    }
  }

  if (loop.category === 'emotion_chain') {
    if (labels.length === 2) {
      return `${capitalize(labels[0])} seems closely connected to ${labels[1]}.`;
    }
    if (labels.length >= 3) {
      return `${capitalize(labels[0])} often appears alongside ${labels.slice(1, -1).join(' and ')}, which may lead to ${labels[labels.length - 1]}.`;
    }
  }

  if (loop.category === 'behavior_chain') {
    return `${capitalize(labels[0])} tends to lead to ${labels.slice(1).join(', then ')}.`;
  }

  return `A pattern involving ${labels.join(' → ')} has appeared ${loop.occurrences} times.`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function findInterruptPoints(loop: EmotionalLoop): InterruptPoint[] {
  const points: InterruptPoint[] = [];

  for (let i = 0; i < loop.nodes.length - 1; i++) {
    const node = loop.nodes[i];
    const suggestions = INTERRUPT_SUGGESTIONS[node.type] ?? INTERRUPT_SUGGESTIONS['emotion'];

    if (suggestions) {
      points.push({
        id: `ip_${loop.id}_${i}`,
        loopId: loop.id,
        afterNodeId: node.id,
        afterNodeLabel: node.label,
        suggestions,
        narrative: `After ${node.label.toLowerCase()}, a small pause or shift may help change what follows.`,
      });
    }
  }

  return points;
}

function generateTopInsight(loops: EmotionalLoop[]): string {
  if (loops.length === 0) {
    return 'As you use the app more, patterns will become visible here.';
  }

  const topLoop = loops.sort((a, b) => b.occurrences - a.occurrences)[0];
  const labels = topLoop.nodes.map(n => n.label.toLowerCase());

  if (labels.length >= 3) {
    return `Your most common pattern seems to involve ${labels[0]}, followed by ${labels[1]}, which often leads to ${labels[2]}. Small interruptions early in this sequence may help.`;
  }

  if (labels.length === 2) {
    return `${capitalize(labels[0])} and ${labels[1]} often appear together. Noticing this connection is already a step forward.`;
  }

  return 'Patterns are starting to emerge. Keep checking in to build a clearer picture.';
}

interface InterpretedLoops {
  triggerChains: EmotionalLoop[];
  emotionChains: EmotionalLoop[];
  behaviorChains: EmotionalLoop[];
  interruptPoints: InterruptPoint[];
  topInsight: string;
}

export function interpretLoops(loops: EmotionalLoop[]): InterpretedLoops {
  console.log('[LoopInterpreter] Interpreting', loops.length, 'loops');

  const withNarratives = loops.map(loop => ({
    ...loop,
    narrative: generateNarrative(loop),
  }));

  const triggerChains = withNarratives.filter(l => l.category === 'trigger_chain');
  const emotionChains = withNarratives.filter(l => l.category === 'emotion_chain');
  const behaviorChains = withNarratives.filter(l => l.category === 'behavior_chain');

  const interruptPoints: InterruptPoint[] = [];
  for (const loop of withNarratives) {
    interruptPoints.push(...findInterruptPoints(loop));
  }

  const topInsight = generateTopInsight(withNarratives);

  return {
    triggerChains,
    emotionChains,
    behaviorChains,
    interruptPoints: interruptPoints.slice(0, 10),
    topInsight,
  };
}
