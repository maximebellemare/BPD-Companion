import { CategoryInfo, CommunityPost, PostReply, SupportCircle, CommunityGuideline, SituationTag } from '@/types/community';
import Colors from '@/constants/colors';
import { localizedArrayProxy, localizedField, localizedFields } from '@/lib/i18n/staticText';

export const CATEGORIES: CategoryInfo[] = [
  localizedField({ id: 'daily-check-in', label: 'Daily Check-In', emoji: '🌅', color: '#67E8F9' }, 'label', 'Daily Check-In', 'Check-in diario'),
  localizedField({ id: 'relationships', label: 'Relationships', emoji: '💛', color: '#67E8F9' }, 'label', 'Relationships', 'Relaciones'),
  localizedField({ id: 'daily-struggles', label: 'Emotional Struggles', emoji: '🌧', color: '#2E2A72' }, 'label', 'Emotional Struggles', 'Dificultades emocionales'),
  localizedField({ id: 'coping-skills', label: 'Coping Skills', emoji: '🧘', color: Colors.primary }, 'label', 'Coping Skills', 'Habilidades de afrontamiento'),
  localizedField({ id: 'therapy-dbt', label: 'DBT Practice', emoji: '📖', color: '#3B82F6' }, 'label', 'DBT Practice', 'Práctica DBT'),
  localizedField({ id: 'progress-wins', label: 'Progress & Wins', emoji: '🌟', color: '#14B8A6' }, 'label', 'Progress & Wins', 'Progreso y logros'),
  localizedField({ id: 'ask-community', label: 'Ask Community', emoji: '💬', color: '#3B82F6' }, 'label', 'Ask Community', 'Preguntar a la comunidad'),
  localizedField({ id: 'success-stories', label: 'Success Stories', emoji: '✨', color: '#14B8A6' }, 'label', 'Success Stories', 'Historias de progreso'),
  localizedField({ id: 'questions', label: 'Questions', emoji: '💭', color: '#3B82F6' }, 'label', 'Questions', 'Preguntas'),
  localizedField({ id: 'venting', label: 'Venting', emoji: '🔥', color: Colors.accent }, 'label', 'Venting', 'Desahogo'),
];

export const SITUATION_TAGS: { id: SituationTag; label: string; emoji: string }[] = [
  localizedField({ id: 'relationship-conflict', label: 'Relationship conflict', emoji: '💔' }, 'label', 'Relationship conflict', 'Conflicto en una relación'),
  localizedField({ id: 'feeling-rejected', label: 'Feeling rejected', emoji: '😔' }, 'label', 'Feeling rejected', 'Sentirme rechazado/a'),
  localizedField({ id: 'shame-regret', label: 'Shame or regret', emoji: '😞' }, 'label', 'Shame or regret', 'Vergüenza o arrepentimiento'),
  localizedField({ id: 'overwhelmed', label: 'Overwhelmed', emoji: '🌊' }, 'label', 'Overwhelmed', 'Abrumado/a'),
  localizedField({ id: 'daily-check-in', label: 'Daily check-in', emoji: '🌤' }, 'label', 'Daily check-in', 'Check-in diario'),
  localizedField({ id: 'celebrating-progress', label: 'Celebrating progress', emoji: '🎉' }, 'label', 'Celebrating progress', 'Celebrar progreso'),
  localizedField({ id: 'asking-advice', label: 'Asking for advice', emoji: '🤔' }, 'label', 'Asking for advice', 'Pedir consejos'),
];

export const SUPPORT_TYPES = [
  localizedField({ id: 'just-listening', label: 'Just need to be heard', emoji: '👂' }, 'label', 'Just need to be heard', 'Solo necesito que me escuchen'),
  localizedField({ id: 'advice', label: 'Looking for advice', emoji: '💡' }, 'label', 'Looking for advice', 'Busco consejos'),
  localizedField({ id: 'shared-experience', label: 'Want shared experiences', emoji: '🤝' }, 'label', 'Want shared experiences', 'Quiero experiencias compartidas'),
  localizedField({ id: 'encouragement', label: 'Need encouragement', emoji: '💪' }, 'label', 'Need encouragement', 'Necesito ánimo'),
  localizedField({ id: 'skill-help', label: 'Help with a skill', emoji: '🧠' }, 'label', 'Help with a skill', 'Ayuda con una habilidad'),
];

export const SUPPORT_REQUEST_TYPES = [
  localizedFields({ id: 'validation' as const, label: 'Validation', emoji: '💛', description: 'I want to feel heard and understood' }, {
    label: { en: 'Validation', es: 'Validación' },
    description: { en: 'I want to feel heard and understood', es: 'Quiero sentirme escuchado/a y comprendido/a' },
  }),
  localizedFields({ id: 'shared-experience' as const, label: 'Shared experience', emoji: '🤝', description: 'I want to know I\'m not alone' }, {
    label: { en: 'Shared experience', es: 'Experiencia compartida' },
    description: { en: "I want to know I'm not alone", es: 'Quiero saber que no estoy solo/a' },
  }),
  localizedFields({ id: 'advice' as const, label: 'Advice', emoji: '💡', description: "I'm open to suggestions" }, {
    label: { en: 'Advice', es: 'Consejos' },
    description: { en: "I'm open to suggestions", es: 'Estoy abierto/a a sugerencias' },
  }),
  localizedFields({ id: 'another-perspective' as const, label: 'Another perspective', emoji: '🔄', description: 'Help me see it differently' }, {
    label: { en: 'Another perspective', es: 'Otra perspectiva' },
    description: { en: 'Help me see it differently', es: 'Ayúdame a verlo de otra manera' },
  }),
];

