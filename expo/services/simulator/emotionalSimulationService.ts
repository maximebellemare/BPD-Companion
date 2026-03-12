import {
  ResponseStyle,
  SimulatedResponse,
  SimulationResult,
  SimulationScenario,
} from '@/types/simulator';

export const EXAMPLE_SCENARIOS: SimulationScenario[] = [
  {
    id: 'sc1',
    label: 'No reply for hours',
    emoji: '📱',
    situation: "My partner hasn't replied for hours.",
  },
  {
    id: 'sc2',
    label: 'Plans cancelled',
    emoji: '😞',
    situation: 'My friend cancelled our plans last minute.',
  },
  {
    id: 'sc3',
    label: 'Criticized at work',
    emoji: '💼',
    situation: 'My boss criticized my work in front of others.',
  },
  {
    id: 'sc4',
    label: 'Feeling left out',
    emoji: '👥',
    situation: 'I saw my friends hanging out without me on social media.',
  },
  {
    id: 'sc5',
    label: 'Ex reached out',
    emoji: '💔',
    situation: 'My ex texted me out of nowhere.',
  },
  {
    id: 'sc6',
    label: 'Argument with family',
    emoji: '🏠',
    situation: 'My parent said something hurtful during a phone call.',
  },
];

interface ResponseTemplate {
  style: ResponseStyle;
  label: string;
  emoji: string;
  color: string;
}

const RESPONSE_TEMPLATES: ResponseTemplate[] = [
  { style: 'anxious', label: 'Anxious Response', emoji: '😰', color: '#E17055' },
  { style: 'calm', label: 'Calm Response', emoji: '🌊', color: '#6B9080' },
  { style: 'boundary', label: 'Boundary Response', emoji: '🛡️', color: '#D4956A' },
  { style: 'avoidance', label: 'Avoidance Response', emoji: '🚪', color: '#9B8EC4' },
];

function detectTheme(situation: string): 'abandonment' | 'rejection' | 'conflict' | 'criticism' | 'general' {
  const lower = situation.toLowerCase();
  if (lower.includes('reply') || lower.includes('respond') || lower.includes('ghost') || lower.includes('ignore') || lower.includes('haven\'t heard')) {
    return 'abandonment';
  }
  if (lower.includes('cancel') || lower.includes('left out') || lower.includes('without me') || lower.includes('rejected') || lower.includes('uninvited')) {
    return 'rejection';
  }
  if (lower.includes('argument') || lower.includes('fight') || lower.includes('angry') || lower.includes('yelled') || lower.includes('hurtful')) {
    return 'conflict';
  }
  if (lower.includes('criticiz') || lower.includes('blame') || lower.includes('wrong') || lower.includes('mistake') || lower.includes('boss')) {
    return 'criticism';
  }
  return 'general';
}

function generateAnxiousResponse(theme: string, _situation: string): Omit<SimulatedResponse, 'style' | 'label' | 'emoji' | 'color'> {
  const responses: Record<string, Omit<SimulatedResponse, 'style' | 'label' | 'emoji' | 'color'>> = {
    abandonment: {
      exampleResponse: "Send multiple messages asking if everything is okay. Check their social media for activity. Spiral into thoughts about being forgotten or replaced.",
      emotionalOutcome: {
        emotion: 'Panic & desperation',
        intensity: 'high',
        description: 'Anxiety escalates rapidly. Each passing minute feels like confirmation of your worst fears.',
      },
      relationshipImpact: {
        direction: 'negative',
        description: 'Repeated messages may feel overwhelming to the other person and could push them further away.',
      },
      healthierAlternative: "Acknowledge the fear without acting on it. Remind yourself: no reply doesn't mean abandonment. Try a grounding exercise to ride out the wave.",
      isRecommended: false,
    },
    rejection: {
      exampleResponse: "Immediately assume they don't care. Replay every interaction looking for signs they secretly dislike you. Withdraw from all social connections.",
      emotionalOutcome: {
        emotion: 'Deep sadness & self-doubt',
        intensity: 'high',
        description: 'Rejection sensitivity flares. The event feels much larger than it may objectively be.',
      },
      relationshipImpact: {
        direction: 'negative',
        description: 'Withdrawing can create distance and reinforce the belief that people don\'t want you around.',
      },
      healthierAlternative: "Consider that there might be other reasons. You can express your feelings honestly without assuming the worst.",
      isRecommended: false,
    },
    conflict: {
      exampleResponse: "React immediately with intense emotion. Say hurtful things back to protect yourself. Escalate the argument to match the intensity you feel inside.",
      emotionalOutcome: {
        emotion: 'Rage followed by guilt',
        intensity: 'high',
        description: 'The initial anger feels justified, but is quickly followed by shame about your reaction.',
      },
      relationshipImpact: {
        direction: 'negative',
        description: 'Escalation often damages trust and makes resolution harder.',
      },
      healthierAlternative: "Step away before responding. Write down what hurt you. Return to the conversation when the emotional intensity has lowered.",
      isRecommended: false,
    },
    criticism: {
      exampleResponse: "Internalize every word as proof you're fundamentally flawed. Replay the moment obsessively. Consider quitting or ending the relationship entirely.",
      emotionalOutcome: {
        emotion: 'Shame & worthlessness',
        intensity: 'high',
        description: 'Criticism feels like a total rejection of who you are, not just feedback on one thing.',
      },
      relationshipImpact: {
        direction: 'negative',
        description: 'Shutting down or making drastic decisions prevents growth and healthy dialogue.',
      },
      healthierAlternative: "Separate the criticism from your identity. Feedback about one thing is not a judgment of your whole self.",
      isRecommended: false,
    },
    general: {
      exampleResponse: "React from the most intense emotion you're feeling. Let worry take over and make decisions from that place of distress.",
      emotionalOutcome: {
        emotion: 'Overwhelm & distress',
        intensity: 'high',
        description: 'Acting from anxiety usually increases the intensity rather than resolving it.',
      },
      relationshipImpact: {
        direction: 'negative',
        description: 'Reactive behavior often leads to outcomes we regret.',
      },
      healthierAlternative: "Pause, breathe, and name what you're feeling before choosing how to respond.",
      isRecommended: false,
    },
  };
  return responses[theme] ?? responses.general;
}

