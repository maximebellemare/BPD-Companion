import { DBTSkill, DBTModuleInfo, DBTSituationalEntry } from '@/types/dbt';

export const DBT_MODULES: DBTModuleInfo[] = [
  {
    id: 'mindfulness',
    title: 'Mindfulness',
    description: 'Stay present and observe without judgment',
    color: '#C77DBA',
    bgColor: '#F5E6F3',
    iconName: 'Brain',
    skillCount: 7,
  },
  {
    id: 'distress-tolerance',
    title: 'Distress Tolerance',
    description: 'Survive crisis moments without making things worse',
    color: '#E17055',
    bgColor: '#FDE8E3',
    iconName: 'Shield',
    skillCount: 9,
  },
  {
    id: 'emotional-regulation',
    title: 'Emotion Regulation',
    description: 'Understand and manage intense emotions',
    color: '#6B9080',
    bgColor: '#E3EDE8',
    iconName: 'Waves',
    skillCount: 8,
  },
  {
    id: 'interpersonal-effectiveness',
    title: 'Interpersonal Effectiveness',
    description: 'Communicate needs while keeping relationships',
    color: '#5B8FB9',
    bgColor: '#E3EFF7',
    iconName: 'Users',
    skillCount: 8,
  },
];

export const DBT_SITUATIONAL_ENTRIES: DBTSituationalEntry[] = [
  {
    id: 'sit-before-texting',
    label: 'Before I text',
    sublabel: 'Pause and think first',
    iconName: 'MessageCircle',
    color: '#5B8FB9',
    bgColor: '#E3EFF7',
    skillIds: ['dt-stop', 'er-check-facts', 'dt-pros-cons', 'ie-dear-man'],
  },
  {
    id: 'sit-after-conflict',
    label: 'After conflict',
    sublabel: 'Recover and repair',
    iconName: 'HeartCrack',
    color: '#C47878',
    bgColor: '#F5E0E0',
    skillIds: ['dt-self-soothe', 'ie-give', 'ie-repair-after-conflict', 'er-wave'],
  },
  {
    id: 'sit-feel-rejected',
    label: 'I feel rejected',
    sublabel: 'Check the story your mind is telling',
    iconName: 'ShieldOff',
    color: '#9B8EC4',
    bgColor: '#F0ECF7',
    skillIds: ['er-check-facts', 'dt-radical-acceptance', 'ie-validation', 'mf-non-judgmental'],
  },
  {
    id: 'sit-feel-ashamed',
    label: 'I feel ashamed',
    sublabel: 'Separate behavior from identity',
    iconName: 'Eye',
    color: '#C4956A',
    bgColor: '#F5E8DA',
    skillIds: ['er-opposite-action', 'mf-non-judgmental', 'ie-fast', 'dt-self-soothe'],
  },
  {
    id: 'sit-overwhelmed',
    label: "I'm overwhelmed",
    sublabel: 'Lower intensity fast',
    iconName: 'Zap',
    color: '#E17055',
    bgColor: '#FDE8E3',
    skillIds: ['dt-tip', 'dt-stop', 'dt-ten-minute-pause', 'mf-one-mindfully'],
  },
  {
    id: 'sit-angry',
    label: 'I feel angry',
    sublabel: 'Cool down before reacting',
    iconName: 'Flame',
    color: '#D35D6E',
    bgColor: '#FCE4E4',
    skillIds: ['dt-stop', 'er-opposite-action', 'dt-tip', 'er-check-facts'],
  },
  {
    id: 'sit-anxious',
    label: 'I feel anxious',
    sublabel: 'Ground and calm',
    iconName: 'Wind',
    color: '#4A8B8D',
    bgColor: '#E8F4F4',
    skillIds: ['mf-wise-mind', 'dt-tip', 'mf-observe', 'er-check-facts'],
  },
  {
    id: 'sit-lonely',
    label: 'I feel lonely',
    sublabel: 'Comfort and connect',
    iconName: 'Heart',
    color: '#C77DBA',
    bgColor: '#F5E6F3',
    skillIds: ['dt-self-soothe', 'er-abc-please', 'ie-ask-reassurance', 'mf-wise-mind'],
  },
];