export const RESPONSE_TYPES = [
  localizedField({ id: 'validation' as const, label: 'Validation', emoji: '💛', color: '#67E8F9' }, 'label', 'Validation', 'Validación'),
  localizedField({ id: 'shared-experience' as const, label: 'Shared experience', emoji: '🤝', color: '#14B8A6' }, 'label', 'Shared experience', 'Experiencia compartida'),
  localizedField({ id: 'advice' as const, label: 'Advice', emoji: '💡', color: '#3B82F6' }, 'label', 'Advice', 'Consejos'),
  localizedField({ id: 'another-perspective' as const, label: 'Another perspective', emoji: '🔄', color: '#14B8A6' }, 'label', 'Another perspective', 'Otra perspectiva'),
];

export const HELPFULNESS_OPTIONS = [
  localizedField({ id: 'helped' as const, label: 'This helped', emoji: '✨' }, 'label', 'This helped', 'Esto me ayudó'),
  localizedField({ id: 'gave-perspective' as const, label: 'Gave me perspective', emoji: '🔄' }, 'label', 'Gave me perspective', 'Me dio perspectiva'),
  localizedField({ id: 'not-helpful' as const, label: 'Not helpful', emoji: '🤷' }, 'label', 'Not helpful', 'No ayudó'),
];

export const CLOSURE_TYPES = [
  localizedField({ id: 'what-i-realized' as const, label: 'What I realized', emoji: '💡' }, 'label', 'What I realized', 'Lo que me di cuenta'),
  localizedField({ id: 'what-helped' as const, label: 'What helped', emoji: '🌱' }, 'label', 'What helped', 'Lo que ayudó'),
  localizedField({ id: 'what-i-will-try' as const, label: 'What I will try next', emoji: '🎯' }, 'label', 'What I will try next', 'Lo que intentaré después'),
];

export const PRIMARY_EMOTIONS = [
  localizedField({ id: 'anger', label: 'Anger', emoji: '🔥' }, 'label', 'Anger', 'Enojo'),
  localizedField({ id: 'shame', label: 'Shame', emoji: '😔' }, 'label', 'Shame', 'Vergüenza'),
  localizedField({ id: 'hurt', label: 'Hurt', emoji: '💔' }, 'label', 'Hurt', 'Dolor'),
  localizedField({ id: 'fear', label: 'Fear', emoji: '😨' }, 'label', 'Fear', 'Miedo'),
  localizedField({ id: 'sadness', label: 'Sadness', emoji: '😢' }, 'label', 'Sadness', 'Tristeza'),
  localizedField({ id: 'loneliness', label: 'Loneliness', emoji: '🫂' }, 'label', 'Loneliness', 'Soledad'),
  localizedField({ id: 'anxiety', label: 'Anxiety', emoji: '😰' }, 'label', 'Anxiety', 'Ansiedad'),
  localizedField({ id: 'overwhelm', label: 'Overwhelm', emoji: '🌊' }, 'label', 'Overwhelm', 'Abrumamiento'),
  localizedField({ id: 'rejection', label: 'Rejection', emoji: '🚪' }, 'label', 'Rejection', 'Rechazo'),
  localizedField({ id: 'confusion', label: 'Confusion', emoji: '😵‍💫' }, 'label', 'Confusion', 'Confusión'),
  localizedField({ id: 'guilt', label: 'Guilt', emoji: '😞' }, 'label', 'Guilt', 'Culpa'),
  localizedField({ id: 'hope', label: 'Hope', emoji: '🌅' }, 'label', 'Hope', 'Esperanza'),
];

export const REACTION_LABELS: Record<string, { emoji: string; label: string }> = {
  heart: localizedField({ emoji: '💛', label: 'Love' }, 'label', 'Love', 'Cariño'),
  hug: localizedField({ emoji: '🤗', label: 'Hug' }, 'label', 'Hug', 'Abrazo'),
  strength: localizedField({ emoji: '💪', label: 'Strength' }, 'label', 'Strength', 'Fuerza'),
  seen: localizedField({ emoji: '👁', label: 'Seen' }, 'label', 'Seen', 'Te veo'),
  relate: localizedField({ emoji: '🤝', label: 'Relate' }, 'label', 'Relate', 'Me identifico'),
};

export const SUPPORT_REACTION_LABELS: Record<string, { emoji: string; label: string }> = {
  understand: localizedField({ emoji: '💙', label: 'I understand' }, 'label', 'I understand', 'Te entiendo'),
  experienced: localizedField({ emoji: '🫂', label: "I've been there" }, 'label', "I've been there", 'He pasado por eso'),
  'sending-support': localizedField({ emoji: '🕊', label: 'Sending support' }, 'label', 'Sending support', 'Enviando apoyo'),
  'helped-me': localizedField({ emoji: '🌱', label: 'This helped me' }, 'label', 'This helped me', 'Esto me ayudó'),
};

export const REPLY_LABEL_INFO: Record<string, { emoji: string; label: string; color: string }> = {
  'what-helped-me': localizedField({ emoji: '💡', label: 'What helped me', color: '#67E8F9' }, 'label', 'What helped me', 'Lo que me ayudó'),
  'a-skill-that-worked': localizedField({ emoji: '🧘', label: 'A skill that worked', color: Colors.primary }, 'label', 'A skill that worked', 'Una habilidad que funcionó'),
  'another-perspective': localizedField({ emoji: '🔄', label: 'Another perspective', color: '#3B82F6' }, 'label', 'Another perspective', 'Otra perspectiva'),
  'personal-experience': localizedField({ emoji: '🫂', label: 'Personal experience', color: '#14B8A6' }, 'label', 'Personal experience', 'Experiencia personal'),
};

export const EMOTION_OPTIONS = localizedArrayProxy([
  'anger', 'shame', 'hurt', 'fear', 'sadness',
  'loneliness', 'abandonment anxiety', 'jealousy',
  'confusion', 'relief', 'hope', 'numbness',
  'frustration', 'anxiety', 'guilt', 'overwhelm',
], [
  'enojo', 'vergüenza', 'dolor', 'miedo', 'tristeza',
  'soledad', 'ansiedad de abandono', 'celos',
  'confusión', 'alivio', 'esperanza', 'entumecimiento',
  'frustración', 'ansiedad', 'culpa', 'abrumamiento',
]);