function generateCalmResponse(theme: string, _situation: string): Omit<SimulatedResponse, 'style' | 'label' | 'emoji' | 'color'> {
  const responses: Record<string, Omit<SimulatedResponse, 'style' | 'label' | 'emoji' | 'color'>> = {
    abandonment: {
      exampleResponse: "Notice the fear arising. Remind yourself that silence doesn't equal rejection. Engage in a self-soothing activity and check in later at a reasonable time.",
      emotionalOutcome: {
        emotion: 'Manageable unease',
        intensity: 'moderate',
        description: 'The worry is still there, but it doesn\'t control your actions. You ride the wave.',
      },
      relationshipImpact: {
        direction: 'positive',
        description: 'Giving space shows trust and often leads to a more connected conversation when they do respond.',
      },
      healthierAlternative: "This is already a healthy response. You might also journal about what the silence triggered in you.",
      isRecommended: true,
    },
    rejection: {
      exampleResponse: "Feel the disappointment, then look for alternative explanations. Reach out gently to express how you feel without accusing.",
      emotionalOutcome: {
        emotion: 'Sadness with self-compassion',
        intensity: 'moderate',
        description: 'You feel hurt but don\'t spiral. The emotion is acknowledged without being amplified.',
      },
      relationshipImpact: {
        direction: 'positive',
        description: 'Honest, gentle communication builds trust and invites understanding.',
      },
      healthierAlternative: "This is a healthy approach. You could also use it as a journal prompt for deeper reflection.",
      isRecommended: true,
    },
    conflict: {
      exampleResponse: "Take a breath. Acknowledge that you're hurt. Ask for time to process before continuing the conversation.",
      emotionalOutcome: {
        emotion: 'Grounded frustration',
        intensity: 'moderate',
        description: 'The anger is present but contained. You protect yourself without attacking.',
      },
      relationshipImpact: {
        direction: 'positive',
        description: 'Taking space before responding shows emotional maturity and often leads to better resolution.',
      },
      healthierAlternative: "This is a strong response. Consider writing down your feelings during the pause.",
      isRecommended: true,
    },
    criticism: {
      exampleResponse: "Listen to the feedback. Separate what's useful from what's hurtful. Respond with curiosity rather than defensiveness.",
      emotionalOutcome: {
        emotion: 'Mild discomfort',
        intensity: 'low',
        description: 'You feel uncomfortable but grounded. The criticism doesn\'t define you.',
      },
      relationshipImpact: {
        direction: 'positive',
        description: 'Openness to feedback strengthens professional and personal relationships.',
      },
      healthierAlternative: "This is a healthy response. Journaling after can help process any lingering feelings.",
      isRecommended: true,
    },
    general: {
      exampleResponse: "Pause and identify what you're feeling. Choose a response that aligns with your values, not your impulse.",
      emotionalOutcome: {
        emotion: 'Centered awareness',
        intensity: 'moderate',
        description: 'You stay present with the emotion without letting it drive your behavior.',
      },
      relationshipImpact: {
        direction: 'positive',
        description: 'Thoughtful responses build trust and strengthen connections over time.',
      },
      healthierAlternative: "This is already a healthy approach. Keep practicing — it gets easier.",
      isRecommended: true,
    },
  };
  return responses[theme] ?? responses.general;
}

