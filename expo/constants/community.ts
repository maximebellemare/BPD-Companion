import { CategoryInfo, CommunityPost, PostReply, SupportCircle, CommunityGuideline, SituationTag } from '@/types/community';
import Colors from '@/constants/colors';

export const CATEGORIES: CategoryInfo[] = [
  { id: 'daily-check-in', label: 'Daily Check-In', emoji: '🌅', color: '#E8A87C' },
  { id: 'relationships', label: 'Relationships', emoji: '💛', color: '#D4956A' },
  { id: 'daily-struggles', label: 'Emotional Struggles', emoji: '🌧', color: '#8E9BAA' },
  { id: 'coping-skills', label: 'Coping Skills', emoji: '🧘', color: Colors.primary },
  { id: 'therapy-dbt', label: 'DBT Practice', emoji: '📖', color: '#0984E3' },
  { id: 'progress-wins', label: 'Progress & Wins', emoji: '🌟', color: '#6BA38E' },
  { id: 'ask-community', label: 'Ask Community', emoji: '💬', color: '#9B8EC4' },
  { id: 'success-stories', label: 'Success Stories', emoji: '✨', color: '#00B894' },
  { id: 'questions', label: 'Questions', emoji: '💭', color: '#6C5CE7' },
  { id: 'venting', label: 'Venting', emoji: '🔥', color: Colors.accent },
];

export const SITUATION_TAGS: { id: SituationTag; label: string; emoji: string }[] = [
  { id: 'relationship-conflict', label: 'Relationship conflict', emoji: '💔' },
  { id: 'feeling-rejected', label: 'Feeling rejected', emoji: '😔' },
  { id: 'shame-regret', label: 'Shame or regret', emoji: '😞' },
  { id: 'overwhelmed', label: 'Overwhelmed', emoji: '🌊' },
  { id: 'daily-check-in', label: 'Daily check-in', emoji: '🌤' },
  { id: 'celebrating-progress', label: 'Celebrating progress', emoji: '🎉' },
  { id: 'asking-advice', label: 'Asking for advice', emoji: '🤔' },
];

export const SUPPORT_TYPES = [
  { id: 'just-listening', label: 'Just need to be heard', emoji: '👂' },
  { id: 'advice', label: 'Looking for advice', emoji: '💡' },
  { id: 'shared-experience', label: 'Want shared experiences', emoji: '🤝' },
  { id: 'encouragement', label: 'Need encouragement', emoji: '💪' },
  { id: 'skill-help', label: 'Help with a skill', emoji: '🧠' },
];

export const SUPPORT_REQUEST_TYPES = [
  { id: 'validation' as const, label: 'Validation', emoji: '💛', description: 'I want to feel heard and understood' },
  { id: 'shared-experience' as const, label: 'Shared experience', emoji: '🤝', description: 'I want to know I\'m not alone' },
  { id: 'advice' as const, label: 'Advice', emoji: '💡', description: 'I\'m open to suggestions' },
  { id: 'another-perspective' as const, label: 'Another perspective', emoji: '🔄', description: 'Help me see it differently' },
];

export const RESPONSE_TYPES = [
  { id: 'validation' as const, label: 'Validation', emoji: '💛', color: '#E8A87C' },
  { id: 'shared-experience' as const, label: 'Shared experience', emoji: '🤝', color: '#6BA38E' },
  { id: 'advice' as const, label: 'Advice', emoji: '💡', color: '#9B8EC4' },
  { id: 'another-perspective' as const, label: 'Another perspective', emoji: '🔄', color: '#4A8B8D' },
];

export const HELPFULNESS_OPTIONS = [
  { id: 'helped' as const, label: 'This helped', emoji: '✨' },
  { id: 'gave-perspective' as const, label: 'Gave me perspective', emoji: '🔄' },
  { id: 'not-helpful' as const, label: 'Not helpful', emoji: '🤷' },
];

export const CLOSURE_TYPES = [
  { id: 'what-i-realized' as const, label: 'What I realized', emoji: '💡' },
  { id: 'what-helped' as const, label: 'What helped', emoji: '🌱' },
  { id: 'what-i-will-try' as const, label: 'What I will try next', emoji: '🎯' },
];

export const PRIMARY_EMOTIONS = [
  { id: 'anger', label: 'Anger', emoji: '🔥' },
  { id: 'shame', label: 'Shame', emoji: '😔' },
  { id: 'hurt', label: 'Hurt', emoji: '💔' },
  { id: 'fear', label: 'Fear', emoji: '😨' },
  { id: 'sadness', label: 'Sadness', emoji: '😢' },
  { id: 'loneliness', label: 'Loneliness', emoji: '🫂' },
  { id: 'anxiety', label: 'Anxiety', emoji: '😰' },
  { id: 'overwhelm', label: 'Overwhelm', emoji: '🌊' },
  { id: 'rejection', label: 'Rejection', emoji: '🚪' },
  { id: 'confusion', label: 'Confusion', emoji: '😵‍💫' },
  { id: 'guilt', label: 'Guilt', emoji: '😞' },
  { id: 'hope', label: 'Hope', emoji: '🌅' },
];

export const REACTION_LABELS: Record<string, { emoji: string; label: string }> = {
  heart: { emoji: '💛', label: 'Love' },
  hug: { emoji: '🤗', label: 'Hug' },
  strength: { emoji: '💪', label: 'Strength' },
  seen: { emoji: '👁', label: 'Seen' },
  relate: { emoji: '🤝', label: 'Relate' },
};