const now = Date.now();
const hour = 3600000;
const day = 86400000;

export const DEV_SEEDED_CIRCLES: SupportCircle[] = [
  localizedFields({
    id: 'circle-relationship',
    name: 'Relationship Triggers',
    description: 'A safe space to discuss relationship challenges, attachment patterns, and communication struggles.',
    emoji: '💛',
    color: '#67E8F9',
    memberCount: 342,
    isJoined: false,
    recentActivity: now - 15 * 60000,
    tags: ['relationships', 'attachment', 'communication'],
  }, {
    name: { en: 'Relationship Triggers', es: 'Detonantes en relaciones' },
    description: {
      en: 'A safe space to discuss relationship challenges, attachment patterns, and communication struggles.',
      es: 'Un espacio seguro para hablar de desafíos relacionales, patrones de apego y dificultades de comunicación.',
    },
  }),
  localizedFields({
    id: 'circle-shame',
    name: 'Shame Recovery',
    description: 'Supporting each other through shame spirals and building self-compassion together.',
    emoji: '🌿',
    color: '#14B8A6',
    memberCount: 218,
    isJoined: true,
    recentActivity: now - 45 * 60000,
    tags: ['shame', 'self-compassion', 'recovery'],
  }, {
    name: { en: 'Shame Recovery', es: 'Recuperación de la vergüenza' },
    description: {
      en: 'Supporting each other through shame spirals and building self-compassion together.',
      es: 'Apoyarnos durante espirales de vergüenza y construir autocompasión juntas/os.',
    },
  }),
  localizedFields({
    id: 'circle-regulation',
    name: 'Emotion Regulation Practice',
    description: 'Share experiences with DBT skills, coping strategies, and emotional regulation techniques.',
    emoji: '🧘',
    color: Colors.primary,
    memberCount: 456,
    isJoined: true,
    recentActivity: now - 2 * hour,
    tags: ['dbt', 'coping', 'regulation'],
  }, {
    name: { en: 'Emotion Regulation Practice', es: 'Práctica de regulación emocional' },
    description: {
      en: 'Share experiences with DBT skills, coping strategies, and emotional regulation techniques.',
      es: 'Comparte experiencias con habilidades DBT, estrategias de afrontamiento y técnicas de regulación emocional.',
    },
  }),
  localizedFields({
    id: 'circle-identity',
    name: 'Identity & Self',
    description: 'Exploring identity, sense of self, and finding who you are beyond the diagnosis.',
    emoji: '🪞',
    color: '#3B82F6',
    memberCount: 187,
    isJoined: false,
    recentActivity: now - 4 * hour,
    tags: ['identity', 'self-discovery', 'growth'],
  }, {
    name: { en: 'Identity & Self', es: 'Identidad y yo' },
    description: {
      en: 'Exploring identity, sense of self, and finding who you are beyond the diagnosis.',
      es: 'Explorar la identidad, el sentido de ti misma/o y quién eres más allá del diagnóstico.',
    },
  }),
  localizedFields({
    id: 'circle-daily',
    name: 'Daily Check-Ins',
    description: 'A gentle space for daily emotional check-ins. No pressure, just presence.',
    emoji: '🌅',
    color: '#67E8F9',
    memberCount: 523,
    isJoined: false,
    recentActivity: now - 30 * 60000,
    tags: ['daily', 'check-in', 'routine'],
  }, {
    name: { en: 'Daily Check-Ins', es: 'Check-ins diarios' },
    description: {
      en: 'A gentle space for daily emotional check-ins. No pressure, just presence.',
      es: 'Un espacio amable para check-ins emocionales diarios. Sin presión, solo presencia.',
    },
  }),
];