function generateBoundaryResponse(theme: string, _situation: string): Omit<SimulatedResponse, 'style' | 'label' | 'emoji' | 'color'> {
  const responses: Record<string, Omit<SimulatedResponse, 'style' | 'label' | 'emoji' | 'color'>> = {
    abandonment: {
      exampleResponse: "When they reply, share how the silence felt without blaming: 'When I don't hear from you for a while, I start to worry. Could we agree on a simple check-in?'",
      emotionalOutcome: {
        emotion: 'Empowered vulnerability',
        intensity: 'moderate',
        description: 'You honor your need for connection while respecting their autonomy.',
      },
      relationshipImpact: {
        direction: 'positive',
        description: 'Clear communication about needs helps both people feel safer in the relationship.',
      },
      healthierAlternative: "This is a strong, healthy response. Practice it when you're calm so it comes naturally when you're not.",
      isRecommended: true,
    },
    rejection: {
      exampleResponse: "Express your feelings directly: 'I felt hurt when I wasn't included. I'd appreciate being considered next time.'",
      emotionalOutcome: {
        emotion: 'Self-respect with vulnerability',
        intensity: 'moderate',
        description: 'Standing up for yourself feels uncomfortable but builds self-worth.',
      },
      relationshipImpact: {
        direction: 'positive',
        description: 'Stating your needs clearly gives the other person a chance to do better.',
      },
      healthierAlternative: "This is already healthy. Remember that setting boundaries is an act of self-care.",
      isRecommended: true,
    },
    conflict: {
      exampleResponse: "Name the boundary clearly: 'I need us to talk about this without raising voices. I'll come back when we can both be calmer.'",
      emotionalOutcome: {
        emotion: 'Firm but kind resolve',
        intensity: 'moderate',
        description: 'You feel steady. Protecting yourself and the relationship simultaneously.',
      },
      relationshipImpact: {
        direction: 'positive',
        description: 'Boundaries during conflict prevent damage and model respectful communication.',
      },
      healthierAlternative: "Excellent approach. Follow through by returning to the conversation when ready.",
      isRecommended: true,
    },
    criticism: {
      exampleResponse: "Acknowledge what's valid, then set a limit: 'I'm open to feedback, but I need it delivered respectfully. Can we revisit this privately?'",
      emotionalOutcome: {
        emotion: 'Dignity preserved',
        intensity: 'low',
        description: 'You accept feedback while protecting your self-worth.',
      },
      relationshipImpact: {
        direction: 'positive',
        description: 'Requesting respectful communication sets a professional and personal standard.',
      },
      healthierAlternative: "This is a healthy response that maintains dignity while staying open to growth.",
      isRecommended: true,
    },
    general: {
      exampleResponse: "Clearly state what you need and what you're willing to accept. Keep it simple, honest, and non-blaming.",
      emotionalOutcome: {
        emotion: 'Groundedness',
        intensity: 'moderate',
        description: 'Setting boundaries feels empowering even when it\'s uncomfortable.',
      },
      relationshipImpact: {
        direction: 'positive',
        description: 'Healthy boundaries protect relationships rather than damage them.',
      },
      healthierAlternative: "Boundaries are a form of self-respect. You're on the right path.",
      isRecommended: true,
    },
  };
  return responses[theme] ?? responses.general;
}

