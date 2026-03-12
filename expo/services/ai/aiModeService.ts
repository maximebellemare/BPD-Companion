import {
  AIMode,
  AIModeConfig,
  AIModeDetectionContext,
  AIModeDetectionResult,
} from '@/types/aiModes';

export const AI_MODE_CONFIGS: Record<AIMode, AIModeConfig> = {
  calm: {
    id: 'calm',
    label: 'Calm & Co-regulation',
    shortLabel: 'Calm me',
    icon: '🌊',
    description: 'Shorter responses, grounding first, soft reassurance',
    color: '#6B9080',
    responseStyle: {
      maxLength: 'short',
      tone: 'soothing',
      priority: 'grounding',
      groundingFirst: true,
      askQuestions: false,
      maxQuestions: 0,
      suggestActions: true,
    },
  },
  reflection: {
    id: 'reflection',
    label: 'Reflection',
    shortLabel: 'Help me understand',
    icon: '🔍',
    description: 'Explore emotions, gentle questions, deeper understanding',
    color: '#7E57C2',
    responseStyle: {
      maxLength: 'medium',
      tone: 'curious',
      priority: 'exploration',
      groundingFirst: false,
      askQuestions: true,
      maxQuestions: 1,
      suggestActions: false,
    },
  },
  clarity: {
    id: 'clarity',
    label: 'Clarity',
    shortLabel: 'Help me think clearly',
    icon: '💡',
    description: 'Organize thoughts, reduce confusion, find what matters most',
    color: '#2196F3',
    responseStyle: {
      maxLength: 'medium',
      tone: 'structured',
      priority: 'organizing',
      groundingFirst: false,
      askQuestions: true,
      maxQuestions: 1,
      suggestActions: true,
    },
  },
  relationship: {
    id: 'relationship',
    label: 'Relationship Support',
    shortLabel: 'Help me respond well',
    icon: '💬',
    description: 'Communication support, slow down texting urges, secure tone',
    color: '#D4956A',
    responseStyle: {
      maxLength: 'medium',
      tone: 'supportive',
      priority: 'communication',
      groundingFirst: false,
      askQuestions: true,
      maxQuestions: 1,
      suggestActions: true,
    },
  },
  action: {
    id: 'action',
    label: 'Action Mode',
    shortLabel: 'Give me a next step',
    icon: '⚡',
    description: 'Practical steps, one clear action, immediate guidance',
    color: '#00B894',
    responseStyle: {
      maxLength: 'short',
      tone: 'direct',
      priority: 'actionable',
      groundingFirst: false,
      askQuestions: false,
      maxQuestions: 0,
      suggestActions: true,
    },
  },
  high_distress: {
    id: 'high_distress',
    label: 'Simplified Support',
    shortLabel: 'I need simple help',
    icon: '🤲',
    description: 'Very short, one step at a time, grounding-first',
    color: '#E17055',
    responseStyle: {
      maxLength: 'short',
      tone: 'gentle',
      priority: 'safety',
      groundingFirst: true,
      askQuestions: false,
      maxQuestions: 0,
      suggestActions: true,
    },
  },
};

const HIGH_DISTRESS_WORDS = [
  'can\'t take it', 'want to die', 'hurt myself', 'self harm',
  'kill myself', 'ending it', 'can\'t do this anymore', 'nothing matters',
  'want to disappear', 'losing my mind', 'spiraling out of control',
  'can\'t breathe', 'everything is falling apart', 'completely alone',
];

const CALM_WORDS = [
  'calm', 'overwhelm', 'slow down', 'breathe', 'spiraling', 'too much',
  'can\'t stop', 'panic', 'shaking', 'frozen', 'numb', 'shut down',
];

const REFLECTION_WORDS = [
  'pattern', 'notice', 'reflect', 'journal', 'understand', 'what am i',
  'why do i', 'keep doing', 'cycle', 'always', 'making progress',
  'growth', 'what does this mean',
];

const CLARITY_WORDS = [
  'confused', 'don\'t know', 'can\'t tell', 'mixed up', 'overreacting',
  'so many feelings', 'what is happening', 'nothing makes sense',
  'lost', 'foggy', 'unclear', 'which one',
];