export const DEV_SEEDED_POSTS: CommunityPost[] = [
  {
    id: 'p1',
    title: 'Learning to pause before I text back changed everything',
    body: 'I used to send walls of text the moment I felt abandoned. My therapist suggested waiting even 2 minutes before responding. At first it felt impossible — like the urgency would eat me alive. But after a few weeks of practicing, I noticed something: most of the time, what I wanted to say after waiting was completely different from my first impulse. The pause gave my wise mind a chance to show up. If you struggle with impulsive texting, try starting with just 30 seconds. It gets easier.',
    category: 'coping-skills',
    situationTag: 'relationship-conflict',
    author: { id: 'u1', displayName: 'healing_slowly', isAnonymous: false, isTrustedHelper: true, helpfulReplyCount: 47 },
    createdAt: now - 2 * hour,
    isPinned: true,
    hasContentWarning: false,
    replyCount: 14,
    supportType: 'shared-experience',
    suggestedToolId: 'stop',
    suggestedToolName: 'STOP Skill',
    reactions: [
      { type: 'heart', count: 42, userReacted: false },
      { type: 'relate', count: 31, userReacted: true },
      { type: 'strength', count: 18, userReacted: false },
    ],
    supportReactions: [
      { type: 'understand', count: 28, userReacted: false },
      { type: 'experienced', count: 35, userReacted: true },
      { type: 'sending-support', count: 12, userReacted: false },
      { type: 'helped-me', count: 22, userReacted: false },
    ],
  },
  {
    id: 'p2',
    title: 'Does anyone else feel like they become a different person in every relationship?',
    body: 'I realized I mirror whoever I am close to. With my ex I was adventurous and spontaneous. With my current partner I am quiet and reserved. I do not know who I actually am outside of other people. My therapist says this is related to identity disturbance but knowing the label does not make it less scary. I just want to feel like a real consistent person.',
    category: 'relationships',
    situationTag: 'feeling-rejected',
    author: { id: 'u2', displayName: 'Anonymous', isAnonymous: true },
    createdAt: now - 5 * hour,
    isPinned: false,
    hasContentWarning: false,
    replyCount: 23,
    emotions: ['confusion', 'fear', 'loneliness'],
    supportType: 'shared-experience',
    reactions: [
      { type: 'relate', count: 67, userReacted: false },
      { type: 'hug', count: 29, userReacted: false },
      { type: 'seen', count: 44, userReacted: false },
    ],
    supportReactions: [
      { type: 'understand', count: 52, userReacted: false },
      { type: 'experienced', count: 41, userReacted: false },
      { type: 'sending-support', count: 18, userReacted: false },
      { type: 'helped-me', count: 5, userReacted: false },
    ],
  },
  {
    id: 'p3',
    title: 'I went a whole week without splitting on my partner',
    body: 'This might not sound like much to most people but for me this is huge. Usually by day 3 I have already idealized and devalued them at least once. This week I caught myself starting to split twice and used opposite action both times. I am really proud of myself and wanted to share with people who would understand.',
    category: 'progress-wins',
    situationTag: 'celebrating-progress',
    author: { id: 'u3', displayName: 'brave_steps', isAnonymous: false, isTrustedHelper: false, helpfulReplyCount: 12 },
    createdAt: now - 8 * hour,
    isPinned: true,
    hasContentWarning: false,
    replyCount: 31,
    emotions: ['hope', 'relief'],
    reactions: [
      { type: 'heart', count: 89, userReacted: true },
      { type: 'strength', count: 56, userReacted: false },
      { type: 'hug', count: 34, userReacted: false },
    ],
    supportReactions: [
      { type: 'understand', count: 15, userReacted: false },
      { type: 'experienced', count: 22, userReacted: false },
      { type: 'sending-support', count: 45, userReacted: false },
      { type: 'helped-me', count: 31, userReacted: true },
    ],
  },
  {
    id: 'p4',
    title: 'DBT interpersonal effectiveness — what actually works for you?',
    body: 'I have been learning DEAR MAN in my DBT group and I understand it intellectually but when I am actually in a conversation with someone I care about, it all goes out the window. The emotional intensity just takes over. What specific techniques have helped you actually use these skills in real time? Looking for practical tips not just theory.',
    category: 'therapy-dbt',
    situationTag: 'asking-advice',
    author: { id: 'u4', displayName: 'dbt_journey', isAnonymous: false },
    createdAt: now - 12 * hour,
    isPinned: false,
    hasContentWarning: false,
    replyCount: 19,
    supportType: 'advice',
    suggestedToolId: 'dear-man',
    suggestedToolName: 'DEAR MAN',
    reactions: [
      { type: 'relate', count: 38, userReacted: false },
      { type: 'heart', count: 15, userReacted: false },
    ],
    supportReactions: [
      { type: 'understand', count: 22, userReacted: false },
      { type: 'experienced', count: 18, userReacted: false },
      { type: 'sending-support', count: 8, userReacted: false },
      { type: 'helped-me', count: 3, userReacted: false },
    ],
  },
  {
    id: 'p5',
    title: 'Having a really hard day and just need to be heard',
    body: 'Everything feels too much today. I woke up already feeling like I was going to cry and I have no idea why. My favorite person has not texted me back in 6 hours and I know logically they are probably busy but my brain keeps telling me they hate me and are going to leave. I used the grounding exercise in this app which helped a little. Just needed to write this somewhere safe.',
    category: 'daily-struggles',
    situationTag: 'overwhelmed',
    author: { id: 'u5', displayName: 'Anonymous', isAnonymous: true },
    createdAt: now - 1 * day,
    isPinned: false,
    hasContentWarning: false,
    replyCount: 27,
    emotions: ['sadness', 'abandonment anxiety', 'fear'],
    supportType: 'just-listening',
    reactions: [
      { type: 'hug', count: 53, userReacted: false },
      { type: 'seen', count: 41, userReacted: false },
      { type: 'heart', count: 22, userReacted: false },
    ],
    supportReactions: [
      { type: 'understand', count: 38, userReacted: false },
      { type: 'experienced', count: 45, userReacted: false },
      { type: 'sending-support', count: 52, userReacted: false },
      { type: 'helped-me', count: 2, userReacted: false },
    ],
  },
  {
    id: 'p6',
    title: 'How do you explain BPD to people who do not have it?',
    body: 'I am tired of people thinking BPD means I am manipulative or dramatic. I want to help the people in my life understand what I go through but every time I try to explain it I either shut down or overshare. Has anyone found a good way to have this conversation? Maybe a resource or analogy that helped?',
    category: 'ask-community',
    situationTag: 'asking-advice',
    author: { id: 'u6', displayName: 'open_heart', isAnonymous: false, isTrustedHelper: true, helpfulReplyCount: 63 },
    createdAt: now - 1.5 * day,
    isPinned: false,
    hasContentWarning: false,
    replyCount: 35,
    supportType: 'advice',
    reactions: [
      { type: 'relate', count: 72, userReacted: false },
      { type: 'heart', count: 28, userReacted: false },
      { type: 'strength', count: 19, userReacted: false },
    ],
    supportReactions: [
      { type: 'understand', count: 55, userReacted: false },
      { type: 'experienced', count: 48, userReacted: false },
      { type: 'sending-support', count: 22, userReacted: false },
      { type: 'helped-me', count: 15, userReacted: false },
    ],
  },
  {
    id: 'p7',
    title: 'Grocery shopping felt like climbing a mountain today',
    body: 'The sensory overload was real. Bright lights, loud music, too many people. I almost left my cart and walked out. But I stayed. I used the 5-4-3-2-1 grounding technique right there in the cereal aisle and finished my shopping. Small victory but I am counting it.',
    category: 'daily-check-in',
    situationTag: 'celebrating-progress',
    author: { id: 'u7', displayName: 'one_day', isAnonymous: false },
    createdAt: now - 2 * day,
    isPinned: false,
    hasContentWarning: false,
    replyCount: 18,
    emotions: ['overwhelm', 'relief', 'hope'],
    suggestedToolId: 'grounding-5-4-3-2-1',
    suggestedToolName: '5-4-3-2-1 Grounding',
    reactions: [
      { type: 'strength', count: 45, userReacted: false },
      { type: 'heart', count: 33, userReacted: false },
      { type: 'hug', count: 12, userReacted: false },
    ],
    supportReactions: [
      { type: 'understand', count: 22, userReacted: false },
      { type: 'experienced', count: 30, userReacted: false },
      { type: 'sending-support', count: 15, userReacted: false },
      { type: 'helped-me', count: 18, userReacted: false },
    ],
  },
];

