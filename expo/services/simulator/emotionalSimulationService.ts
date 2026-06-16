import {
  ResponseStyle,
  SimulatedResponse,
  SimulationResult,
  SimulationScenario,
  QuickAction,
} from '@/types/simulator';

export const EXAMPLE_SCENARIOS: SimulationScenario[] = [
  {
    id: 'sc1',
    label: 'No reply for hours',
    emoji: '📱',
    situation: "My partner hasn't replied for hours.",
    category: 'relationship',
  },
  {
    id: 'sc2',
    label: 'Plans cancelled',
    emoji: '😞',
    situation: 'My friend cancelled our plans last minute.',
    category: 'social',
  },
  {
    id: 'sc3',
    label: 'Criticized at work',
    emoji: '💼',
    situation: 'My boss criticized my work in front of others.',
    category: 'work',
  },
  {
    id: 'sc4',
    label: 'Feeling left out',
    emoji: '👥',
    situation: 'I saw my friends hanging out without me on social media.',
    category: 'social',
  },
  {
    id: 'sc5',
    label: 'Ex reached out',
    emoji: '💔',
    situation: 'My ex texted me out of nowhere.',
    category: 'relationship',
  },
  {
    id: 'sc6',
    label: 'Argument with family',
    emoji: '🏠',
    situation: 'My parent said something hurtful during a phone call.',
    category: 'relationship',
  },
  {
    id: 'sc7',
    label: 'Tone changed suddenly',
    emoji: '😶',
    situation: "Someone's tone changed and I feel rejected.",
    category: 'social',
  },
  {
    id: 'sc8',
    label: 'Want to send a long message',
    emoji: '✍️',
    situation: 'I want to send a long emotional message right now.',
    category: 'relationship',
  },
  {
    id: 'sc9',
    label: 'Ashamed after argument',
    emoji: '😣',
    situation: 'I feel ashamed after an argument and I keep replaying it.',
    category: 'self',
  },
  {
    id: 'sc10',
    label: 'Need reassurance',
    emoji: '🫂',
    situation: 'I want reassurance but I do not want to escalate.',
    category: 'relationship',
  },
];

interface ResponseTemplate {
  style: ResponseStyle;
  label: string;
  emoji: string;
  color: string;
}

const RESPONSE_TEMPLATES: ResponseTemplate[] = [
  { style: 'anxious', label: 'Anxious / Urgent', emoji: '😰', color: '#3B82F6' },
  { style: 'reassurance', label: 'Reassurance-Seeking', emoji: '🫂', color: '#67E8F9' },
  { style: 'avoidance', label: 'Withdrawn / Avoidant', emoji: '🚪', color: '#3B82F6' },
  { style: 'calm', label: 'Calm / Regulated', emoji: '🌊', color: '#14B8A6' },
  { style: 'boundary', label: 'Boundaried', emoji: '🛡️', color: '#67E8F9' },
  { style: 'secure', label: 'Secure / Self-Respecting', emoji: '💎', color: '#3B82F6' },
];

type Theme = 'abandonment' | 'rejection' | 'conflict' | 'criticism' | 'shame' | 'general';

function detectTheme(situation: string): Theme {
  const lower = situation.toLowerCase();
  if (lower.includes('reply') || lower.includes('respond') || lower.includes('ghost') || lower.includes('ignore') || lower.includes("haven't heard") || lower.includes('not texting') || lower.includes('not replied')) {
    return 'abandonment';
  }
  if (lower.includes('cancel') || lower.includes('left out') || lower.includes('without me') || lower.includes('rejected') || lower.includes('uninvited') || lower.includes('tone changed')) {
    return 'rejection';
  }
  if (lower.includes('argument') || lower.includes('fight') || lower.includes('angry') || lower.includes('yelled') || lower.includes('hurtful') || lower.includes('conflict')) {
    return 'conflict';
  }
  if (lower.includes('criticiz') || lower.includes('blame') || lower.includes('wrong') || lower.includes('mistake') || lower.includes('boss')) {
    return 'criticism';
  }
  if (lower.includes('ashamed') || lower.includes('shame') || lower.includes('embarrass') || lower.includes('replaying') || lower.includes('regret') || lower.includes('guilty')) {
    return 'shame';
  }
  return 'general';
}