export const SUPPORT_REACTION_LABELS: Record<string, { emoji: string; label: string }> = {
  understand: { emoji: '💙', label: 'I understand' },
  experienced: { emoji: '🫂', label: "I've been there" },
  'sending-support': { emoji: '🕊', label: 'Sending support' },
  'helped-me': { emoji: '🌱', label: 'This helped me' },
};

export const REPLY_LABEL_INFO: Record<string, { emoji: string; label: string; color: string }> = {
  'what-helped-me': { emoji: '💡', label: 'What helped me', color: '#E8A87C' },
  'a-skill-that-worked': { emoji: '🧘', label: 'A skill that worked', color: Colors.primary },
  'another-perspective': { emoji: '🔄', label: 'Another perspective', color: '#9B8EC4' },
  'personal-experience': { emoji: '🫂', label: 'Personal experience', color: '#6BA38E' },
};

export const EMOTION_OPTIONS = [
  'anger', 'shame', 'hurt', 'fear', 'sadness',
  'loneliness', 'abandonment anxiety', 'jealousy',
  'confusion', 'relief', 'hope', 'numbness',
  'frustration', 'anxiety', 'guilt', 'overwhelm',
];

const now = Date.now();
const hour = 3600000;
const day = 86400000;

export const MOCK_CIRCLES: SupportCircle[] = [
  {
    id: 'circle-relationship',
    name: 'Relationship Triggers',
    description: 'A safe space to discuss relationship challenges, attachment patterns, and communication struggles.',
    emoji: '💛',
    color: '#D4956A',
    memberCount: 342,
    isJoined: false,
    recentActivity: now - 15 * 60000,
    tags: ['relationships', 'attachment', 'communication'],
  },
  {
    id: 'circle-shame',
    name: 'Shame Recovery',
    description: 'Supporting each other through shame spirals and building self-compassion together.',
    emoji: '🌿',
    color: '#6BA38E',
    memberCount: 218,
    isJoined: true,
    recentActivity: now - 45 * 60000,
    tags: ['shame', 'self-compassion', 'recovery'],
  },
  {
    id: 'circle-regulation',
    name: 'Emotion Regulation Practice',
    description: 'Share experiences with DBT skills, coping strategies, and emotional regulation techniques.',
    emoji: '🧘',
    color: Colors.primary,
    memberCount: 456,
    isJoined: true,
    recentActivity: now - 2 * hour,
    tags: ['dbt', 'coping', 'regulation'],
  },
  {
    id: 'circle-identity',
    name: 'Identity & Self',
    description: 'Exploring identity, sense of self, and finding who you are beyond the diagnosis.',
    emoji: '🪞',
    color: '#9B8EC4',
    memberCount: 187,
    isJoined: false,
    recentActivity: now - 4 * hour,
    tags: ['identity', 'self-discovery', 'growth'],
  },
  {
    id: 'circle-daily',
    name: 'Daily Check-Ins',
    description: 'A gentle space for daily emotional check-ins. No pressure, just presence.',
    emoji: '🌅',
    color: '#E8A87C',
    memberCount: 523,
    isJoined: false,
    recentActivity: now - 30 * 60000,
    tags: ['daily', 'check-in', 'routine'],
  },
];

export const MOCK_POSTS: CommunityPost[] = [
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

export const MOCK_REPLIES: Record<string, PostReply[]> = {
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
  { id: 'harmful' as const, label: 'Harmful or unsafe content', emoji: '⚠️' },
  { id: 'spam' as const, label: 'Spam or self-promotion', emoji: '🚫' },
  { id: 'harassment' as const, label: 'Harassment or bullying', emoji: '🛑' },
  { id: 'misinformation' as const, label: 'Dangerous misinformation', emoji: '❌' },
  { id: 'other' as const, label: 'Other concern', emoji: '💬' },
];

export const COMMUNITY_GUIDELINES: CommunityGuideline[] = [
  {
    title: 'Be kind and supportive',
    description: 'This is a space for mutual support. Treat everyone with compassion, even when you disagree. Remember that everyone here is navigating something difficult.',
  },
  {
    title: 'Respect anonymity',
    description: 'Never try to identify anonymous posters. Everyone deserves the safety of sharing without fear of being recognized.',
  },
  {
    title: 'No diagnosis or medical advice',
    description: 'Share your experiences, not prescriptions. We are peers, not professionals. Encourage others to work with their care team.',
  },
  {
    title: 'Use content warnings',
    description: 'If your post discusses self-harm, substance use, or other potentially triggering topics, please toggle the content warning when posting.',
  },
  {
    title: 'No judgment or stigma',
    description: 'Do not use stigmatizing language about BPD or any mental health condition. We are here to support, not to label.',
  },
  {
    title: 'Protect your boundaries',
    description: 'You do not owe anyone your story. Share only what feels safe. It is okay to step back from a conversation at any time.',
  },
  {
    title: 'Report harmful content',
    description: 'If you see content that feels unsafe, harmful, or violates these guidelines, please report it. We take community safety seriously.',
  },
  {
    title: 'No self-promotion or spam',
    description: 'This is a peer support space, not a marketplace. Keep conversations focused on genuine support and shared experience.',
  },
];

export const GUIDED_POST_PROMPTS = [
  { id: 'what-happened', label: 'What happened?', placeholder: 'Describe the situation briefly...' },
  { id: 'emotions', label: 'What emotions are you feeling?', placeholder: 'Select or describe your emotions...' },
  { id: 'support-type', label: 'What kind of support would help?', placeholder: 'Just listening, advice, shared experiences...' },
];