export const DEV_SEEDED_REPLIES: Record<string, PostReply[]> = {
  p1: [
    {
      id: 'r1',
      postId: 'p1',
      body: 'This resonates so much. The pause tool in this app has genuinely helped me. Even 30 seconds makes a difference when your emotions are at a 10.',
      author: { id: 'u8', displayName: 'gentle_mind', isAnonymous: false, isTrustedHelper: true, helpfulReplyCount: 34 },
      createdAt: now - 1 * hour,
      reactions: [{ type: 'heart', count: 8, userReacted: false }],
      supportReactions: [
        { type: 'understand', count: 5, userReacted: false },
        { type: 'helped-me', count: 12, userReacted: false },
      ],
      label: 'what-helped-me',
      isHelpful: true,
    },
    {
      id: 'r2',
      postId: 'p1',
      body: 'I needed to hear this today. I almost sent a really intense message to my ex this morning and managed to wait. The message I eventually sent was so much more grounded. Thank you for sharing.',
      author: { id: 'u9', displayName: 'Anonymous', isAnonymous: true },
      createdAt: now - 30 * 60000,
      reactions: [
        { type: 'hug', count: 5, userReacted: false },
        { type: 'relate', count: 11, userReacted: false },
      ],
      supportReactions: [
        { type: 'experienced', count: 8, userReacted: false },
        { type: 'sending-support', count: 3, userReacted: false },
      ],
      label: 'personal-experience',
    },
  ],
  p3: [
    {
      id: 'r3',
      postId: 'p3',
      body: 'This IS huge! Do not minimize it. Catching yourself mid-split is one of the hardest things to do. You should be so proud. 💛',
      author: { id: 'u10', displayName: 'recovery_road', isAnonymous: false, isTrustedHelper: true, helpfulReplyCount: 51 },
      createdAt: now - 6 * hour,
      reactions: [{ type: 'heart', count: 22, userReacted: false }],
      supportReactions: [
        { type: 'sending-support', count: 18, userReacted: false },
      ],
      label: 'personal-experience',
      isHelpful: true,
    },
  ],
  p5: [
    {
      id: 'r4',
      postId: 'p5',
      body: 'You are heard. The waiting for a text back spiral is so painful. Your feelings are valid even when your brain is lying to you about what the silence means. Sending you a big hug.',
      author: { id: 'u11', displayName: 'safe_space', isAnonymous: false },
      createdAt: now - 20 * hour,
      reactions: [
        { type: 'hug', count: 16, userReacted: false },
        { type: 'heart', count: 9, userReacted: false },
      ],
      supportReactions: [
        { type: 'understand', count: 12, userReacted: false },
        { type: 'sending-support', count: 15, userReacted: false },
      ],
    },
    {
      id: 'r5',
      postId: 'p5',
      body: 'I feel this in my bones. The "no reason" sadness days are the worst because you cannot even problem-solve your way out. Just know you are not alone in this.',
      author: { id: 'u12', displayName: 'Anonymous', isAnonymous: true },
      createdAt: now - 18 * hour,
      reactions: [{ type: 'relate', count: 14, userReacted: false }],
      supportReactions: [
        { type: 'experienced', count: 10, userReacted: false },
      ],
      label: 'personal-experience',
    },
  ],
};

export const REPORT_REASONS = [
  localizedField({ id: 'harmful' as const, label: 'Harmful or unsafe content', emoji: '⚠️' }, 'label', 'Harmful or unsafe content', 'Contenido dañino o inseguro'),
  localizedField({ id: 'spam' as const, label: 'Spam or self-promotion', emoji: '🚫' }, 'label', 'Spam or self-promotion', 'Spam o autopromoción'),
  localizedField({ id: 'harassment' as const, label: 'Harassment or bullying', emoji: '🛑' }, 'label', 'Harassment or bullying', 'Acoso o intimidación'),
  localizedField({ id: 'misinformation' as const, label: 'Dangerous misinformation', emoji: '❌' }, 'label', 'Dangerous misinformation', 'Información peligrosa o falsa'),
  localizedField({ id: 'other' as const, label: 'Other concern', emoji: '💬' }, 'label', 'Other concern', 'Otra preocupación'),
];