function generateAvoidanceResponse(theme: string, _situation: string): Omit<SimulatedResponse, 'style' | 'label' | 'emoji' | 'color'> {
  const responses: Record<string, Omit<SimulatedResponse, 'style' | 'label' | 'emoji' | 'color'>> = {
    abandonment: {
      exampleResponse: "Pretend you don't care. Tell yourself you don't need anyone. Push down the hurt and distract yourself completely.",
      emotionalOutcome: {
        emotion: 'Numbness masking pain',
        intensity: 'moderate',
        description: 'The pain doesn\'t disappear — it goes underground. You may feel empty or disconnected later.',
      },
      relationshipImpact: {
        direction: 'negative',
        description: 'Emotional walls prevent intimacy and can make the other person feel shut out.',
      },
      healthierAlternative: "It's okay to need space, but complete avoidance delays healing. Try acknowledging the feeling privately, even in a journal.",
      isRecommended: false,
    },
    rejection: {
      exampleResponse: "Cut off contact entirely. Decide they're not worth your time. Avoid all social situations to prevent future hurt.",
      emotionalOutcome: {
        emotion: 'Protective numbness',
        intensity: 'moderate',
        description: 'You feel safe in the short term, but isolation grows over time.',
      },
      relationshipImpact: {
        direction: 'negative',
        description: 'Cutting people off prevents resolution and reinforces the fear of rejection.',
      },
      healthierAlternative: "Taking space is okay, but give yourself a timeline. Process the feelings before deciding to walk away permanently.",
      isRecommended: false,
    },
    conflict: {
      exampleResponse: "Shut down completely. Say 'I'm fine' when you're not. Refuse to engage with the issue. Stonewall.",
      emotionalOutcome: {
        emotion: 'Suppressed anger',
        intensity: 'moderate',
        description: 'The conflict doesn\'t resolve — it festers. Resentment builds silently.',
      },
      relationshipImpact: {
        direction: 'negative',
        description: 'Stonewalling is one of the most damaging patterns in relationships.',
      },
      healthierAlternative: "It's okay to pause, but communicate that you need time. Say 'I need a break from this, but I want to come back to it.'",
      isRecommended: false,
    },
    criticism: {
      exampleResponse: "Go silent. Withdraw from the situation entirely. Stop contributing or trying because 'what's the point?'",
      emotionalOutcome: {
        emotion: 'Defeated withdrawal',
        intensity: 'moderate',
        description: 'Giving up feels like relief at first, but leads to stagnation and lowered self-worth.',
      },
      relationshipImpact: {
        direction: 'negative',
        description: 'Withdrawal signals disengagement and can erode professional and personal trust.',
      },
      healthierAlternative: "Take time to process, but don't let one criticism define your worth. Separate the feedback from your identity.",
      isRecommended: false,
    },
    general: {
      exampleResponse: "Shut down emotionally. Pretend the situation doesn't affect you. Isolate yourself to avoid further pain.",
      emotionalOutcome: {
        emotion: 'Emotional numbness',
        intensity: 'moderate',
        description: 'Avoidance provides temporary relief but prevents genuine processing and growth.',
      },
      relationshipImpact: {
        direction: 'negative',
        description: 'Emotional withdrawal creates distance and misunderstanding in relationships.',
      },
      healthierAlternative: "Allow yourself to feel the discomfort in small doses. You don't have to solve everything at once.",
      isRecommended: false,
    },
  };
  return responses[theme] ?? responses.general;
}

function generateSummary(theme: string): string {
  const summaries: Record<string, string> = {
    abandonment: "Abandonment fears are one of the most powerful BPD triggers. Remember: your feelings are real, but they don't always reflect reality. The calm and boundary responses honor your needs while protecting the relationship.",
    rejection: "Rejection sensitivity can make social situations feel threatening. The key is to notice the emotional spike without acting on it immediately. Your worth isn't determined by any single interaction.",
    conflict: "Conflict can feel like the end of a relationship, but it's often a normal part of connection. Pausing before reacting protects both you and the relationship.",
    criticism: "When criticism feels personal, it's often because it touches a deeper wound. Separating feedback from your core identity is a powerful skill that grows with practice.",
    general: "Every emotional situation offers a choice point. The more you practice pausing between the trigger and your response, the more freedom you gain over your reactions.",
  };
  return summaries[theme] ?? summaries.general;
}

export function simulateResponses(situation: string): SimulationResult {
  console.log('[EmotionalSimulator] Simulating responses for:', situation);

  const theme = detectTheme(situation);
  console.log('[EmotionalSimulator] Detected theme:', theme);

  const generators = [
    { gen: generateAnxiousResponse, template: RESPONSE_TEMPLATES[0] },
    { gen: generateCalmResponse, template: RESPONSE_TEMPLATES[1] },
    { gen: generateBoundaryResponse, template: RESPONSE_TEMPLATES[2] },
    { gen: generateAvoidanceResponse, template: RESPONSE_TEMPLATES[3] },
  ];

  const responses: SimulatedResponse[] = generators.map(({ gen, template }) => {
    const data = gen(theme, situation);
    return {
      ...template,
      ...data,
    };
  });

  const result: SimulationResult = {
    id: `sim_${Date.now()}`,
    situation,
    timestamp: Date.now(),
    responses,
    summary: generateSummary(theme),
  };

  console.log('[EmotionalSimulator] Generated', responses.length, 'response scenarios');
  return result;
}