type ResponseData = Omit<SimulatedResponse, 'style' | 'label' | 'emoji' | 'color'>;
type ResponseMap = Record<Theme, ResponseData>;

function generateAnxiousResponse(theme: Theme): ResponseData {
  const responses: ResponseMap = {
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
        description: "Withdrawing can create distance and reinforce the belief that people don't want you around.",
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
    shame: {
      exampleResponse: "Obsessively replay the situation. Send rapid-fire apologies or over-explain yourself. Berate yourself internally for not being 'better.'",
      emotionalOutcome: {
        emotion: 'Spiraling shame & self-attack',
        intensity: 'high',
        description: 'The shame cycle intensifies as you judge yourself for having the reaction in the first place.',
      },
      relationshipImpact: {
        direction: 'negative',
        description: 'Over-apologizing can shift the dynamic and make others uncomfortable or confused.',
      },
      healthierAlternative: "One sincere apology is enough. Then ground yourself. Shame thrives on repetition — break the loop with a small action.",
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

function generateReassuranceResponse(theme: Theme): ResponseData {
  const responses: ResponseMap = {
    abandonment: {
      exampleResponse: "Ask repeatedly: 'Do you still love me?' 'Are we okay?' 'Are you mad at me?' Keep checking until you feel certain — but the relief never lasts long.",
      emotionalOutcome: {
        emotion: 'Brief relief then renewed doubt',
        intensity: 'high',
        description: "Each reassurance feels good for a moment, but the doubt returns quickly — often stronger than before.",
      },
      relationshipImpact: {
        direction: 'negative',
        description: 'Frequent reassurance-seeking may exhaust the other person and create a cycle of dependency.',
      },
      healthierAlternative: "Notice the urge to seek reassurance. Ask yourself: 'Would I believe any answer right now?' Often the answer is no — which means the need is internal, not relational.",
      isRecommended: false,
    },
    rejection: {
      exampleResponse: "Reach out to multiple people asking if they actually like you. Fish for compliments. Test the friendship by seeing who reaches out first.",
      emotionalOutcome: {
        emotion: 'Temporary comfort then emptiness',
        intensity: 'moderate',
        description: 'External validation provides short-term relief but doesn\'t address the core wound.',
      },
      relationshipImpact: {
        direction: 'negative',
        description: 'Testing behaviors can strain friendships and create the very rejection you fear.',
      },
      healthierAlternative: "Instead of testing, try directly saying how you feel: 'I felt left out and it hurt.' Honesty invites genuine connection.",
      isRecommended: false,
    },
    conflict: {
      exampleResponse: "Immediately try to fix everything. Apologize excessively even if you weren't wrong. Ask over and over if they're still angry.",
      emotionalOutcome: {
        emotion: 'Anxious people-pleasing',
        intensity: 'high',
        description: 'The need to resolve conflict instantly overrides your own feelings and boundaries.',
      },
      relationshipImpact: {
        direction: 'negative',
        description: 'Over-accommodating teaches others that your boundaries are negotiable.',
      },
      healthierAlternative: "Conflict doesn't always need immediate resolution. It's okay to sit with the discomfort of unresolved tension for a while.",
      isRecommended: false,
    },
    criticism: {
      exampleResponse: "Ask everyone around you if the criticism was fair. Seek endless validation that you're not a failure. Change your behavior completely to avoid future criticism.",
      emotionalOutcome: {
        emotion: 'Fragile self-worth',
        intensity: 'high',
        description: 'Your sense of self becomes dependent on what others think, making you vulnerable to every comment.',
      },
      relationshipImpact: {
        direction: 'neutral',
        description: 'While not directly harmful, over-reliance on others\' opinions prevents building internal confidence.',
      },
      healthierAlternative: "Ask yourself first: 'What do I think about this feedback?' Build the habit of consulting your own judgment before others.",
      isRecommended: false,
    },
    shame: {
      exampleResponse: "Confess everything to someone immediately. Ask them to confirm you're not a bad person. Need them to say it's okay before you can let it go.",
      emotionalOutcome: {
        emotion: 'Dependency on external forgiveness',
        intensity: 'moderate',
        description: 'You outsource your emotional regulation to others rather than developing self-compassion.',
      },
      relationshipImpact: {
        direction: 'neutral',
        description: 'Occasional vulnerability is healthy, but relying on others to regulate your shame can feel heavy for them.',
      },
      healthierAlternative: "Practice saying to yourself what you'd want to hear from someone else. Self-compassion is a skill, not a personality trait.",
      isRecommended: false,
    },
    general: {
      exampleResponse: "Seek constant validation from others. Need external confirmation before you can trust your own feelings or decisions.",
      emotionalOutcome: {
        emotion: 'Temporary comfort, lasting dependency',
        intensity: 'moderate',
        description: 'The relief from reassurance is real but fleeting, creating a cycle that\'s hard to break.',
      },
      relationshipImpact: {
        direction: 'negative',
        description: 'Excessive reassurance-seeking can strain relationships and undermine trust over time.',
      },
      healthierAlternative: "Before seeking reassurance, pause and ask: 'What would I tell a friend in this situation?' Then try telling it to yourself.",
      isRecommended: false,
    },
  };
  return responses[theme] ?? responses.general;
}

function generateCalmResponse(theme: Theme): ResponseData {
  const responses: ResponseMap = {
    abandonment: {
      exampleResponse: "Notice the fear arising. Remind yourself that silence doesn't equal rejection. Engage in a self-soothing activity and check in later at a reasonable time.",
      emotionalOutcome: {
        emotion: 'Manageable unease',
        intensity: 'moderate',
        description: "The worry is still there, but it doesn't control your actions. You ride the wave.",
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
        description: "You feel hurt but don't spiral. The emotion is acknowledged without being amplified.",
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
        description: "You feel uncomfortable but grounded. The criticism doesn't define you.",
      },
      relationshipImpact: {
        direction: 'positive',
        description: 'Openness to feedback strengthens professional and personal relationships.',
      },
      healthierAlternative: "This is a healthy response. Journaling after can help process any lingering feelings.",
      isRecommended: true,
    },
    shame: {
      exampleResponse: "Notice the shame without merging with it. Say to yourself: 'I made a mistake, but I am not a mistake.' Take one small restorative action.",
      emotionalOutcome: {
        emotion: 'Grounded self-awareness',
        intensity: 'moderate',
        description: "The shame is acknowledged but not given the steering wheel. You respond instead of reacting.",
      },
      relationshipImpact: {
        direction: 'positive',
        description: 'Measured self-compassion allows for genuine repair without over-apologizing.',
      },
      healthierAlternative: "This is already healthy. Adding a brief grounding exercise can help anchor the self-compassion in your body.",
      isRecommended: true,
    },
    general: {
      exampleResponse: "Pause and identify what you're feeling. Choose a response that aligns with your values, not your impulse.",
      emotionalOutcome: {
        emotion: 'Centered awareness',
        intensity: 'moderate',
        description: "You stay present with the emotion without letting it drive your behavior.",
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

function generateBoundaryResponse(theme: Theme): ResponseData {
  const responses: ResponseMap = {
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
    shame: {
      exampleResponse: "Set a limit with yourself: 'I will apologize once, sincerely. I will not grovel or beg.' Then follow through.",
      emotionalOutcome: {
        emotion: 'Self-respect emerging through shame',
        intensity: 'moderate',
        description: 'The shame is still present, but you treat yourself with the same respect you\'d offer a friend.',
      },
      relationshipImpact: {
        direction: 'positive',
        description: 'One sincere apology is more meaningful than ten anxious ones.',
      },
      healthierAlternative: "This is already a strong path. After apologizing, redirect your energy toward a small act of self-care.",
      isRecommended: true,
    },
    general: {
      exampleResponse: "Clearly state what you need and what you're willing to accept. Keep it simple, honest, and non-blaming.",
      emotionalOutcome: {
        emotion: 'Groundedness',
        intensity: 'moderate',
        description: "Setting boundaries feels empowering even when it's uncomfortable.",
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

function generateAvoidanceResponse(theme: Theme): ResponseData {
  const responses: ResponseMap = {
    abandonment: {
      exampleResponse: "Pretend you don't care. Tell yourself you don't need anyone. Push down the hurt and distract yourself completely.",
      emotionalOutcome: {
        emotion: 'Numbness masking pain',
        intensity: 'moderate',
        description: "The pain doesn't disappear — it goes underground. You may feel empty or disconnected later.",
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
        description: "The conflict doesn't resolve — it festers. Resentment builds silently.",
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
    shame: {
      exampleResponse: "Disappear. Avoid the person. Avoid the topic. Hope everyone forgets it ever happened.",
      emotionalOutcome: {
        emotion: 'Lingering dread',
        intensity: 'moderate',
        description: 'Avoidance preserves the shame. What you don\'t process keeps its power.',
      },
      relationshipImpact: {
        direction: 'negative',
        description: 'Ghosting or avoiding creates confusion and prevents repair.',
      },
      healthierAlternative: "Face it in small doses. You don't have to address everything at once, but avoiding it entirely keeps you stuck.",
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

function generateSecureResponse(theme: Theme): ResponseData {
  const responses: ResponseMap = {
    abandonment: {
      exampleResponse: "Acknowledge the discomfort: 'I notice I'm anxious about the silence.' Then remind yourself of the relationship's foundation. Engage in something meaningful to you while you wait.",
      emotionalOutcome: {
        emotion: 'Quiet confidence',
        intensity: 'low',
        description: 'You trust the relationship enough to tolerate temporary uncertainty. Your identity doesn\'t depend on this one moment.',
      },
      relationshipImpact: {
        direction: 'positive',
        description: 'Self-assuredness is attractive and builds deeper trust. It shows you believe the relationship can hold space.',
      },
      healthierAlternative: "This is already one of the healthiest possible responses. You're building emotional resilience each time you do this.",
      isRecommended: true,
    },
    rejection: {
      exampleResponse: "Feel the sting, then remind yourself: 'One event doesn't define my worth or this friendship.' Decide later — from a calm place — whether to address it.",
      emotionalOutcome: {
        emotion: 'Grounded self-worth',
        intensity: 'low',
        description: 'The hurt is real, but your sense of self stays intact. You don\'t need this to be okay.',
      },
      relationshipImpact: {
        direction: 'positive',
        description: 'Not reacting from hurt preserves the relationship and gives you time to choose wisely.',
      },
      healthierAlternative: "This is a mature, self-respecting path. You might journal about it to process the residual feelings.",
      isRecommended: true,
    },
    conflict: {
      exampleResponse: "Stay present without escalating or fleeing. Say: 'This conversation is important to me. I need a moment to collect my thoughts so I can respond well.'",
      emotionalOutcome: {
        emotion: 'Steady resolve',
        intensity: 'low',
        description: 'You hold space for both your feelings and the other person\'s. Conflict becomes workable.',
      },
      relationshipImpact: {
        direction: 'positive',
        description: 'Staying engaged without escalating models secure attachment and builds lasting trust.',
      },
      healthierAlternative: "This is already a very strong response. It shows both self-respect and care for the relationship.",
      isRecommended: true,
    },
    criticism: {
      exampleResponse: "Listen fully, then evaluate internally: 'Is any of this useful? What can I learn?' Respond from a place of strength, not defensiveness.",
      emotionalOutcome: {
        emotion: 'Centered self-assessment',
        intensity: 'low',
        description: 'Your self-worth isn\'t tied to external validation. You can hold feedback without crumbling.',
      },
      relationshipImpact: {
        direction: 'positive',
        description: 'Responding thoughtfully to criticism earns deep respect and strengthens trust.',
      },
      healthierAlternative: "This is an excellent approach. You're showing that growth and self-respect can coexist.",
      isRecommended: true,
    },
    shame: {
      exampleResponse: "Acknowledge what happened without catastrophizing: 'I didn't handle that perfectly, and that's human.' Take one repair action, then let it rest.",
      emotionalOutcome: {
        emotion: 'Self-compassion with accountability',
        intensity: 'low',
        description: 'You can hold imperfection without it defining you. Shame loses its grip when met with gentle honesty.',
      },
      relationshipImpact: {
        direction: 'positive',
        description: 'Owning your part without self-destruction earns trust and models emotional maturity.',
      },
      healthierAlternative: "This is already a deeply healthy response. Each time you practice this, shame has less power over you.",
      isRecommended: true,
    },
    general: {
      exampleResponse: "Observe the situation with curiosity rather than judgment. Ask yourself: 'What do I need right now?' Then act from that clarity.",
      emotionalOutcome: {
        emotion: 'Inner stability',
        intensity: 'low',
        description: 'You feel anchored in yourself. External events affect you but don\'t control you.',
      },
      relationshipImpact: {
        direction: 'positive',
        description: 'Secure, self-aware responses create the conditions for meaningful, lasting connection.',
      },
      healthierAlternative: "This is a strong, self-respecting approach that protects both your wellbeing and your relationships.",
      isRecommended: true,
    },
  };
  return responses[theme] ?? responses.general;
}

function generateSummary(theme: Theme): string {
  const summaries: Record<Theme, string> = {
    abandonment: "Abandonment fears are one of the most powerful BPD triggers. Remember: your feelings are real, but they don't always reflect reality. The calm, boundary, and secure responses honor your needs while protecting the relationship.",
    rejection: "Rejection sensitivity can make social situations feel threatening. The key is to notice the emotional spike without acting on it immediately. Your worth isn't determined by any single interaction.",
    conflict: "Conflict can feel like the end of a relationship, but it's often a normal part of connection. Pausing before reacting protects both you and the relationship.",
    criticism: "When criticism feels personal, it's often because it touches a deeper wound. Separating feedback from your core identity is a powerful skill that grows with practice.",
    shame: "Shame tells you that you are the mistake, not that you made one. The shift from shame to self-compassion is one of the most transformative things you can practice.",
    general: "Every emotional situation offers a choice point. The more you practice pausing between the trigger and your response, the more freedom you gain over your reactions.",
  };
  return summaries[theme] ?? summaries.general;
}

function generateQuickActions(theme: Theme): QuickAction[] {
  const base: QuickAction[] = [
    {
      id: 'ground',
      label: 'Ground me first',
      icon: '🌿',
      route: '/exercise?id=grounding-1',
      type: 'navigate',
    },
    {
      id: 'journal',
      label: 'Journal this',
      icon: '📝',
      route: '/journal',
      type: 'navigate',
    },
    {
      id: 'companion',
      label: 'Talk to AI Companion',
      icon: '✨',
      route: '/companion',
      type: 'navigate',
    },
  ];

  if (theme === 'abandonment' || theme === 'conflict' || theme === 'rejection') {
    base.unshift({
      id: 'rewrite',
      label: 'Rewrite a message',
      icon: '💬',
      route: '/messages',
      type: 'navigate',
    });
  }

  base.push({
    id: 'pause',
    label: 'Pause for 2 minutes',
    icon: '⏸️',
    type: 'inline',
  });

  if (theme === 'shame' || theme === 'criticism') {
    base.push({
      id: 'coping',
      label: 'Show coping tools',
      icon: '🧰',
      route: '/tools',
      type: 'navigate',
    });
  }

  return base;
}

export function simulateResponses(situation: string): SimulationResult {
  console.log('[EmotionalSimulator] Simulating responses for:', situation);

  const theme = detectTheme(situation);
  console.log('[EmotionalSimulator] Detected theme:', theme);

  const generators: Array<{ gen: (theme: Theme) => ResponseData; template: ResponseTemplate }> = [
    { gen: generateAnxiousResponse, template: RESPONSE_TEMPLATES[0] },
    { gen: generateReassuranceResponse, template: RESPONSE_TEMPLATES[1] },
    { gen: generateAvoidanceResponse, template: RESPONSE_TEMPLATES[2] },
    { gen: generateCalmResponse, template: RESPONSE_TEMPLATES[3] },
    { gen: generateBoundaryResponse, template: RESPONSE_TEMPLATES[4] },
    { gen: generateSecureResponse, template: RESPONSE_TEMPLATES[5] },
  ];

  const responses: SimulatedResponse[] = generators.map(({ gen, template }) => {
    const data = gen(theme);
    return {
      ...template,
      ...data,
    };
  });

  const quickActions = generateQuickActions(theme);

  const result: SimulationResult = {
    id: `sim_${Date.now()}`,
    situation,
    timestamp: Date.now(),
    responses,
    summary: generateSummary(theme),
    quickActions,
  };

  console.log('[EmotionalSimulator] Generated', responses.length, 'response scenarios with', quickActions.length, 'quick actions');
  return result;
}