export const COMMUNITY_GUIDELINES: CommunityGuideline[] = [
  localizedFields({
    title: 'Be kind and supportive',
    description: 'This is a space for mutual support. Treat everyone with compassion, even when you disagree. Remember that everyone here is navigating something difficult.',
  }, {
    title: { en: 'Be kind and supportive', es: 'Sé amable y brinda apoyo' },
    description: { en: 'This is a space for mutual support. Treat everyone with compassion, even when you disagree. Remember that everyone here is navigating something difficult.', es: 'Este es un espacio de apoyo mutuo. Trata a todas las personas con compasión, incluso cuando no estés de acuerdo. Recuerda que cada persona aquí está atravesando algo difícil.' },
  }),
  localizedFields({
    title: 'Respect anonymity',
    description: 'Never try to identify anonymous posters. Everyone deserves the safety of sharing without fear of being recognized.',
  }, {
    title: { en: 'Respect anonymity', es: 'Respeta el anonimato' },
    description: { en: 'Never try to identify anonymous posters. Everyone deserves the safety of sharing without fear of being recognized.', es: 'Nunca intentes identificar a quienes publican de forma anónima. Todas las personas merecen compartir sin miedo a ser reconocidas.' },
  }),
  localizedFields({
    title: 'No diagnosis or medical advice',
    description: 'Share your experiences, not prescriptions. We are peers, not professionals. Encourage others to work with their care team.',
  }, {
    title: { en: 'No diagnosis or medical advice', es: 'Sin diagnósticos ni consejo médico' },
    description: { en: 'Share your experiences, not prescriptions. We are peers, not professionals. Encourage others to work with their care team.', es: 'Comparte experiencias, no indicaciones. Somos pares, no profesionales. Anima a otras personas a trabajar con su equipo de atención.' },
  }),
  localizedFields({
    title: 'Use content warnings',
    description: 'If your post discusses self-harm, substance use, or other potentially triggering topics, please toggle the content warning when posting.',
  }, {
    title: { en: 'Use content warnings', es: 'Usa advertencias de contenido' },
    description: { en: 'If your post discusses self-harm, substance use, or other potentially triggering topics, please toggle the content warning when posting.', es: 'Si tu publicación habla de autolesión, uso de sustancias u otros temas que podrían activar a alguien, activa la advertencia de contenido al publicar.' },
  }),
  localizedFields({
    title: 'No judgment or stigma',
    description: 'Do not use stigmatizing language about BPD or any mental health condition. We are here to support, not to label.',
  }, {
    title: { en: 'No judgment or stigma', es: 'Sin juicio ni estigma' },
    description: { en: 'Do not use stigmatizing language about BPD or any mental health condition. We are here to support, not to label.', es: 'No uses lenguaje estigmatizante sobre el TLP ni sobre ninguna condición de salud mental. Estamos aquí para apoyar, no para etiquetar.' },
  }),
  localizedFields({
    title: 'Protect your boundaries',
    description: 'You do not owe anyone your story. Share only what feels safe. It is okay to step back from a conversation at any time.',
  }, {
    title: { en: 'Protect your boundaries', es: 'Protege tus límites' },
    description: { en: 'You do not owe anyone your story. Share only what feels safe. It is okay to step back from a conversation at any time.', es: 'No le debes tu historia a nadie. Comparte solo lo que se sienta seguro. Está bien tomar distancia de una conversación en cualquier momento.' },
  }),
  localizedFields({
    title: 'Report harmful content',
    description: 'If you see content that feels unsafe, harmful, or violates these guidelines, please report it. We take community safety seriously.',
  }, {
    title: { en: 'Report harmful content', es: 'Reporta contenido dañino' },
    description: { en: 'If you see content that feels unsafe, harmful, or violates these guidelines, please report it. We take community safety seriously.', es: 'Si ves contenido inseguro, dañino o que viola estas pautas, repórtalo. Tomamos en serio la seguridad de la comunidad.' },
  }),
  localizedFields({
    title: 'No self-promotion or spam',
    description: 'This is a peer support space, not a marketplace. Keep conversations focused on genuine support and shared experience.',
  }, {
    title: { en: 'No self-promotion or spam', es: 'Sin autopromoción ni spam' },
    description: { en: 'This is a peer support space, not a marketplace. Keep conversations focused on genuine support and shared experience.', es: 'Este es un espacio de apoyo entre pares, no un mercado. Mantén las conversaciones enfocadas en apoyo genuino y experiencia compartida.' },
  }),
];

export const GUIDED_POST_PROMPTS = [
  localizedFields({ id: 'what-happened', label: 'What happened?', placeholder: 'Describe the situation briefly...' }, {
    label: { en: 'What happened?', es: '¿Qué pasó?' },
    placeholder: { en: 'Describe the situation briefly...', es: 'Describe brevemente la situación...' },
  }),
  localizedFields({ id: 'emotions', label: 'What emotions are you feeling?', placeholder: 'Select or describe your emotions...' }, {
    label: { en: 'What emotions are you feeling?', es: '¿Qué emociones estás sintiendo?' },
    placeholder: { en: 'Select or describe your emotions...', es: 'Selecciona o describe tus emociones...' },
  }),
  localizedFields({ id: 'support-type', label: 'What kind of support would help?', placeholder: 'Just listening, advice, shared experiences...' }, {
    label: { en: 'What kind of support would help?', es: '¿Qué tipo de apoyo ayudaría?' },
    placeholder: { en: 'Just listening, advice, shared experiences...', es: 'Solo escucha, consejos, experiencias compartidas...' },
  }),
];

import { SupportTopic, CommunityChallenge, ChallengeProgress, CirclePost, CirclePostType } from '@/types/community';

