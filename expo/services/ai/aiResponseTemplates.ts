export type EmotionalIntent =
  | 'abandoned'
  | 'angry'
  | 'anxious'
  | 'ashamed'
  | 'confused'
  | 'relationship'
  | 'rewrite'
  | 'calming'
  | 'pattern'
  | 'high_distress'
  | 'general';

export interface ResponseTemplate {
  responses: string[];
  quickActions?: string[];
}

export const HIGH_DISTRESS_KEYWORDS = [
  'can\'t take it',
  'want to die',
  'hurt myself',
  'self harm',
  'kill myself',
  'ending it',
  'can\'t do this anymore',
  'nothing matters',
  'no point',
  'want to disappear',
  'hate myself so much',
  'can\'t stop crying',
  'losing my mind',
  'going crazy',
  'everything is falling apart',
  'can\'t breathe',
  'spiraling out of control',
  'completely alone',
  'no one will ever',
];

export const RESPONSE_TEMPLATES: Record<EmotionalIntent, ResponseTemplate> = {
  high_distress: {
    responses: [
      "It sounds really intense right now. Let's make this very simple.\n\nFirst, take one slow breath. In through your nose... and out through your mouth.\n\nYou don't need to solve anything right now. I'm here with you for the next step.",
      "I hear you, and this sounds overwhelming. Let's slow way down.\n\nRight now, just feel your feet on the ground. Press them down gently.\n\nYou're here. You're breathing. That's enough for this moment. I'm not going anywhere.",
      "That sounds like so much pain right now. I want you to know — you reached out, and that matters.\n\nLet's do one thing together: place your hand on your chest. Feel it rise and fall.\n\nWe can take the very next moment together. Nothing else needs to happen right now.",
    ],
    quickActions: ['Ground me', 'Safety mode'],
  },
  abandoned: {
    responses: [
      "That feeling of abandonment is one of the most painful things a person can experience. You're not being dramatic — this is real pain.\n\nCan you tell me what happened that brought this feeling up? Sometimes naming the specific moment helps us see what our mind is reacting to.",
      "That fear of being left behind can feel like the ground is disappearing. I want you to know — right now, in this moment, you're not alone.\n\nWhat does this feel like in your body? Sometimes checking in physically helps us stay anchored when the emotions feel huge.",
      "That makes sense that you'd feel this way. When connection feels uncertain, the fear can be overwhelming.\n\nLet's slow this down together. What happened, and what is your mind telling you it means?",
    ],
    quickActions: ['Ground me', 'Slow this down', 'Journal this'],
  },
  angry: {
    responses: [
      "I can feel the intensity in what you're sharing. That anger is telling you something important — it often shows up when a boundary has been crossed or a need isn't being met.\n\nBefore we dig into what happened, how intense is this right now on a scale of 1-10? That helps me understand where you are.",
      "Your anger makes sense. It's not something to be ashamed of — it's your nervous system reacting to something that feels wrong or unfair.\n\nLet's take one moment before we go deeper. Would it help to take a few breaths first, or do you need to get it all out?",
      "I hear the frustration. When we feel this activated, everything can feel urgent. We can slow this down.\n\nWhat happened? And underneath the anger — is there a hurt or a fear that's driving it?",
    ],
    quickActions: ['Ground me', 'Help me rewrite a message', 'Show coping tools'],
  },
  anxious: {
    responses: [
      "Anxiety can make everything feel urgent and dangerous, even when part of you knows it might not be. That's not a flaw — it's how your brain tries to protect you.\n\nWhat's the anxious thought right now? Let's look at it together without judgment.",
      "I hear you. That feeling of dread or worry can be so consuming. Let's try to untangle it a little.\n\nIf you could name the one thing your mind keeps returning to, what would it be?",
      "That sounds really uncomfortable. Anxiety often lies to us — it tells us things are certain when they're not.\n\nWe can slow this down. Would it help to ground first, or talk through what's worrying you?",
    ],
    quickActions: ['Ground me', 'Slow this down', 'Show coping tools'],
  },
  ashamed: {
    responses: [
      "Shame is one of the heaviest emotions, and it often tells us we ARE the problem rather than that we HAVE a problem. That's the shame talking, not the truth.\n\nYou don't need to be perfect to be worthy of support. What happened that brought this feeling up?",
      "I want you to hear this clearly: feeling ashamed doesn't mean you've done something unforgivable. Shame often exaggerates and distorts.\n\nCan you tell me what you're feeling ashamed about? We can look at it together without judgment.",
      "That sounds really heavy. Shame wants us to hide, but you're doing the opposite by sharing this. That takes courage.\n\nWhat would you say to a friend who felt this way? Sometimes that perspective helps us see ourselves more clearly.",
    ],
    quickActions: ['Journal this', 'Slow this down', 'Show coping tools'],
  },
  confused: {
    responses: [
      "It's okay not to know what you're feeling. Emotions can layer on top of each other until it all feels like noise. Let's try to sort through it.\n\nIf you could describe what's happening inside using a weather metaphor — a storm, fog, freezing cold — what would it be?",
      "Your emotions are giving you information, even when they feel confusing. Let's listen to them together.\n\nWhat's the strongest sensation right now? Not a thought — just the feeling. Where do you notice it in your body?",
      "That confusion is actually really common when multiple emotions happen at once. You're not doing it wrong by not knowing.\n\nLet's start simple: does this feel more heavy or more activating? That can help us narrow it down.",
    ],
    quickActions: ['Ground me', 'Journal this'],
  },
  relationship: {
    responses: [
      "Relationship triggers can feel like the past and present collapsing into one moment. Your reaction makes sense — it's your nervous system responding based on past pain.\n\nLet's separate what happened from what your fear is telling you it means. What's the situation?",
      "When someone we care about triggers us, the emotional response can feel completely disproportionate to the moment. That doesn't mean it's wrong — it means there's something deeper underneath.\n\nWhat happened, and what do you need from this person right now?",
      "I hear how activated you are about this. Let's slow down before any decisions are made.\n\nWhat's the story your mind is telling you about what happened? And is there another possible interpretation?",
    ],
    quickActions: ['Help me rewrite a message', 'Slow this down', 'Journal this'],
  },
  rewrite: {
    responses: [
      "That's such a wise move — pausing before sending when you're activated. Let's work on this together.\n\nShare the message you're thinking of sending, and tell me: what do you actually need from this person right now? The real need is often different from what the urge wants to express.",
      "I'd love to help with that. When emotions are intense, our words can say more about our pain than what we actually need to communicate.\n\nGo ahead and share what you want to say. I'll help you find words that honor your feelings while protecting the relationship.",
      "Good instinct to pause. Let's find the right words together.\n\nWhat do you want to say, and what outcome are you hoping for? Sometimes those are different things.",
    ],
    quickActions: ['Help me rewrite a message', 'Slow this down'],
  },
  calming: {
    responses: [
      "Let's take this one breath at a time. You reached out, which means part of you knows you can get through this. That part is right.\n\nPlace one hand on your chest. Feel it rise and fall. You're breathing. You're here.\n\nWhat feels most overwhelming right now?",
      "I'm here with you. Let's slow everything down together. Nothing needs to be decided or solved right now.\n\nTry this: breathe in for 4 counts... hold for 4... and out for 6. Let's do that twice before we talk about anything else.",
      "You're reaching out, and that's the right thing to do. Let's make this very manageable.\n\nFirst — can you name one thing you can see right now? One thing you can touch? Starting with our senses helps bring us back to the present.",
    ],
    quickActions: ['Ground me', 'Show coping tools', 'Safety mode'],
  },
  pattern: {
    responses: [
      "Looking at your patterns takes real self-awareness. That's a strength, even when what you see feels hard.\n\nYou seem to notice cycles in how you react. Can you describe the pattern you're seeing? Let's map it out together.",
      "Noticing patterns is the first step toward changing them. The fact that you're asking means you're already building awareness.\n\nWhat cycle feels most present for you right now? I can help you look at it from a different angle.",
      "I've been paying attention to what you've shared with me, and I see some themes. You're working through real, complex emotional patterns — and that's not easy.\n\nWould you like to explore what I've noticed, or is there a specific pattern you want to talk about?",
    ],
    quickActions: ['Journal this', 'Show coping tools'],
  },
  general: {
    responses: [
      "There's something real in what you're describing, even if it's hard to put into words right now.\n\nIf you had to name the one feeling that's strongest — not what you think you should feel, but what's actually there — what would it be?",
      "What you're going through sounds like it carries some weight. You don't have to untangle all of it at once.\n\nWhat's the piece of this that keeps pulling at you? That's usually where the most important thing lives.",
      "Something brought you here right now, and that matters. Whether it's a specific moment or a feeling that won't let go — both are worth exploring.\n\nWhat happened, or what shifted, that made this feel like the right time to talk about it?",
      "I notice you're holding something that feels significant. Sometimes the hardest part is figuring out where to start.\n\nWould it help to focus on what happened, or on what you're feeling about it? Either path can lead somewhere useful.",
    ],
    quickActions: ['Ground me', 'Journal this', 'Show coping tools'],
  },
};

export const FOLLOW_UP_RESPONSES: Record<string, string[]> = {
  after_grounding: [
    "Check in with your body for a second. Does anything feel different — even slightly? Sometimes the shift is subtle, like going from a 9 to an 8.",
    "Notice where you are right now. Not where you were five minutes ago, but right here. Has anything loosened, even a little?",
    "You just gave your nervous system a moment to catch up. Whatever you're noticing now — calmer, still activated, somewhere in between — that's useful information.",
  ],
  after_venting: [
    "You needed to get that out, and now it's here between us instead of only inside you. That shift matters.\n\nOf everything you just said, what part carries the most weight?",
    "That was a lot to hold. Now that it's out — if you had to pick the one thread that feels most tangled, which would it be?",
    "Sometimes saying it out loud changes how it feels. Does anything land differently now that you've said it?",
  ],
  encouragement: [
    "Sitting with difficult emotions instead of running from them is a skill you're building. Each time gets a little more familiar.",
    "You're choosing to look at something painful instead of pushing it away. That's not easy, and it's not nothing.",
    "Growth in emotional work rarely feels like progress in the moment. But the fact that you're here, doing this — that's the evidence.",
  ],
};