export const DBT_SKILLS: DBTSkill[] = [
  // ═══════════════════════════════════════════
  // MINDFULNESS
  // ═══════════════════════════════════════════
  {
    id: 'mf-wise-mind',
    moduleId: 'mindfulness',
    title: 'Wise Mind',
    subtitle: 'Find the balance between emotion and reason',
    description: 'Wise mind is the overlap between emotional mind and rational mind. It is your inner wisdom — the place where you know what is true and what to do.',
    duration: '7 min',
    difficulty: 'intermediate',
    steps: [
      {
        title: 'Notice Your State',
        instruction: 'Are you in emotion mind (feelings are in charge) or rational mind (logic only, disconnected from feelings)?',
      },
      {
        title: 'Breathe to Center',
        instruction: 'Take 5 slow breaths. With each exhale, imagine sinking deeper into your center — the place below your thoughts and above your gut reactions.',
        tip: 'Many people experience wise mind as a felt sense in the gut or chest, not as a thought.',
      },
      {
        title: 'Ask Your Wise Mind',
        instruction: 'Ask: "What do I truly know about this situation?" Wait for the answer. It may come as a feeling, an image, or a quiet knowing.',
      },
      {
        title: 'Listen Without Judgment',
        instruction: 'Your wise mind may say something you do not want to hear. Listen anyway. Wisdom is not always comfortable.',
      },
      {
        title: 'Act from Wise Mind',
        instruction: 'Whatever action you take next, let it come from this centered place — not from panic, not from cold logic, but from your deepest knowing.',
      },
    ],
    quickSteps: [
      { title: 'Pause', instruction: 'Stop. Close your eyes. Take one deep breath.' },
      { title: 'Ask', instruction: 'What do I truly know right now?' },
      { title: 'Listen', instruction: 'Wait for the quiet answer. Trust it.' },
    ],
    whenToUse: [
      'Before making important decisions',
      'When torn between two extremes',
      'Feeling overwhelmed by emotions or overly disconnected',
      'After a triggering event',
    ],
    tags: ['core-skill', 'balance', 'wisdom', 'decision-making'],
    situationalTags: ['anxious', 'confused', 'decision'],
  },
  {
    id: 'mf-observe',
    moduleId: 'mindfulness',
    title: 'Observe and Describe',
    subtitle: 'Notice your experience without getting caught up in it',
    description: 'Practice noticing your thoughts, feelings, and sensations without reacting. Then describe them in words. This creates distance between you and your experience.',
    duration: '5 min',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Settle In',
        instruction: 'Find a comfortable position. Close your eyes or soften your gaze. Take three deep breaths.',
      },
      {
        title: 'Observe Thoughts',
        instruction: 'Watch your thoughts pass like clouds in the sky. Do not chase them or push them away. Just notice: "There is a thought."',
        tip: 'You are not your thoughts. You are the one observing them.',
      },
      {
        title: 'Observe Emotions',
        instruction: 'Notice any emotions present. Where do you feel them in your body? Name them: "I notice sadness" or "There is anxiety."',
      },
      {
        title: 'Observe Sensations',
        instruction: 'Scan your body from head to feet. Notice tension, warmth, tingling, heaviness. Just observe without changing anything.',
      },
      {
        title: 'Describe',
        instruction: 'Put your observations into words: "I am noticing tightness in my chest and thoughts about tomorrow. There is some worry present."',
      },
    ],
    quickSteps: [
      { title: 'Notice', instruction: 'What am I feeling right now? Name it.' },
      { title: 'Where', instruction: 'Where do I feel it in my body?' },
      { title: 'Describe', instruction: 'Say it simply: "I notice [emotion] in my [body part]."' },
    ],
    whenToUse: [
      'Daily mindfulness practice',
      'Feeling emotionally activated',
      'Before journaling',
      'When you want to understand what you are feeling',
    ],
    tags: ['core-skill', 'awareness', 'daily-practice', 'grounding'],
    situationalTags: ['confused', 'overwhelmed', 'daily'],
  },
  {
    id: 'mf-one-mindfully',
    moduleId: 'mindfulness',
    title: 'One-Mindfully',
    subtitle: 'Do one thing at a time with full attention',
    description: 'Focus entirely on one activity. When your mind wanders, gently bring it back. This practice builds concentration and reduces anxiety.',
    duration: '10 min',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Choose One Activity',
        instruction: 'Pick something simple: washing dishes, drinking tea, walking, eating. Commit to doing only this one thing.',
      },
      {
        title: 'Engage All Senses',
        instruction: 'Notice every sensory detail of this activity. The warmth, the texture, the sounds, the smells. Be fully here.',
        tip: 'When we engage our senses fully, anxious thoughts naturally quiet down.',
      },
      {
        title: 'Notice When Mind Wanders',
        instruction: 'Your mind will wander — this is completely normal. Gently notice: "My mind wandered." No judgment. Just return.',
      },
      {
        title: 'Return Again and Again',
        instruction: 'Each time you notice and return, that is a rep of mindfulness. You are building a mental muscle. Every return counts.',
      },
    ],
    quickSteps: [
      { title: 'Pick one thing', instruction: 'Choose one simple activity to focus on right now.' },
      { title: 'Full attention', instruction: 'Notice every detail with all your senses.' },
      { title: 'Return', instruction: 'When your mind wanders, gently come back. No judgment.' },
    ],
    whenToUse: [
      'Feeling scattered or overwhelmed',
      'Racing thoughts',
      'Difficulty being present',
      'Wanting to build daily mindfulness',
    ],
    tags: ['daily-practice', 'focus', 'presence', 'simple'],
    situationalTags: ['overwhelmed', 'scattered', 'daily'],
  },
  {
    id: 'mf-non-judgmental',
    moduleId: 'mindfulness',
    title: 'Non-Judgmental Stance',
    subtitle: 'Let go of good/bad labels and just observe',
    description: 'Practice seeing things as they are without labeling them good or bad. Judgment adds suffering. Observation brings clarity.',
    duration: '5 min',
    difficulty: 'advanced',
    steps: [
      {
        title: 'Notice a Judgment',
        instruction: 'Catch yourself making a judgment: "This is terrible" or "I am awful" or "They are wrong." Just notice it.',
      },
      {
        title: 'Replace with Description',
        instruction: 'Change the judgment to a factual description. Instead of "I am a mess," try "I am feeling several strong emotions right now."',
        tip: 'Descriptions are neutral. Judgments add emotional charge. Choose descriptions.',
      },
      {
        title: 'Notice Self-Judgment',
        instruction: 'Pay special attention to judgments about yourself. "I should be over this" becomes "I am still healing, and that is where I am."',
      },
      {
        title: 'Practice with Emotions',
        instruction: 'Instead of "This anger is bad," try "Anger is present." Emotions are information, not moral statements.',
      },
      {
        title: 'Extend to Others',
        instruction: 'Apply the same non-judgment to others. "They are being difficult" becomes "They are behaving in a way I find challenging."',
      },
    ],
    quickSteps: [
      { title: 'Catch', instruction: 'Notice one judgment you are making right now.' },
      { title: 'Restate', instruction: 'Replace it with a neutral description of facts.' },
      { title: 'Release', instruction: 'Let go of the label. Just observe what is.' },
    ],
    whenToUse: [
      'Caught in self-criticism',
      'Judging others harshly',
      'Labeling emotions as good or bad',
      'Wanting to reduce suffering',
    ],
    tags: ['advanced', 'self-compassion', 'perspective', 'acceptance'],
    situationalTags: ['shame', 'self-criticism', 'judgment'],
  },
  {
    id: 'mf-participate',
    moduleId: 'mindfulness',
    title: 'Participate',
    subtitle: 'Throw yourself fully into the present moment',
    description: 'Enter fully into the current activity or experience. Let go of self-consciousness and become one with what you are doing.',
    duration: '5 min',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Let Go of Self-Consciousness',
        instruction: 'Stop observing yourself from outside. Drop the inner critic. Just be in this moment fully.',
      },
      {
        title: 'Engage Completely',
        instruction: 'Whatever you are doing — a conversation, a walk, a task — give it your full participation. Be here, not watching yourself be here.',
        tip: 'Participating means acting intuitively rather than overthinking every move.',
      },
      {
        title: 'Follow the Flow',
        instruction: 'Let the moment guide you. If you are talking, let words come naturally. If you are moving, let your body lead.',
      },
      {
        title: 'Notice the Shift',
        instruction: 'When you participate fully, anxiety often drops. You move from watching life to living it.',
      },
    ],
    quickSteps: [
      { title: 'Drop the observer', instruction: 'Stop watching yourself. Just be.' },
      { title: 'Engage', instruction: 'Throw yourself into what you are doing right now.' },
    ],
    whenToUse: [
      'Feeling detached or dissociated',
      'Overthinking social situations',
      'Difficulty enjoying activities',
      'Feeling numb or disconnected',
    ],
    tags: ['presence', 'engagement', 'flow', 'connection'],
    situationalTags: ['numb', 'detached', 'social-anxiety'],
  },
  {
    id: 'mf-effectiveness',
    moduleId: 'mindfulness',
    title: 'Effectiveness',
    subtitle: 'Focus on what works, not what is right',
    description: 'Do what is effective in the situation rather than what feels righteous. Let go of being right and focus on what achieves your goal.',
    duration: '5 min',
    difficulty: 'intermediate',
    steps: [
      {
        title: 'Identify Your Goal',
        instruction: 'What do you actually want to happen here? Not what would feel satisfying in the moment — what is your real goal?',
      },
      {
        title: 'Let Go of Being Right',
        instruction: 'Sometimes being right gets in the way of being effective. What would work better than proving your point?',
        tip: 'Ask yourself: Do I want to be right, or do I want things to get better?',
      },
      {
        title: 'Choose the Effective Path',
        instruction: 'What action moves you closest to your goal? Even if it means swallowing pride, compromising, or taking a step back.',
      },
      {
        title: 'Act on What Works',
        instruction: 'Take the effective action. You can always revisit fairness later — but right now, do what works.',
      },
    ],
    quickSteps: [
      { title: 'Goal', instruction: 'What do I actually want here?' },
      { title: 'Effective', instruction: 'What action gets me closest to that goal?' },
      { title: 'Act', instruction: 'Do what works, not what feels right.' },
    ],
    whenToUse: [
      'Arguments that go in circles',
      'Wanting to prove a point at high cost',
      'Stuck between pride and resolution',
      'Needing to make a practical decision',
    ],
    tags: ['pragmatic', 'goals', 'conflict', 'decision-making'],
    situationalTags: ['conflict', 'stuck', 'anger'],
  },
  {
    id: 'mf-beginner-mind',
    moduleId: 'mindfulness',
    title: "Beginner's Mind",
    subtitle: 'See things as if for the first time',
    description: 'Approach situations, people, and emotions with fresh curiosity instead of old assumptions. Let go of "I already know how this goes."',
    duration: '5 min',
    difficulty: 'intermediate',
    steps: [
      {
        title: 'Notice Assumptions',
        instruction: 'What are you assuming about this situation or person? "They always do this." "It never works." Notice those stories.',
      },
      {
        title: 'Set Assumptions Aside',
        instruction: 'Gently set those stories down. Pretend this is the first time you are experiencing this situation.',
        tip: 'Assumptions based on the past can blind us to what is actually happening now.',
      },
      {
        title: 'Look with Curiosity',
        instruction: 'Ask: What might I be missing? What is actually happening right now, not what I expect to happen?',
      },
      {
        title: 'Stay Open',
        instruction: 'Let this moment surprise you. People can change. Situations can differ. Stay open to what you find.',
      },
    ],
    quickSteps: [
      { title: 'Assumption', instruction: 'What am I assuming right now?' },
      { title: 'Fresh eyes', instruction: 'What if I saw this for the first time?' },
      { title: 'Curiosity', instruction: 'What might I be missing?' },
    ],
    whenToUse: [
      'Repeating relationship patterns',
      'Feeling stuck in how you see someone',
      'Assuming the worst',
      'Wanting to break old cycles',
    ],
    tags: ['curiosity', 'openness', 'patterns', 'relationships'],
    situationalTags: ['stuck', 'assumptions', 'relationships'],
  },

  // ═══════════════════════════════════════════
  // DISTRESS TOLERANCE
  // ═══════════════════════════════════════════
  {
    id: 'dt-tip',
    moduleId: 'distress-tolerance',
    title: 'TIP Skills',
    subtitle: 'Temperature, Intense exercise, Paced breathing, Paired muscle relaxation',
    description: 'Quickly change your body chemistry to reduce extreme emotional arousal. These physiological techniques work fast when emotions are overwhelming.',
    duration: '5 min',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Temperature',
        instruction: 'Hold ice cubes in your hands, splash cold water on your face, or place a cold pack on the back of your neck for 30 seconds.',
        tip: 'The dive reflex activates when cold water hits your face, rapidly calming your nervous system.',
      },
      {
        title: 'Intense Exercise',
        instruction: 'Do 20 jumping jacks, run in place, or do wall push-ups for 60 seconds. Move your body intensely.',
        tip: 'Physical exertion releases pent-up emotional energy and shifts your body state.',
      },
      {
        title: 'Paced Breathing',
        instruction: 'Breathe in for 4 counts, hold for 4, breathe out for 6 counts. Repeat 5 times.',
        tip: 'Making your exhale longer than your inhale activates the parasympathetic nervous system.',
      },
      {
        title: 'Paired Muscle Relaxation',
        instruction: 'Tense your fists tightly for 5 seconds while breathing in. Release completely while breathing out. Work through shoulders, arms, legs.',
      },
    ],
    quickSteps: [
      { letter: 'T', title: 'Temperature', instruction: 'Splash cold water on your face or hold ice for 30 seconds.' },
      { letter: 'I', title: 'Intense exercise', instruction: '20 jumping jacks or run in place for 60 seconds.' },
      { letter: 'P', title: 'Paced breathing', instruction: 'In for 4, hold 4, out for 6. Repeat 5 times.' },
    ],
    whenToUse: [
      'Emotional intensity above 7/10',
      'Before sending a reactive message',
      'When you feel like you might act on an urge',
      'Panic or anxiety attacks',
    ],
    tags: ['crisis', 'quick', 'body-based', 'high-distress'],
    situationalTags: ['crisis', 'panic', 'high-distress', 'overwhelmed'],
  },
  {
    id: 'dt-stop',
    moduleId: 'distress-tolerance',
    title: 'STOP Skill',
    subtitle: 'Stop, Take a step back, Observe, Proceed mindfully',
    description: 'A quick intervention to prevent impulsive reactions during emotional moments. Creates space between trigger and response.',
    duration: '2 min',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Stop',
        instruction: 'Freeze. Do not move. Do not react. Do not send that message. Just stop everything for a moment.',
        tip: 'Physically freezing breaks the momentum of an emotional reaction.',
      },
      {
        title: 'Take a Step Back',
        instruction: 'Take a deep breath. Mentally step away from the situation. Imagine watching it from across the room.',
      },
      {
        title: 'Observe',
        instruction: 'Notice what is happening inside you. What emotions are present? What urges? What thoughts? Name them without judgment.',
        tip: 'Naming emotions reduces their intensity — this is called "affect labeling."',
      },
      {
        title: 'Proceed Mindfully',
        instruction: 'Ask yourself: What action will be effective right now? What aligns with my values and goals? Choose that path.',
      },
    ],
    quickSteps: [
      { letter: 'S', title: 'Stop', instruction: 'Freeze. Do not react.' },
      { letter: 'T', title: 'Take a step back', instruction: 'One deep breath. Step away mentally.' },
      { letter: 'O', title: 'Observe', instruction: 'What am I feeling? Name it.' },
      { letter: 'P', title: 'Proceed mindfully', instruction: 'What is the wise action here?' },
    ],
    whenToUse: [
      'Before reacting to a triggering message',
      'During an argument',
      'When you feel an impulsive urge',
      'Moments of sudden anger or hurt',
    ],
    tags: ['crisis', 'quick', 'impulse-control', 'communication'],
    situationalTags: ['before-texting', 'impulse', 'anger', 'conflict'],
  },
  {
    id: 'dt-self-soothe',
    moduleId: 'distress-tolerance',
    title: 'Self-Soothing with Senses',
    subtitle: 'Comfort yourself through your five senses',
    description: 'Use your senses to create a calming experience. This skill helps ground you in the present and provides comfort during emotional pain.',
    duration: '10 min',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Vision',
        instruction: 'Look at something beautiful. A photo that makes you smile, nature outside a window, a candle flame, or calming artwork.',
        tip: 'Soft, warm lighting and natural scenes are especially soothing for the nervous system.',
      },
      {
        title: 'Hearing',
        instruction: 'Listen to calming music, nature sounds, rain, or a voice that feels safe. Let the sound wash over you.',
      },
      {
        title: 'Smell',
        instruction: 'Use a favorite scent — lavender, vanilla, coffee, fresh air. Breathe it in slowly and deeply.',
      },
      {
        title: 'Taste',
        instruction: 'Have something comforting — warm tea, chocolate, mint. Focus entirely on the taste and texture.',
      },
      {
        title: 'Touch',
        instruction: 'Wrap yourself in something soft. Hold a warm mug. Pet an animal. Feel the texture consciously.',
        tip: 'Gentle self-touch like placing a hand on your heart activates the same caregiving system as being comforted by someone else.',
      },
    ],
    quickSteps: [
      { title: 'Pick one sense', instruction: 'Choose sight, sound, smell, taste, or touch.' },
      { title: 'Focus fully', instruction: 'Give that one sense all your attention for 60 seconds.' },
      { title: 'Breathe', instruction: 'Let the comfort settle into your body.' },
    ],
    whenToUse: [
      'Feeling emotionally drained',
      'After a difficult interaction',
      'Loneliness or emptiness',
      'Before sleep on a hard day',
    ],
    tags: ['self-care', 'grounding', 'comfort', 'low-energy'],
    situationalTags: ['lonely', 'drained', 'sad', 'comfort'],
  },
  {
    id: 'dt-pros-cons',
    moduleId: 'distress-tolerance',
    title: 'Pros and Cons',
    subtitle: 'Think through consequences before acting',
    description: 'Examine the advantages and disadvantages of acting on an urge versus resisting it. Helps engage your rational mind during emotional moments.',
    duration: '5 min',
    difficulty: 'intermediate',
    steps: [
      {
        title: 'Name the Urge',
        instruction: 'Clearly state what you feel like doing right now. Be specific: "I want to send an angry text" or "I want to isolate."',
      },
      {
        title: 'Pros of Acting on the Urge',
        instruction: 'What would feel good about giving in? Be honest — there are always short-term benefits.',
        tip: 'Acknowledging the appeal of the urge is not the same as acting on it.',
      },
      {
        title: 'Cons of Acting on the Urge',
        instruction: 'What are the consequences? Tomorrow, next week, for the relationship? How will you feel afterward?',
      },
      {
        title: 'Pros of Resisting',
        instruction: 'What do you gain by not acting on this urge? Self-respect? A preserved relationship? Staying safe?',
      },
      {
        title: 'Cons of Resisting',
        instruction: 'What is hard about not giving in? Acknowledge the discomfort. It is real and valid.',
      },
      {
        title: 'Choose Wisely',
        instruction: 'Looking at the full picture, which choice aligns with the person you want to be?',
      },
    ],
    quickSteps: [
      { title: 'Urge', instruction: 'What do I want to do right now?' },
      { title: 'Cost', instruction: 'What will this cost me tomorrow?' },
      { title: 'Choose', instruction: 'Which choice protects what matters most?' },
    ],
    whenToUse: [
      'Strong urge to send an impulsive message',
      'Urge to engage in self-destructive behavior',
      'Wanting to end a relationship in anger',
      'Any major decision during emotional intensity',
    ],
    tags: ['decision-making', 'impulse-control', 'cognitive'],
    situationalTags: ['impulse', 'before-texting', 'urge'],
  },
  {
    id: 'dt-radical-acceptance',
    moduleId: 'distress-tolerance',
    title: 'Radical Acceptance',
    subtitle: 'Accepting reality as it is, not as you want it to be',
    description: 'Letting go of fighting reality reduces suffering. Pain is unavoidable; suffering from refusing to accept pain is optional.',
    duration: '10 min',
    difficulty: 'advanced',
    steps: [
      {
        title: 'Acknowledge the Reality',
        instruction: 'State the facts of the situation without adding interpretations or judgments. What actually happened?',
        tip: 'Acceptance does not mean approval. It means acknowledging what is true.',
      },
      {
        title: 'Notice Your Resistance',
        instruction: 'Where in your body do you feel resistance? What thoughts are protesting? "This shouldn\'t be happening" or "It\'s not fair."',
      },
      {
        title: 'Turn Your Mind',
        instruction: 'Make a conscious choice to accept. You may need to do this repeatedly — acceptance is not a one-time act.',
      },
      {
        title: 'Practice Half-Smile',
        instruction: 'Slightly turn up the corners of your mouth. Relax your face. This subtle shift signals your brain toward acceptance.',
        tip: 'Research shows facial expressions can influence emotional states.',
      },
      {
        title: 'Willing Hands',
        instruction: 'Open your palms, rest them on your lap or by your sides. Unclench. Let your body express willingness.',
      },
    ],
    quickSteps: [
      { title: 'Facts', instruction: 'What is actually true right now?' },
      { title: 'Accept', instruction: 'Acceptance is not approval. It is seeing what is.' },
      { title: 'Open', instruction: 'Open your hands. Relax your face. Let go.' },
    ],
    whenToUse: [
      'Painful situations you cannot change',
      'Rejection or abandonment',
      'Loss or grief',
      'When fighting reality is causing more suffering',
    ],
    tags: ['acceptance', 'deep-work', 'suffering', 'advanced'],
    situationalTags: ['rejection', 'grief', 'loss', 'stuck'],
  },
  {
    id: 'dt-urge-surfing',
    moduleId: 'distress-tolerance',
    title: 'Urge Surfing',
    subtitle: 'Ride the urge like a wave without acting on it',
    description: 'Urges are temporary. Like waves, they rise, peak, and fall. You can learn to ride them out rather than giving in.',
    duration: '5 min',
    difficulty: 'intermediate',
    steps: [
      {
        title: 'Notice the Urge',
        instruction: 'Acknowledge the urge is present. Name it: "I have an urge to text them" or "I want to shut down."',
      },
      {
        title: 'Rate Its Intensity',
        instruction: 'On a scale of 1–10, how strong is this urge? Just notice — do not judge it.',
        tip: 'Most urges peak within 15–20 minutes. You only need to ride it for that long.',
      },
      {
        title: 'Feel It in Your Body',
        instruction: 'Where is the urge living? Chest tightness? Restless hands? Stomach churning? Just observe the physical sensation.',
      },
      {
        title: 'Watch the Wave',
        instruction: 'Imagine the urge as a wave in the ocean. It is building. It will crest. Then it will fall. You are watching it from shore.',
      },
      {
        title: 'Ride It Out',
        instruction: 'Breathe. Stay still. The urge is cresting now. Keep breathing. Notice — is it already losing some intensity?',
      },
      {
        title: 'Notice the Change',
        instruction: 'After a few minutes, check in. The wave is falling. You survived it without acting. That is strength.',
      },
    ],
    quickSteps: [
      { title: 'Name it', instruction: 'I have an urge to [what]. It is a [1-10].' },
      { title: 'Ride it', instruction: 'Breathe. This wave will crest and fall.' },
      { title: 'Wait', instruction: 'Give it 5 minutes. The urge will weaken.' },
    ],
    whenToUse: [
      'Urge to send an impulsive message',
      'Urge to engage in harmful behavior',
      'Craving for emotional relief',
      'Feeling like you must act NOW',
    ],
    tags: ['urge', 'impulse-control', 'patience', 'body-based'],
    situationalTags: ['impulse', 'craving', 'before-texting'],
  },
  {
    id: 'dt-improve',
    moduleId: 'distress-tolerance',
    title: 'IMPROVE the Moment',
    subtitle: 'Make a painful moment more bearable',
    description: 'When you cannot change the situation, you can change how you experience this moment. IMPROVE offers seven ways to make distress more tolerable.',
    duration: '7 min',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Imagery',
        instruction: 'Imagine a safe, peaceful place. A beach, a forest, a cozy room. Fill in every detail — sounds, smells, warmth.',
        tip: 'Your brain responds to vivid imagery almost as strongly as to real experiences.',
      },
      {
        title: 'Meaning',
        instruction: 'Find purpose in what you are going through. "This pain is teaching me something." "I am growing through this."',
      },
      {
        title: 'Prayer or Meditation',
        instruction: 'If it fits for you, pray, meditate, or simply connect to something larger than this moment.',
      },
      {
        title: 'Relaxation',
        instruction: 'Relax your muscles progressively. Drop your shoulders. Unclench your jaw. Relax your hands.',
      },
      {
        title: 'One Thing in the Moment',
        instruction: 'Focus entirely on one small thing happening right now. The feel of fabric. The sound of your breath.',
      },
      {
        title: 'Vacation (Brief)',
        instruction: 'Take a mental vacation. Five minutes of something pleasant — a song, a walk, a funny video. Then come back.',
      },
      {
        title: 'Encouragement',
        instruction: 'Talk to yourself like a supportive friend: "I can get through this. This feeling will pass. I have survived hard things before."',
      },
    ],
    quickSteps: [
      { letter: 'I', title: 'Imagine', instruction: 'Picture your safe, peaceful place for 30 seconds.' },
      { letter: 'R', title: 'Relax', instruction: 'Drop shoulders. Unclench jaw. Open hands.' },
      { letter: 'E', title: 'Encourage', instruction: '"I can handle this. This will pass."' },
    ],
    whenToUse: [
      'Stuck in a painful situation you cannot leave',
      'Waiting for intense emotions to pass',
      'Need something to help you get through the next hour',
      'Moderate distress that needs soothing',
    ],
    tags: ['coping', 'soothing', 'versatile', 'moderate-distress'],
    situationalTags: ['stuck', 'waiting', 'moderate-distress'],
  },
  {
    id: 'dt-ten-minute-pause',
    moduleId: 'distress-tolerance',
    title: '10-Minute Pause',
    subtitle: 'Create space between trigger and response',
    description: 'Before acting on any intense emotional urge, commit to waiting 10 minutes. Most emotional peaks pass within this window.',
    duration: '10 min',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Commit to 10 Minutes',
        instruction: 'Tell yourself: "I will not act on this urge for the next 10 minutes. That is all I need to do right now."',
      },
      {
        title: 'Put Down the Phone',
        instruction: 'If the urge involves messaging or calling, put your phone in another room or turn it face down.',
        tip: 'Physical distance from the trigger reduces the pull of the urge significantly.',
      },
      {
        title: 'Move Your Body',
        instruction: 'Walk to a different room. Step outside. Splash water on your face. Physically changing your environment helps.',
      },
      {
        title: 'Breathe and Wait',
        instruction: 'Set a timer for 10 minutes. Breathe slowly. You do not need to solve anything right now — just wait.',
      },
      {
        title: 'Reassess',
        instruction: 'When the timer goes off, check in. Is the urge still as strong? Do you still want to do the same thing?',
      },
    ],
    quickSteps: [
      { title: 'Commit', instruction: 'Just 10 minutes. That is all.' },
      { title: 'Distance', instruction: 'Put the phone down. Move to a different space.' },
      { title: 'Breathe', instruction: 'Wait. Breathe. Reassess after 10 minutes.' },
    ],
    whenToUse: [
      'Urge to send a reactive message',
      'Wanting to make a rash decision',
      'Feeling like you cannot wait',
      'Before any action you might regret',
    ],
    tags: ['pause', 'quick', 'impulse-control', 'simple'],
    situationalTags: ['before-texting', 'impulse', 'rash-decision'],
  },
  {
    id: 'dt-temperature-reset',
    moduleId: 'distress-tolerance',
    title: 'Temperature Reset',
    subtitle: 'Use cold to rapidly calm your nervous system',
    description: 'Cold exposure activates the dive reflex, which slows your heart rate and calms your body within seconds. This is one of the fastest ways to reduce emotional intensity.',
    duration: '2 min',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Get Cold Water or Ice',
        instruction: 'Fill a bowl with cold water, get ice cubes, or use a cold pack. The colder, the more effective.',
      },
      {
        title: 'Apply to Face or Neck',
        instruction: 'Submerge your face in cold water for 15–30 seconds, or hold a cold pack to the sides of your face and forehead.',
        tip: 'The area around your eyes and temples triggers the dive reflex most effectively.',
      },
      {
        title: 'Hold Ice',
        instruction: 'If you cannot do the face method, hold ice cubes tightly in your hands for 30–60 seconds. Focus on the cold sensation.',
      },
      {
        title: 'Breathe',
        instruction: 'Take slow breaths while the cold works. Notice your heart rate beginning to slow. Feel the emotional intensity dropping.',
      },
    ],
    quickSteps: [
      { title: 'Cold', instruction: 'Splash cold water on your face or hold ice cubes.' },
      { title: 'Hold', instruction: '30 seconds. Focus on the sensation.' },
      { title: 'Breathe', instruction: 'Feel your nervous system slowing down.' },
    ],
    whenToUse: [
      'Panic attack or extreme anxiety',
      'Rage or intense anger',
      'Emotional flooding',
      'Need the fastest possible calming method',
    ],
    tags: ['crisis', 'quick', 'body-based', 'high-distress', 'fastest'],
    situationalTags: ['panic', 'rage', 'crisis', 'high-distress'],
  },

  // ═══════════════════════════════════════════
  // EMOTION REGULATION
  // ═══════════════════════════════════════════
  {
    id: 'er-opposite-action',
    moduleId: 'emotional-regulation',
    title: 'Opposite Action',
    subtitle: 'Act opposite to your emotional urge',
    description: 'When your emotion does not fit the facts or acting on it is not effective, doing the opposite can change the emotion itself.',
    duration: '5 min',
    difficulty: 'intermediate',
    steps: [
      {
        title: 'Identify the Emotion',
        instruction: 'Name what you are feeling. Be specific: fear, anger, shame, sadness, guilt.',
      },
      {
        title: 'Identify the Urge',
        instruction: 'What does this emotion want you to do? Fear says run. Anger says attack. Shame says hide. Sadness says withdraw.',
        tip: 'Every emotion comes with a built-in action urge. This is biology, not weakness.',
      },
      {
        title: 'Check the Facts',
        instruction: 'Does your emotion fit the facts? Is there a real threat? Or is your brain responding to a perceived threat?',
      },
      {
        title: 'Choose the Opposite',
        instruction: 'If fear says avoid — approach. If anger says attack — be gentle. If shame says hide — share. If sadness says withdraw — get active.',
      },
      {
        title: 'Do It All the Way',
        instruction: 'Half-hearted opposite action does not work. Throw yourself into the opposite behavior completely.',
        tip: 'Your body and emotions will catch up to your actions. Trust the process.',
      },
    ],
    quickSteps: [
      { title: 'Emotion', instruction: 'What am I feeling? What is the urge?' },
      { title: 'Opposite', instruction: 'What is the opposite of that urge?' },
      { title: 'All the way', instruction: 'Do the opposite fully and completely.' },
    ],
    whenToUse: [
      'Emotion does not fit the facts',
      'Acting on the urge would make things worse',
      'Stuck in a shame or avoidance cycle',
      'Want to change a recurring emotional pattern',
    ],
    tags: ['emotion-change', 'behavior', 'active-skill'],
    situationalTags: ['shame', 'avoidance', 'anger', 'fear'],
  },
  {
    id: 'er-check-facts',
    moduleId: 'emotional-regulation',
    title: 'Check the Facts',
    subtitle: 'Separate what happened from your interpretation',
    description: 'Our emotions respond to our interpretations, not just events. Checking the facts can reduce unnecessary emotional suffering.',
    duration: '5 min',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Describe the Event',
        instruction: 'What actually happened? Write it like a news reporter — just facts, no opinions or interpretations.',
      },
      {
        title: 'Name Your Interpretation',
        instruction: 'What story is your mind telling about this event? "They don\'t care about me." "I\'m going to be abandoned."',
        tip: 'Our brains are story-making machines. The story is not necessarily the truth.',
      },
      {
        title: 'Identify the Emotion',
        instruction: 'What emotion did your interpretation create? Notice: different stories create different emotions.',
      },
      {
        title: 'Find Alternative Interpretations',
        instruction: 'List at least 3 other possible reasons this event happened. Be creative and generous.',
      },
      {
        title: 'Choose the Most Balanced View',
        instruction: 'Which interpretation has the most evidence? Which one helps you respond most effectively?',
      },
    ],
    quickSteps: [
      { title: 'Facts', instruction: 'What actually happened? Just the facts.' },
      { title: 'Story', instruction: 'What story is my mind adding?' },
      { title: 'Alternatives', instruction: 'What are 2 other explanations?' },
    ],
    whenToUse: [
      'Mind reading — assuming you know what others think',
      'Catastrophizing — worst case scenario thinking',
      'Relationship conflicts based on assumptions',
      'Emotional reactions that feel disproportionate',
    ],
    tags: ['cognitive', 'relationships', 'anxiety', 'assumptions'],
    situationalTags: ['assumptions', 'rejection', 'before-texting', 'conflict'],
  },
  {
    id: 'er-abc-please',
    moduleId: 'emotional-regulation',
    title: 'ABC PLEASE',
    subtitle: 'Build emotional resilience through daily habits',
    description: 'Reduce vulnerability to negative emotions through accumulating positive experiences, building mastery, and taking care of your body.',
    duration: '15 min',
    difficulty: 'intermediate',
    steps: [
      {
        title: 'Accumulate Positives',
        instruction: 'Do one pleasant thing today. It can be small — a walk, a favorite song, a nice meal. Build positive experiences deliberately.',
      },
      {
        title: 'Build Mastery',
        instruction: 'Do one thing that makes you feel capable and competent. Clean a space, learn something, complete a task you have been avoiding.',
        tip: 'Mastery activities build self-efficacy, which directly buffers against emotional vulnerability.',
      },
      {
        title: 'Cope Ahead',
        instruction: 'Think of a potentially difficult situation coming up. Imagine yourself handling it skillfully. Plan your coping strategy.',
      },
      {
        title: 'Physical Health (PLEASE)',
        instruction: 'Check in: Have you eaten balanced meals? Avoided mood-altering substances? Gotten enough sleep? Done some physical movement?',
      },
    ],
    quickSteps: [
      { letter: 'A', title: 'One positive', instruction: 'Do one small pleasant thing today.' },
      { letter: 'B', title: 'Build mastery', instruction: 'Complete one thing that makes you feel capable.' },
      { letter: 'P', title: 'PLEASE', instruction: 'Eat, sleep, move. Take care of your body.' },
    ],
    whenToUse: [
      'Daily practice for emotional resilience',
      'Feeling emotionally vulnerable',
      'Recovering from a difficult period',
      'Preventing emotional crises',
    ],
    tags: ['prevention', 'daily-practice', 'self-care', 'resilience'],
    situationalTags: ['daily', 'vulnerable', 'prevention'],
  },
  {
    id: 'er-wave',
    moduleId: 'emotional-regulation',
    title: 'Ride the Wave',
    subtitle: 'Let emotions pass without acting on them',
    description: 'Emotions are like waves — they rise, crest, and fall. You do not have to act on every emotion. You can simply observe it pass.',
    duration: '7 min',
    difficulty: 'intermediate',
    steps: [
      {
        title: 'Notice the Emotion Arriving',
        instruction: 'Feel the emotion building. Name it. "Here comes anger." "Sadness is rising." Do not fight it.',
      },
      {
        title: 'Observe Without Judgment',
        instruction: 'Watch the emotion like you would watch a wave from shore. It is not good or bad. It just is.',
        tip: 'Adding judgment to an emotion creates a secondary emotion — suffering on top of pain.',
      },
      {
        title: 'Feel It in Your Body',
        instruction: 'Where is this emotion living in your body right now? Chest tightness? Stomach knots? Heavy limbs? Just notice.',
      },
      {
        title: 'Breathe Through the Peak',
        instruction: 'The wave is cresting. This is the hardest part. Breathe slowly. You do not need to do anything. Just breathe.',
      },
      {
        title: 'Watch It Recede',
        instruction: 'Every wave falls. Notice the emotion starting to soften. It may not disappear completely, but it will lessen.',
      },
    ],
    quickSteps: [
      { title: 'Name', instruction: '"Here comes [emotion]." Do not fight it.' },
      { title: 'Breathe', instruction: 'Breathe through the peak. It will pass.' },
      { title: 'Wait', instruction: 'Every wave falls. Just wait and watch.' },
    ],
    whenToUse: [
      'Intense emotions that do not require action',
      'Urge to react impulsively',
      'Grief or sadness',
      'Anxiety spirals',
    ],
    tags: ['mindfulness', 'acceptance', 'emotions', 'patience'],
    situationalTags: ['grief', 'sadness', 'anxiety', 'overwhelmed'],
  },
  {
    id: 'er-name-emotion',
    moduleId: 'emotional-regulation',
    title: 'Name the Emotion',
    subtitle: 'Identify exactly what you are feeling',
    description: 'Naming emotions precisely reduces their intensity. Moving from "I feel bad" to "I feel abandoned and scared" gives you power over the feeling.',
    duration: '3 min',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Pause and Check In',
        instruction: 'Stop what you are doing. Take one breath. Ask yourself: What am I feeling right now?',
      },
      {
        title: 'Go Beyond "Bad" or "Upset"',
        instruction: 'Get specific. Is it anger, hurt, fear, shame, sadness, loneliness, jealousy, guilt, or something else?',
        tip: 'Research shows that precisely naming an emotion activates the prefrontal cortex, which helps regulate the emotion.',
      },
      {
        title: 'Find the Layers',
        instruction: 'Emotions often come in layers. Anger may cover hurt. Hurt may cover fear. What is underneath the first emotion?',
      },
      {
        title: 'Say It Simply',
        instruction: 'State it: "I feel [emotion] because [trigger]." Just naming it begins to create distance and reduce intensity.',
      },
    ],
    quickSteps: [
      { title: 'Check in', instruction: 'What am I feeling right now? Be specific.' },
      { title: 'Name it', instruction: '"I feel [emotion] because [reason]."' },
    ],
    whenToUse: [
      'Feeling overwhelmed and unsure why',
      'Emotions feel like a blur',
      'Before journaling or talking to someone',
      'Start of any emotional regulation practice',
    ],
    tags: ['foundation', 'awareness', 'quick', 'emotional-literacy'],
    situationalTags: ['confused', 'overwhelmed', 'starting-point'],
  },
  {
    id: 'er-cope-ahead',
    moduleId: 'emotional-regulation',
    title: 'Cope Ahead',
    subtitle: 'Plan for difficult situations before they happen',
    description: 'Mentally rehearse how you will handle a challenging situation. When you have a plan, you are less likely to be overwhelmed in the moment.',
    duration: '10 min',
    difficulty: 'intermediate',
    steps: [
      {
        title: 'Identify the Situation',
        instruction: 'What difficult situation is coming up? A conversation, a social event, a trigger you expect? Describe it clearly.',
      },
      {
        title: 'Identify Likely Emotions',
        instruction: 'What emotions will probably come up? Fear, anger, shame, anxiety? Name them now while you are calm.',
        tip: 'Naming expected emotions in advance reduces their surprise power when they arrive.',
      },
      {
        title: 'Plan Your Skills',
        instruction: 'Which coping skills will you use? STOP? Paced breathing? Check the Facts? Choose 2–3 specific skills.',
      },
      {
        title: 'Rehearse Mentally',
        instruction: 'Close your eyes. Imagine the situation unfolding. Imagine yourself using your planned skills. See yourself handling it effectively.',
      },
      {
        title: 'Plan Your Exit',
        instruction: 'What will you do if things escalate beyond your plan? Have a backup: leave the room, call someone, use a crisis skill.',
      },
    ],
    quickSteps: [
      { title: 'Situation', instruction: 'What is coming up that will be hard?' },
      { title: 'Skills', instruction: 'Which 2 skills will I use when it gets hard?' },
      { title: 'Rehearse', instruction: 'Imagine handling it well. See yourself succeeding.' },
    ],
    whenToUse: [
      'Before a difficult conversation',
      'Before seeing someone who triggers you',
      'Before a stressful event',
      'When you know a hard situation is coming',
    ],
    tags: ['preparation', 'prevention', 'planning', 'cognitive'],
    situationalTags: ['preparation', 'before-event', 'planning'],
  },
  {
    id: 'er-emotional-exposure',
    moduleId: 'emotional-regulation',
    title: 'Emotional Exposure',
    subtitle: 'Gradually face emotions you tend to avoid',
    description: 'Avoiding emotions makes them stronger over time. Gradually exposing yourself to uncomfortable emotions in safe ways reduces their power.',
    duration: '10 min',
    difficulty: 'advanced',
    steps: [
      {
        title: 'Identify the Avoided Emotion',
        instruction: 'What emotion do you tend to avoid or suppress? Sadness? Vulnerability? Anger? Fear of abandonment?',
      },
      {
        title: 'Choose a Safe Level',
        instruction: 'Start small. Do not jump into the deep end. Choose a situation where this emotion might come up at a 3–4 out of 10.',
        tip: 'Gradual exposure is key. Flooding yourself with a 10/10 situation can backfire.',
      },
      {
        title: 'Allow the Emotion',
        instruction: 'When the emotion arrives, let it be there. Do not push it away. Breathe. Notice it. Stay with it.',
      },
      {
        title: 'Notice Survival',
        instruction: 'You are still here. The emotion did not destroy you. Notice that you can feel this and be okay.',
      },
      {
        title: 'Reflect',
        instruction: 'What did you learn? Was the emotion as dangerous as it felt? Each exposure builds emotional tolerance.',
      },
    ],
    quickSteps: [
      { title: 'Name', instruction: 'What emotion am I avoiding?' },
      { title: 'Small step', instruction: 'Let myself feel it at a safe level.' },
      { title: 'Survive', instruction: 'I am still here. I can handle this feeling.' },
    ],
    whenToUse: [
      'Pattern of emotional avoidance',
      'Emotions feel dangerous or overwhelming',
      'Ready to build emotional tolerance',
      'Therapist-guided growth work',
    ],
    tags: ['advanced', 'growth', 'exposure', 'emotional-tolerance'],
    situationalTags: ['avoidance', 'growth', 'therapy'],
  },
  {
    id: 'er-build-positives',
    moduleId: 'emotional-regulation',
    title: 'Build Positive Experiences',
    subtitle: 'Deliberately create moments of joy and meaning',
    description: 'When life feels heavy, positive experiences do not happen by accident. You need to build them intentionally, even in small ways.',
    duration: '5 min',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Short-Term Positives',
        instruction: 'Plan one small pleasant activity for today. A walk, a favorite show, a good meal, calling a friend.',
      },
      {
        title: 'Be Present During It',
        instruction: 'When you do the pleasant activity, be fully there. Do not multitask. Let yourself enjoy it without guilt.',
        tip: 'Guilt about enjoying things while struggling is common in BPD. You deserve pleasant moments.',
      },
      {
        title: 'Long-Term Values',
        instruction: 'What matters to you deeply? Relationships? Creativity? Health? Choose one small step toward a long-term value today.',
      },
      {
        title: 'Notice and Savor',
        instruction: 'Pay attention to positive moments when they happen. Linger on them. Let them sink in for 15–30 seconds.',
      },
    ],
    quickSteps: [
      { title: 'One thing', instruction: 'Plan one small pleasant thing for today.' },
      { title: 'Be there', instruction: 'Be fully present when you do it. No guilt.' },
    ],
    whenToUse: [
      'Persistent low mood',
      'Feeling like nothing good ever happens',
      'Recovery from emotional crisis',
      'Daily wellness practice',
    ],
    tags: ['daily-practice', 'joy', 'values', 'self-care'],
    situationalTags: ['low-mood', 'daily', 'recovery'],
  },

  // ═══════════════════════════════════════════
  // INTERPERSONAL EFFECTIVENESS
  // ═══════════════════════════════════════════
  {
    id: 'ie-dear-man',
    moduleId: 'interpersonal-effectiveness',
    title: 'DEAR MAN',
    subtitle: 'Ask for what you need effectively',
    description: 'A structured approach to making requests and saying no while maintaining your self-respect and the relationship.',
    duration: '10 min',
    difficulty: 'intermediate',
    steps: [
      {
        title: 'Describe',
        instruction: 'Describe the situation using facts. No judgments, no opinions. "When you didn\'t reply for two days..."',
      },
      {
        title: 'Express',
        instruction: 'Express how you feel using "I" statements. "I felt worried and scared."',
        tip: '"I feel..." is more effective than "You made me feel..." because it reduces defensiveness.',
      },
      {
        title: 'Assert',
        instruction: 'Clearly state what you need or want. Be specific and direct. "I would like us to check in once a day."',
      },
      {
        title: 'Reinforce',
        instruction: 'Explain the positive outcome. "If we check in, I think I will feel more secure and we will argue less."',
      },
      {
        title: 'Mindful',
        instruction: 'Stay focused on your goal. Do not get sidetracked by old arguments or other issues.',
      },
      {
        title: 'Appear Confident',
        instruction: 'Use a calm, steady voice. Make eye contact. Stand or sit upright. Even if you feel unsure inside.',
        tip: 'Confident body language actually changes how you feel, not just how others perceive you.',
      },
      {
        title: 'Negotiate',
        instruction: 'Be willing to give to get. Ask "What would work for you?" Find a middle ground.',
      },
    ],
    quickSteps: [
      { letter: 'D', title: 'Describe', instruction: 'State the facts of what happened.' },
      { letter: 'E', title: 'Express', instruction: '"I feel [emotion] when [situation]."' },
      { letter: 'A', title: 'Assert', instruction: '"I need [specific request]."' },
      { letter: 'R', title: 'Reinforce', instruction: 'Explain the benefit for both of you.' },
    ],
    whenToUse: [
      'Asking for something you need in a relationship',
      'Setting a boundary',
      'Having a difficult conversation',
      'Requesting changes in behavior',
    ],
    tags: ['communication', 'relationships', 'boundaries', 'assertiveness'],
    situationalTags: ['conflict', 'boundaries', 'relationships', 'before-texting'],
  },
  {
    id: 'ie-give',
    moduleId: 'interpersonal-effectiveness',
    title: 'GIVE Skill',
    subtitle: 'Keep the relationship while getting what you need',
    description: 'Balance getting your needs met with maintaining the relationship. These skills help you communicate without damaging the connection.',
    duration: '5 min',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Gentle',
        instruction: 'Be gentle in your approach. No attacks, no threats, no judging. Speak softly even when the topic is hard.',
        tip: 'A gentle approach makes the other person more likely to hear you.',
      },
      {
        title: 'Interested',
        instruction: 'Show genuine interest in the other person\'s perspective. Listen actively. Ask questions. Do not interrupt.',
      },
      {
        title: 'Validate',
        instruction: 'Acknowledge the other person\'s feelings and point of view, even if you disagree. "I can see why you feel that way."',
      },
      {
        title: 'Easy Manner',
        instruction: 'Use humor when appropriate. Be light. Smile. Make the conversation feel safe, not like a confrontation.',
      },
    ],
    quickSteps: [
      { letter: 'G', title: 'Gentle', instruction: 'No attacks. Soft tone, even on hard topics.' },
      { letter: 'I', title: 'Interested', instruction: 'Listen. Ask. Do not interrupt.' },
      { letter: 'V', title: 'Validate', instruction: '"I can see why you feel that way."' },
      { letter: 'E', title: 'Easy manner', instruction: 'Keep it safe and light.' },
    ],
    whenToUse: [
      'Conversations where the relationship matters',
      'De-escalating conflicts',
      'Expressing disagreement without damaging trust',
      'Reconnecting after a rupture',
    ],
    tags: ['communication', 'relationships', 'gentle', 'connection'],
    situationalTags: ['conflict', 'repair', 'relationships'],
  },
  {
    id: 'ie-fast',
    moduleId: 'interpersonal-effectiveness',
    title: 'FAST Skill',
    subtitle: 'Maintain self-respect in interactions',
    description: 'Keep your self-respect while interacting with others. These skills help you stay true to your values in relationships.',
    duration: '5 min',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Fair',
        instruction: 'Be fair to both yourself and the other person. Do not sacrifice your needs entirely, and do not dismiss theirs.',
      },
      {
        title: 'Apologies (No Unnecessary)',
        instruction: 'Do not over-apologize. Do not apologize for having needs, feelings, or opinions. Apologize only when genuinely warranted.',
        tip: 'Over-apologizing can signal that your needs are not valid — they are.',
      },
      {
        title: 'Stick to Values',
        instruction: 'Do not sell out your values to please someone or avoid conflict. Know what matters to you and hold that ground.',
      },
      {
        title: 'Truthful',
        instruction: 'Be honest. Do not exaggerate, minimize, or make excuses. Speak your truth clearly and directly.',
      },
    ],
    quickSteps: [
      { letter: 'F', title: 'Fair', instruction: 'Be fair to yourself and them.' },
      { letter: 'A', title: 'No unnecessary apologies', instruction: 'Do not apologize for having needs.' },
      { letter: 'S', title: 'Stick to values', instruction: 'Hold your ground on what matters.' },
      { letter: 'T', title: 'Truthful', instruction: 'Be honest and direct.' },
    ],
    whenToUse: [
      'When you tend to people-please',
      'Feeling pressured to compromise your values',
      'After over-apologizing',
      'Rebuilding self-respect in relationships',
    ],
    tags: ['self-respect', 'values', 'boundaries', 'honesty'],
    situationalTags: ['people-pleasing', 'shame', 'boundaries'],
  },
  {
    id: 'ie-validation',
    moduleId: 'interpersonal-effectiveness',
    title: 'Validation Skills',
    subtitle: 'Validate yourself and others effectively',
    description: 'Validation is one of the most powerful tools for connection and self-compassion. Learn to validate feelings without necessarily agreeing with behaviors.',
    duration: '7 min',
    difficulty: 'intermediate',
    steps: [
      {
        title: 'Pay Attention',
        instruction: 'Give the person (or yourself) your full attention. Put down the phone. Look at them. Be fully present.',
      },
      {
        title: 'Reflect Back',
        instruction: 'Repeat what you heard in your own words. "So what you are saying is..." This shows you are listening.',
        tip: 'Feeling heard is one of the most fundamental human needs.',
      },
      {
        title: 'Read Between the Lines',
        instruction: 'Name the unspoken emotion. "It sounds like that really hurt you" or "I imagine that felt lonely."',
      },
      {
        title: 'Validate Based on History',
        instruction: 'Connect the reaction to past experiences. "Given what you have been through, it makes sense you would feel this way."',
      },
      {
        title: 'Radical Genuineness',
        instruction: 'Be real. Be human. Share your own vulnerability when appropriate. Genuine connection heals.',
      },
    ],
    quickSteps: [
      { title: 'Listen', instruction: 'Give your full attention.' },
      { title: 'Reflect', instruction: '"What I hear you saying is..."' },
      { title: 'Validate', instruction: '"It makes sense you feel that way."' },
    ],
    whenToUse: [
      'Supporting someone in distress',
      'Validating your own emotions',
      'After an argument or rupture',
      'When someone feels unheard',
    ],
    tags: ['validation', 'empathy', 'connection', 'communication'],
    situationalTags: ['repair', 'conflict', 'connection'],
  },
  {
    id: 'ie-boundary-clarity',
    moduleId: 'interpersonal-effectiveness',
    title: 'Boundary Clarity',
    subtitle: 'Set and maintain clear personal boundaries',
    description: 'Boundaries protect your emotional wellbeing. Setting them clearly and calmly is a skill that gets easier with practice.',
    duration: '7 min',
    difficulty: 'intermediate',
    steps: [
      {
        title: 'Identify Your Boundary',
        instruction: 'What behavior from others crosses a line for you? What do you need to protect? Be specific.',
      },
      {
        title: 'Check if It Is Reasonable',
        instruction: 'Is this boundary about protecting yourself or controlling someone else? Healthy boundaries protect — they do not punish.',
        tip: 'A boundary is something you enforce about your own behavior, not a rule you impose on someone else.',
      },
      {
        title: 'State It Clearly',
        instruction: 'Use clear, calm language: "I need [specific thing]" or "I am not comfortable with [specific behavior]."',
      },
      {
        title: 'Prepare for Pushback',
        instruction: 'They may not like your boundary. That is okay. You can validate their feelings while still maintaining it.',
      },
      {
        title: 'Follow Through',
        instruction: 'A boundary you do not enforce becomes a suggestion. Decide in advance what you will do if the boundary is crossed.',
      },
    ],
    quickSteps: [
      { title: 'Identify', instruction: 'What do I need to protect here?' },
      { title: 'State', instruction: '"I need [X]" or "I am not okay with [Y]."' },
      { title: 'Hold', instruction: 'Maintain the boundary even if they push back.' },
    ],
    whenToUse: [
      'Feeling taken advantage of',
      'Relationship patterns where your needs are ignored',
      'After realizing you have been over-giving',
      'When someone repeatedly crosses a line',
    ],
    tags: ['boundaries', 'assertiveness', 'self-respect', 'relationships'],
    situationalTags: ['boundaries', 'relationships', 'self-respect'],
  },
  {
    id: 'ie-repair-after-conflict',
    moduleId: 'interpersonal-effectiveness',
    title: 'Repair After Conflict',
    subtitle: 'Rebuild connection after things went wrong',
    description: 'Ruptures in relationships are normal. What matters is the repair. This skill helps you reconnect without over-apologizing or abandoning yourself.',
    duration: '10 min',
    difficulty: 'advanced',
    steps: [
      {
        title: 'Wait Until Calm',
        instruction: 'Do not try to repair while still emotionally activated. Wait until your distress is below a 5/10.',
        tip: 'Repair attempts during high emotion often become new conflicts.',
      },
      {
        title: 'Own Your Part',
        instruction: 'What was your contribution to the conflict? Acknowledge it honestly without minimizing or exaggerating.',
      },
      {
        title: 'Validate Their Experience',
        instruction: 'Before explaining your side, acknowledge how they felt. "I can see that hurt you" or "I understand why you were upset."',
      },
      {
        title: 'Express What You Need',
        instruction: 'After validating, share your experience. Use "I" statements. Be honest about what you need going forward.',
      },
      {
        title: 'Agree on a Path Forward',
        instruction: 'What will you both do differently next time? Make it specific and concrete, not just "we will try harder."',
      },
    ],
    quickSteps: [
      { title: 'Calm first', instruction: 'Wait until distress is below 5/10.' },
      { title: 'Own it', instruction: 'Acknowledge your part honestly.' },
      { title: 'Validate', instruction: '"I can see that hurt you."' },
    ],
    whenToUse: [
      'After an argument or fight',
      'When you said something hurtful',
      'When there is tension in a relationship',
      'After a period of withdrawal or silence',
    ],
    tags: ['repair', 'conflict-resolution', 'relationships', 'advanced'],
    situationalTags: ['after-conflict', 'repair', 'relationships'],
  },
  {
    id: 'ie-ask-reassurance',
    moduleId: 'interpersonal-effectiveness',
    title: 'Ask for Reassurance Clearly',
    subtitle: 'Express your need without pushing people away',
    description: 'Needing reassurance is human. The key is asking in a way that invites support rather than testing or pushing the other person.',
    duration: '5 min',
    difficulty: 'intermediate',
    steps: [
      {
        title: 'Name What You Need',
        instruction: 'Be honest with yourself first: What specific reassurance do you need? "I need to know you still care" is more helpful than testing someone.',
      },
      {
        title: 'Check the Context',
        instruction: 'Is this a reasonable ask right now? Are they in a position to give it? Timing matters.',
        tip: 'Asking for reassurance is healthy. Testing someone to prove they care is not the same thing.',
      },
      {
        title: 'Ask Directly',
        instruction: 'Say it clearly: "I am feeling insecure right now. Could you tell me [specific reassurance]?" or "I need to hear that we are okay."',
      },
      {
        title: 'Receive It',
        instruction: 'If they give reassurance, let it in. Do not dismiss it, argue with it, or ask for more immediately. Let it land.',
      },
    ],
    quickSteps: [
      { title: 'Name', instruction: 'What reassurance do I actually need?' },
      { title: 'Ask', instruction: '"I need to hear [specific thing]."' },
      { title: 'Receive', instruction: 'Let their response land. Do not dismiss it.' },
    ],
    whenToUse: [
      'Feeling insecure in a relationship',
      'After a period of silence or distance',
      'When anxiety is telling you they do not care',
      'Instead of testing or withdrawing',
    ],
    tags: ['communication', 'vulnerability', 'relationships', 'reassurance'],
    situationalTags: ['insecure', 'anxious', 'relationships', 'lonely'],
  },
  {
    id: 'ie-validate-before-respond',
    moduleId: 'interpersonal-effectiveness',
    title: 'Validate Before Responding',
    subtitle: 'Acknowledge first, then express your view',
    description: 'Most conflicts escalate because people feel unheard. Validating the other person before sharing your perspective dramatically changes the conversation.',
    duration: '5 min',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Listen Fully First',
        instruction: 'Before responding, make sure you have actually heard what they said. Do not plan your response while they are talking.',
      },
      {
        title: 'Reflect What You Heard',
        instruction: '"It sounds like you are feeling [emotion] because [reason]." Check if you got it right.',
        tip: 'People are much more willing to hear your perspective after they feel heard.',
      },
      {
        title: 'Validate the Feeling',
        instruction: '"That makes sense" or "I can understand why you would feel that way." You do not have to agree with everything.',
      },
      {
        title: 'Then Share Your View',
        instruction: 'Now share your perspective. "And from my side..." or "What I experienced was..."',
      },
    ],
    quickSteps: [
      { title: 'Listen', instruction: 'Hear them fully before speaking.' },
      { title: 'Validate', instruction: '"That makes sense. I understand."' },
      { title: 'Then respond', instruction: 'Now share your perspective calmly.' },
    ],
    whenToUse: [
      'During any difficult conversation',
      'When someone is upset with you',
      'When you want to be heard too',
      'De-escalating arguments',
    ],
    tags: ['communication', 'validation', 'de-escalation', 'simple'],
    situationalTags: ['conflict', 'de-escalation', 'relationships'],
  },
];