export const SUPPORT_TOPICS: { id: SupportTopic; label: string; emoji: string; description: string }[] = [
  localizedFields({ id: 'relationship-triggers', label: 'Relationship triggers', emoji: '💛', description: 'Understanding and managing relationship patterns' }, {
    label: { en: 'Relationship triggers', es: 'Desencadenantes en relaciones' },
    description: { en: 'Understanding and managing relationship patterns', es: 'Entender y manejar patrones en relaciones' },
  }),
  localizedFields({ id: 'fear-of-rejection', label: 'Fear of rejection', emoji: '🚪', description: 'Coping with rejection sensitivity' }, {
    label: { en: 'Fear of rejection', es: 'Miedo al rechazo' },
    description: { en: 'Coping with rejection sensitivity', es: 'Afrontar la sensibilidad al rechazo' },
  }),
  localizedFields({ id: 'shame-recovery', label: 'Shame recovery', emoji: '🌿', description: 'Healing from shame spirals' }, {
    label: { en: 'Shame recovery', es: 'Recuperación de la vergüenza' },
    description: { en: 'Healing from shame spirals', es: 'Sanar espirales de vergüenza' },
  }),
  localizedFields({ id: 'emotional-regulation', label: 'Emotional regulation', emoji: '🧘', description: 'Building regulation skills' }, {
    label: { en: 'Emotional regulation', es: 'Regulación emocional' },
    description: { en: 'Building regulation skills', es: 'Construir habilidades de regulación' },
  }),
  localizedFields({ id: 'communication-skills', label: 'Communication skills', emoji: '💬', description: 'Healthier conversations and boundaries' }, {
    label: { en: 'Communication skills', es: 'Habilidades de comunicación' },
    description: { en: 'Healthier conversations and boundaries', es: 'Conversaciones y límites más sanos' },
  }),
  localizedFields({ id: 'daily-stability', label: 'Daily stability', emoji: '🌅', description: 'Building consistent routines' }, {
    label: { en: 'Daily stability', es: 'Estabilidad diaria' },
    description: { en: 'Building consistent routines', es: 'Construir rutinas consistentes' },
  }),
];

export const CIRCLE_POST_TYPES: { id: CirclePostType; label: string; emoji: string; color: string }[] = [
  localizedField({ id: 'update', label: 'Update', emoji: '📝', color: '#14B8A6' }, 'label', 'Update', 'Actualización'),
  localizedField({ id: 'question', label: 'Question', emoji: '❓', color: '#3B82F6' }, 'label', 'Question', 'Pregunta'),
  localizedField({ id: 'progress', label: 'Progress', emoji: '🌱', color: '#14B8A6' }, 'label', 'Progress', 'Progreso'),
  localizedField({ id: 'encouragement', label: 'Encouragement', emoji: '💛', color: '#67E8F9' }, 'label', 'Encouragement', 'Ánimo'),
];

const challengeNow = Date.now();
const challengeDay = 86400000;

export const DEV_SEEDED_CHALLENGES: CommunityChallenge[] = [
  localizedFields({
    id: 'challenge-pause',
    title: 'Pause Before Reacting',
    description: 'Practice taking a breath before responding to emotional triggers. Each day, commit to pausing at least once before reacting impulsively.',
    emoji: '⏸️',
    color: '#14B8A6',
    durationDays: 5,
    dailyPrompt: 'Did you pause before reacting today? What happened?',
    participantCount: 87,
    isJoined: false,
    startDate: challengeNow - 2 * challengeDay,
    tags: ['regulation', 'coping', 'mindfulness'],
  }, {
    title: { en: 'Pause Before Reacting', es: 'Pausar antes de reaccionar' },
    description: {
      en: 'Practice taking a breath before responding to emotional triggers. Each day, commit to pausing at least once before reacting impulsively.',
      es: 'Practica respirar antes de responder a detonantes emocionales. Cada día, comprométete a pausar al menos una vez antes de reaccionar impulsivamente.',
    },
    dailyPrompt: { en: 'Did you pause before reacting today? What happened?', es: '¿Pausaste antes de reaccionar hoy? ¿Qué pasó?' },
  }),
  localizedFields({
    id: 'challenge-checkin',
    title: 'Daily Emotional Check-In',
    description: 'Start each day by naming your emotions. Build awareness by checking in with yourself every morning for 7 days.',
    emoji: '🌤',
    color: '#67E8F9',
    durationDays: 7,
    dailyPrompt: 'How are you feeling right now? Name 2-3 emotions.',
    participantCount: 134,
    isJoined: true,
    startDate: challengeNow - 3 * challengeDay,
    tags: ['daily', 'check-in', 'awareness'],
  }, {
    title: { en: 'Daily Emotional Check-In', es: 'Check-in emocional diario' },
    description: {
      en: 'Start each day by naming your emotions. Build awareness by checking in with yourself every morning for 7 days.',
      es: 'Empieza cada día nombrando tus emociones. Construye conciencia haciendo un check-in contigo cada mañana durante 7 días.',
    },
    dailyPrompt: { en: 'How are you feeling right now? Name 2-3 emotions.', es: '¿Cómo te sientes ahora mismo? Nombra 2 o 3 emociones.' },
  }),
  localizedFields({
    id: 'challenge-dbt',
    title: 'One DBT Skill Per Day',
    description: 'Practice a different DBT skill each day. Start small — even 2 minutes of practice counts.',
    emoji: '🧘',
    color: '#3B82F6',
    durationDays: 7,
    dailyPrompt: 'Which DBT skill did you practice today? How did it go?',
    participantCount: 62,
    isJoined: false,
    startDate: challengeNow - 1 * challengeDay,
    tags: ['dbt', 'coping', 'regulation'],
  }, {
    title: { en: 'One DBT Skill Per Day', es: 'Una habilidad DBT por día' },
    description: {
      en: 'Practice a different DBT skill each day. Start small — even 2 minutes of practice counts.',
      es: 'Practica una habilidad DBT distinta cada día. Empieza pequeño: incluso 2 minutos cuentan.',
    },
    dailyPrompt: { en: 'Which DBT skill did you practice today? How did it go?', es: '¿Qué habilidad DBT practicaste hoy? ¿Cómo te fue?' },
  }),
  localizedFields({
    id: 'challenge-compassion',
    title: 'Self-Compassion Week',
    description: 'Replace one self-critical thought with a compassionate one each day. You deserve the kindness you give others.',
    emoji: '💛',
    color: '#14B8A6',
    durationDays: 7,
    dailyPrompt: 'What self-critical thought did you catch today? How did you respond with compassion?',
    participantCount: 95,
    isJoined: false,
    startDate: challengeNow,
    tags: ['self-compassion', 'shame', 'recovery'],
  }, {
    title: { en: 'Self-Compassion Week', es: 'Semana de autocompasión' },
    description: {
      en: 'Replace one self-critical thought with a compassionate one each day. You deserve the kindness you give others.',
      es: 'Reemplaza un pensamiento autocrítico por uno compasivo cada día. Mereces la bondad que das a otras personas.',
    },
    dailyPrompt: {
      en: 'What self-critical thought did you catch today? How did you respond with compassion?',
      es: '¿Qué pensamiento autocrítico notaste hoy? ¿Cómo respondiste con compasión?',
    },
  }),
  localizedFields({
    id: 'challenge-boundary',
    title: 'Boundary Practice',
    description: 'Set or maintain one small boundary each day. It can be as simple as saying "I need a moment" before responding.',
    emoji: '🛡️',
    color: '#67E8F9',
    durationDays: 5,
    dailyPrompt: 'What boundary did you practice today?',
    participantCount: 48,
    isJoined: false,
    startDate: challengeNow + 1 * challengeDay,
    tags: ['communication', 'relationships', 'boundaries'],
  }, {
    title: { en: 'Boundary Practice', es: 'Práctica de límites' },
    description: {
      en: 'Set or maintain one small boundary each day. It can be as simple as saying "I need a moment" before responding.',
      es: 'Establece o mantén un límite pequeño cada día. Puede ser tan simple como decir "necesito un momento" antes de responder.',
    },
    dailyPrompt: { en: 'What boundary did you practice today?', es: '¿Qué límite practicaste hoy?' },
  }),
];