const RELATIONSHIP_WORDS = [
  'partner', 'boyfriend', 'girlfriend', 'friend', 'relationship',
  'text', 'message', 'send', 'reply', 'fight', 'conflict', 'abandon',
  'left me', 'leaving', 'ghosting', 'not responding', 'tone changed',
  'rejected', 'rewrite',
];

const ACTION_WORDS = [
  'what should i do', 'next step', 'help me decide', 'practical',
  'action', 'plan', 'what now', 'immediately', 'right now',
  'how do i', 'give me', 'tell me what to',
];

function scoreKeywords(message: string, keywords: string[]): number {
  const lower = message.toLowerCase();
  let score = 0;
  for (const keyword of keywords) {
    if (lower.includes(keyword)) {
      score += 1;
    }
  }
  return score;
}

export function detectAIMode(context: AIModeDetectionContext): AIModeDetectionResult {
  const { messageContent, averageIntensity, relationshipSignals } = context;
  const lower = messageContent.toLowerCase();

  console.log('[AIModeService] Detecting mode for message:', messageContent.substring(0, 50));

  if (HIGH_DISTRESS_WORDS.some(w => lower.includes(w))) {
    console.log('[AIModeService] High distress detected');
    return {
      mode: 'high_distress',
      confidence: 0.95,
      reason: 'High distress language detected',
      wasAutoDetected: true,
    };
  }

  if (averageIntensity && averageIntensity >= 8) {
    const calmScore = scoreKeywords(messageContent, CALM_WORDS);
    if (calmScore > 0) {
      return {
        mode: 'high_distress',
        confidence: 0.85,
        reason: 'High intensity combined with distress signals',
        wasAutoDetected: true,
      };
    }
  }

  const scores: Record<AIMode, number> = {
    calm: scoreKeywords(messageContent, CALM_WORDS),
    reflection: scoreKeywords(messageContent, REFLECTION_WORDS),
    clarity: scoreKeywords(messageContent, CLARITY_WORDS),
    relationship: scoreKeywords(messageContent, RELATIONSHIP_WORDS),
    action: scoreKeywords(messageContent, ACTION_WORDS),
    high_distress: 0,
  };

  if (relationshipSignals) {
    scores.relationship += 1;
  }

  if (context.conversationHistory && context.conversationHistory.length > 4) {
    const recentRelCount = context.conversationHistory
      .slice(-4)
      .filter(m => RELATIONSHIP_WORDS.some(w => m.content.toLowerCase().includes(w)))
      .length;
    if (recentRelCount >= 2) {
      scores.relationship += 1;
    }
  }

  let bestMode: AIMode = 'calm';
  let bestScore = 0;
  for (const [mode, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestMode = mode as AIMode;
    }
  }

  if (bestScore === 0) {
    if (averageIntensity && averageIntensity >= 6) {
      return {
        mode: 'calm',
        confidence: 0.5,
        reason: 'No strong signals but elevated intensity',
        wasAutoDetected: true,
      };
    }
    return {
      mode: 'reflection',
      confidence: 0.4,
      reason: 'Default conversational mode',
      wasAutoDetected: true,
    };
  }

  const confidence = Math.min(0.9, 0.5 + bestScore * 0.15);

  console.log('[AIModeService] Detected mode:', bestMode, 'confidence:', confidence);

  return {
    mode: bestMode,
    confidence,
    reason: `Detected ${bestMode} signals in message`,
    wasAutoDetected: true,
  };
}

export function getModeConfig(mode: AIMode): AIModeConfig {
  return AI_MODE_CONFIGS[mode];
}

export function getManualModeOptions(): Array<{ mode: AIMode; label: string; icon: string }> {
  return [
    { mode: 'calm', label: AI_MODE_CONFIGS.calm.shortLabel, icon: AI_MODE_CONFIGS.calm.icon },
    { mode: 'reflection', label: AI_MODE_CONFIGS.reflection.shortLabel, icon: AI_MODE_CONFIGS.reflection.icon },
    { mode: 'clarity', label: AI_MODE_CONFIGS.clarity.shortLabel, icon: AI_MODE_CONFIGS.clarity.icon },
    { mode: 'relationship', label: AI_MODE_CONFIGS.relationship.shortLabel, icon: AI_MODE_CONFIGS.relationship.icon },
    { mode: 'action', label: AI_MODE_CONFIGS.action.shortLabel, icon: AI_MODE_CONFIGS.action.icon },
  ];
}
