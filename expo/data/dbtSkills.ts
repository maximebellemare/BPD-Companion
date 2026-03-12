import { DBTSkill, DBTModuleInfo } from '@/types/dbt';

export const DBT_MODULES: DBTModuleInfo[] = [
  {
    id: 'distress-tolerance',
    title: 'Distress Tolerance',
    description: 'Survive crisis moments without making things worse',
    color: '#E17055',
    bgColor: '#FDE8E3',
    iconName: 'Shield',
    skillCount: 5,
  },
  {
    id: 'emotional-regulation',
    title: 'Emotional Regulation',
    description: 'Understand and manage intense emotions',
    color: '#6B9080',
    bgColor: '#E3EDE8',
    iconName: 'Waves',
    skillCount: 4,
  },
  {
    id: 'interpersonal-effectiveness',
    title: 'Interpersonal Effectiveness',
    description: 'Communicate needs while keeping relationships',
    color: '#5B8FB9',
    bgColor: '#E3EFF7',
    iconName: 'Users',
    skillCount: 4,
  },
  {
    id: 'mindfulness',
    title: 'Mindfulness',
    description: 'Stay present and observe without judgment',
    color: '#C77DBA',
    bgColor: '#F5E6F3',
    iconName: 'Brain',
    skillCount: 4,
  },
];

export const DBT_SKILLS: DBTSkill[] = [
  // ── Distress Tolerance ──
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
    whenToUse: [
      'Emotional intensity above 7/10',
      'Before sending a reactive message',
      'When you feel like you might act on an urge',
      'Panic or anxiety attacks',
    ],
    tags: ['crisis', 'quick', 'body-based', 'high-distress'],
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
    whenToUse: [
      'Before reacting to a triggering message',
      'During an argument',
      'When you feel an impulsive urge',
      'Moments of sudden anger or hurt',
    ],
    tags: ['crisis', 'quick', 'impulse-control', 'communication'],
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
    whenToUse: [
      'Feeling emotionally drained',
      'After a difficult interaction',
      'Loneliness or emptiness',
      'Before sleep on a hard day',
    ],
    tags: ['self-care', 'grounding', 'comfort', 'low-energy'],
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
    whenToUse: [
      'Strong urge to send an impulsive message',
      'Urge to engage in self-destructive behavior',
      'Wanting to end a relationship in anger',
      'Any major decision during emotional intensity',
    ],
    tags: ['decision-making', 'impulse-control', 'cognitive'],
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
    whenToUse: [
      'Painful situations you cannot change',
      'Rejection or abandonment',
      'Loss or grief',
      'When fighting reality is causing more suffering',
    ],
    tags: ['acceptance', 'deep-work', 'suffering', 'advanced'],
  },

  // ── Emotional Regulation ──
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
    whenToUse: [
      'Emotion does not fit the facts',
      'Acting on the urge would make things worse',
      'Stuck in a shame or avoidance cycle',
      'Want to change a recurring emotional pattern',
    ],
    tags: ['emotion-change', 'behavior', 'active-skill'],
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
    whenToUse: [
      'Mind reading — assuming you know what others think',
      'Catastrophizing — worst case scenario thinking',
      'Relationship conflicts based on assumptions',
      'Emotional reactions that feel disproportionate',
    ],
    tags: ['cognitive', 'relationships', 'anxiety', 'assumptions'],
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
    whenToUse: [
      'Daily practice for emotional resilience',
      'Feeling emotionally vulnerable',
      'Recovering from a difficult period',
      'Preventing emotional crises',
    ],
    tags: ['prevention', 'daily-practice', 'self-care', 'resilience'],
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
    whenToUse: [
      'Intense emotions that do not require action',
      'Urge to react impulsively',
      'Grief or sadness',
      'Anxiety spirals',
    ],
    tags: ['mindfulness', 'acceptance', 'emotions', 'patience'],
  },

  // ── Interpersonal Effectiveness ──
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
    whenToUse: [
      'Asking for something you need in a relationship',
      'Setting a boundary',
      'Having a difficult conversation',
      'Requesting changes in behavior',
    ],
    tags: ['communication', 'relationships', 'boundaries', 'assertiveness'],
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
    whenToUse: [
      'Conversations where the relationship matters',
      'De-escalating conflicts',
      'Expressing disagreement without damaging trust',
      'Reconnecting after a rupture',
    ],
    tags: ['communication', 'relationships', 'gentle', 'connection'],
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
    whenToUse: [
      'When you tend to people-please',
      'Feeling pressured to compromise your values',
      'After over-apologizing',
      'Rebuilding self-respect in relationships',
    ],
    tags: ['self-respect', 'values', 'boundaries', 'honesty'],
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
    whenToUse: [
      'Supporting someone in distress',
      'Validating your own emotions',
      'After an argument or rupture',
      'When someone feels unheard',
    ],
    tags: ['validation', 'empathy', 'connection', 'communication'],
  },

  // ── Mindfulness ──
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
    whenToUse: [
      'Before making important decisions',
      'When torn between two extremes',
      'Feeling overwhelmed by emotions or overly disconnected',
      'After a triggering event',
    ],
    tags: ['core-skill', 'balance', 'wisdom', 'decision-making'],
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
    whenToUse: [
      'Daily mindfulness practice',
      'Feeling emotionally activated',
      'Before journaling',
      'When you want to understand what you are feeling',
    ],
    tags: ['core-skill', 'awareness', 'daily-practice', 'grounding'],
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
    whenToUse: [
      'Feeling scattered or overwhelmed',
      'Racing thoughts',
      'Difficulty being present',
      'Wanting to build daily mindfulness',
    ],
    tags: ['daily-practice', 'focus', 'presence', 'simple'],
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
    whenToUse: [
      'Caught in self-criticism',
      'Judging others harshly',
      'Labeling emotions as good or bad',
      'Wanting to reduce suffering',
    ],
    tags: ['advanced', 'self-compassion', 'perspective', 'acceptance'],
  },
];