export const DEV_SEEDED_CHALLENGE_PROGRESS: Record<string, ChallengeProgress[]> = {
  'challenge-checkin': [
    { challengeId: 'challenge-checkin', userId: 'current_user', displayName: 'You', completedDays: 3, totalDays: 7, lastCheckedIn: challengeNow - 4 * 3600000, isCurrentUser: true },
    { challengeId: 'challenge-checkin', userId: 'u1', displayName: 'healing_slowly', completedDays: 5, totalDays: 7, lastCheckedIn: challengeNow - 2 * 3600000, isCurrentUser: false },
    { challengeId: 'challenge-checkin', userId: 'u3', displayName: 'brave_steps', completedDays: 4, totalDays: 7, lastCheckedIn: challengeNow - 6 * 3600000, isCurrentUser: false },
    { challengeId: 'challenge-checkin', userId: 'u8', displayName: 'gentle_mind', completedDays: 2, totalDays: 7, lastCheckedIn: challengeNow - 12 * 3600000, isCurrentUser: false },
  ],
};

export const DEV_SEEDED_CIRCLE_POSTS: Record<string, CirclePost[]> = {
  'circle-shame': [
    {
      id: 'cp1',
      circleId: 'circle-shame',
      title: 'Had a shame spiral today but caught it early',
      body: 'I made a mistake at work and immediately felt like the worst person alive. But this time I recognized the spiral starting and used self-compassion instead of spiraling for hours. Small win.',
      author: { id: 'u3', displayName: 'brave_steps', isAnonymous: false, isTrustedHelper: false, helpfulReplyCount: 12 },
      createdAt: challengeNow - 3 * 3600000,
      replyCount: 5,
      reactions: [{ type: 'heart', count: 14, userReacted: false }, { type: 'strength', count: 8, userReacted: false }],
      supportReactions: [{ type: 'understand', count: 11, userReacted: false }, { type: 'experienced', count: 9, userReacted: false }, { type: 'sending-support', count: 6, userReacted: false }, { type: 'helped-me', count: 4, userReacted: false }],
      type: 'progress',
    },
    {
      id: 'cp2',
      circleId: 'circle-shame',
      title: 'How do you separate shame from guilt?',
      body: 'My therapist keeps saying shame is about who you are and guilt is about what you did. But in the moment they feel exactly the same to me. Anyone have tips for telling them apart?',
      author: { id: 'u5', displayName: 'Anonymous', isAnonymous: true },
      createdAt: challengeNow - 8 * 3600000,
      replyCount: 8,
      reactions: [{ type: 'relate', count: 22, userReacted: false }],
      supportReactions: [{ type: 'understand', count: 18, userReacted: false }, { type: 'experienced', count: 15, userReacted: false }, { type: 'sending-support', count: 3, userReacted: false }, { type: 'helped-me', count: 2, userReacted: false }],
      type: 'question',
    },
  ],
  'circle-regulation': [
    {
      id: 'cp3',
      circleId: 'circle-regulation',
      title: 'TIPP skill actually works in a crisis',
      body: 'I was completely overwhelmed yesterday and remembered the TIPP skill. Held ice cubes, did intense exercise for 5 minutes, and my distress dropped from a 9 to a 5. Sharing because I was skeptical before.',
      author: { id: 'u1', displayName: 'healing_slowly', isAnonymous: false, isTrustedHelper: true, helpfulReplyCount: 47 },
      createdAt: challengeNow - 5 * 3600000,
      replyCount: 12,
      reactions: [{ type: 'heart', count: 28, userReacted: false }, { type: 'strength', count: 15, userReacted: true }],
      supportReactions: [{ type: 'understand', count: 8, userReacted: false }, { type: 'experienced', count: 12, userReacted: false }, { type: 'sending-support', count: 5, userReacted: false }, { type: 'helped-me', count: 20, userReacted: false }],
      type: 'progress',
    },
  ],
};

export const DEV_SEEDED_TRUSTED_CONTRIBUTORS = [
  { userId: 'u1', displayName: 'healing_slowly', helpfulCount: 47, positiveFeedback: 38, activityStreak: 14 },
  { userId: 'u10', displayName: 'recovery_road', helpfulCount: 51, positiveFeedback: 42, activityStreak: 21 },
  { userId: 'u6', displayName: 'open_heart', helpfulCount: 63, positiveFeedback: 55, activityStreak: 30 },
  { userId: 'u8', displayName: 'gentle_mind', helpfulCount: 34, positiveFeedback: 28, activityStreak: 10 },
];
