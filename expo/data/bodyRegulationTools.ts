import { BodyRegulationTool } from '@/types/tools';

export const BODY_REGULATION_TOOLS: BodyRegulationTool[] = [
  {
    id: 'br-paced-breathing',
    title: 'Paced Breathing',
    subtitle: 'Slow your breath to calm your system',
    description: 'When your nervous system is activated, your breathing becomes shallow and fast. Deliberately slowing it down signals safety to your brain.',
    duration: '3 min',
    steps: [
      {
        title: 'Find Your Position',
        instruction: 'Sit or stand comfortably. Place one hand on your chest and one on your belly. Notice which hand moves more.',
        tip: 'Belly breathing (diaphragmatic) is more calming than chest breathing.',
      },
      {
        title: 'Breathe In for 4',
        instruction: 'Inhale slowly through your nose for a count of 4. Feel your belly expand under your hand.',
      },
      {
        title: 'Hold for 2',
        instruction: 'Pause gently at the top of your breath. No strain. Just a brief moment of stillness.',
      },
      {
        title: 'Breathe Out for 6',
        instruction: 'Exhale slowly through your mouth for 6 counts. The longer exhale activates your calming nervous system.',
      },
      {
        title: 'Repeat 6 Times',
        instruction: 'Continue this cycle. In 4, hold 2, out 6. Each round brings you closer to baseline. There is no rush.',
      },
    ],
    whenToUse: [
      'Heart racing after a trigger',
      'Feeling panicky or overwhelmed',
      'Before a difficult conversation',
      'Trouble falling asleep',
    ],
    tags: ['breathing', 'calming', 'quick', 'foundational'],
  },
  {
    id: 'br-60-second-settle',
    title: '60-Second Settle',
    subtitle: 'Ultra-fast nervous system reset',
    description: 'When you have less than a minute, this micro-practice can shift your nervous system just enough to think more clearly.',
    duration: '1 min',
    steps: [
      {
        title: 'Plant Your Feet',
        instruction: 'Press both feet firmly into the ground. Feel the floor beneath you. You are here. You are stable.',
      },
      {
        title: 'Squeeze and Release',
        instruction: 'Make tight fists. Hold for 5 seconds. Release completely. Feel the contrast — tension leaving your hands.',
      },
      {
        title: 'One Long Exhale',
        instruction: 'Take a deep breath in, then exhale as slowly as possible. Try to make the exhale last 8-10 seconds.',
        tip: 'One long exhale can be more powerful than multiple rounds of breathing when time is short.',
      },
      {
        title: 'Name Three Things',
        instruction: 'Look around and name 3 things you can see. Say them out loud or silently. This anchors you to the present.',
      },
    ],
    whenToUse: [
      'Before responding to an upsetting message',
      'In a meeting or public space',
      'When you feel a reaction building',
      'Any moment you need a quick reset',
    ],
    tags: ['quick', 'grounding', 'anywhere', 'micro'],
  },
  {
    id: 'br-sensory-grounding',
    title: 'Sensory Grounding',
    subtitle: 'Use your senses to anchor to the present',
    description: 'Sensory input pulls your brain out of emotional spiraling and into the present moment. It works because your senses can only operate in the now.',
    duration: '4 min',
    steps: [
      {
        title: 'Touch Something Textured',
        instruction: 'Run your fingers over something with texture — fabric, a rough surface, your own skin. Focus entirely on the physical sensation.',
      },
      {
        title: 'Listen Deliberately',
        instruction: 'Close your eyes. What is the furthest sound you can hear? The nearest? Layer the sounds. Let them hold your attention.',
      },
      {
        title: 'Smell Something Strong',
        instruction: 'Coffee, soap, a candle, essential oil, fresh air. Inhale deeply and let the scent fill your awareness.',
        tip: 'Smell is the sense most directly connected to the emotional brain. It can shift your state quickly.',
      },
      {
        title: 'Taste Something',
        instruction: 'If available, eat something with strong flavor — a mint, a piece of chocolate, a sip of something cold. Focus on every nuance of flavor.',
      },
      {
        title: 'See in Detail',
        instruction: 'Pick one object and describe it in extreme detail — color, shape, texture, shadows. As if you were describing it to someone who has never seen anything.',
      },
    ],
    whenToUse: [
      'Dissociation or feeling numb',
      'Flashbacks or intrusive memories',
      'Feeling disconnected from your body',
      'Anxiety spiraling into panic',
    ],
    tags: ['grounding', 'senses', 'dissociation', 'presence'],
  },
  {
    id: 'br-body-scan',
    title: 'Quick Body Scan',
    subtitle: 'Notice where emotions live in your body',
    description: 'Emotions create physical sensations. Scanning your body helps you understand your emotional state and begin releasing tension.',
    duration: '5 min',
    steps: [
      {
        title: 'Start at Your Head',
        instruction: 'Notice your forehead, jaw, and neck. Is there tension? Tightness? Heat? Just notice without trying to change anything.',
      },
      {
        title: 'Move to Your Chest',
        instruction: 'Notice your chest and upper back. Is your breathing shallow? Is there heaviness or tightness? What emotion might live here?',
      },
      {
        title: 'Notice Your Stomach',
        instruction: 'Check your gut. Butterflies? Knots? Nausea? The gut often holds anxiety, dread, and anticipation.',
        tip: 'The gut has its own nervous system — sometimes it knows what you\'re feeling before your brain does.',
      },
      {
        title: 'Feel Your Limbs',
        instruction: 'Notice your arms, hands, legs, feet. Heaviness? Restlessness? Numbness? Tingling? Each sensation is information.',
      },
      {
        title: 'Breathe Into the Tightest Spot',
        instruction: 'Find the area with the most tension. Breathe directly into it. Imagine the breath softening that space. You don\'t have to fix it — just acknowledge it.',
      },
    ],
    whenToUse: [
      'Feeling emotionally overwhelmed but unsure why',
      'Physical tension from stress',
      'Before journaling to identify what you\'re feeling',
      'End of a difficult day',
    ],
    tags: ['body-awareness', 'relaxation', 'emotional-literacy', 'daily'],
  },
  {
    id: 'br-temperature-shift',
    title: 'Temperature Shift',
    subtitle: 'Use cold to rapidly reduce emotional intensity',
    description: 'Cold activates the dive reflex — a biological mechanism that slows your heart rate and calms your system. It works in seconds, not minutes.',
    duration: '2 min',
    steps: [
      {
        title: 'Choose Your Method',
        instruction: 'Cold water on face, ice cubes in hands, cold pack on neck, or step outside into cold air. Choose what\'s available.',
        tip: 'Submerging your face in cold water while holding your breath is the fastest method — it triggers the dive reflex directly.',
      },
      {
        title: 'Apply Cold for 30 Seconds',
        instruction: 'Hold the cold sensation for at least 30 seconds. Focus entirely on the physical feeling. Let it be intense.',
      },
      {
        title: 'Notice the Shift',
        instruction: 'After 30 seconds, notice what changed. Heart rate? Breathing? Emotional intensity? Most people feel a noticeable drop.',
      },
      {
        title: 'Breathe Slowly',
        instruction: 'Now take 3 slow breaths. The temperature shift has opened a window — use it to breathe yourself to calmer ground.',
      },
    ],
    whenToUse: [
      'Distress above 8/10',
      'Panic attack symptoms',
      'Intense anger before you act on it',
      'When nothing else is working',
    ],
    tags: ['crisis', 'quick', 'body-based', 'high-distress'],
  },
  {
    id: 'br-tension-release',
    title: 'Progressive Tension Release',
    subtitle: 'Tense and release your way to calm',
    description: 'When you\'re stressed, your muscles tighten without you noticing. Deliberately tensing then releasing teaches your body the difference between tension and relaxation.',
    duration: '6 min',
    steps: [
      {
        title: 'Fists and Forearms',
        instruction: 'Make tight fists. Squeeze hard for 5 seconds. Notice the tension. Now release completely. Feel the difference.',
      },
      {
        title: 'Shoulders and Neck',
        instruction: 'Raise your shoulders to your ears. Hold tight for 5 seconds. Drop them. Feel them fall. Let the weight release.',
      },
      {
        title: 'Face',
        instruction: 'Scrunch your entire face tightly — forehead, eyes, mouth. Hold 5 seconds. Release. Let your face go completely slack.',
        tip: 'We hold enormous tension in our face without realizing it, especially the jaw.',
      },
      {
        title: 'Core and Back',
        instruction: 'Tighten your stomach and back muscles. Hold 5 seconds. Release. Feel your torso soften.',
      },
      {
        title: 'Legs and Feet',
        instruction: 'Press your feet into the floor and tighten your leg muscles. Hold 5 seconds. Release. Let your legs feel heavy and soft.',
      },
      {
        title: 'Full Body Scan',
        instruction: 'Now notice your whole body. Where is there still tension? Breathe into that area. You\'ve given yourself permission to relax.',
      },
    ],
    whenToUse: [
      'Physical tension from emotional stress',
      'Trouble sleeping',
      'After a long day of holding it together',
      'When you need to physically let go',
    ],
    tags: ['relaxation', 'tension', 'sleep', 'body-based'],
  },
  {
    id: 'br-movement-reset',
    title: 'Movement Reset',
    subtitle: 'Use movement to shake off emotional weight',
    description: 'Sometimes your body needs to move to process emotions. This is especially true for anger, anxiety, and restlessness.',
    duration: '5 min',
    steps: [
      {
        title: 'Stand Up',
        instruction: 'Get on your feet. If you can\'t stand, sit at the edge of your seat. The goal is to engage your body.',
      },
      {
        title: 'Shake It Out',
        instruction: 'Shake your hands vigorously. Then your arms. Then your whole body. Shake for 30 seconds like you\'re shaking water off.',
        tip: 'Animals shake after stressful events to release survival energy. Humans can do this too.',
      },
      {
        title: 'March or Walk',
        instruction: 'March in place or walk around for 60 seconds. Swing your arms. Feel your feet connecting with the ground.',
      },
      {
        title: 'Stretch Open',
        instruction: 'Reach your arms wide. Open your chest. Look up. Take a deep breath. You\'re creating space in your body.',
      },
      {
        title: 'Settle',
        instruction: 'Stand still. Feel your feet. Take 3 deep breaths. Notice how different your body feels from when you started.',
      },
    ],
    whenToUse: [
      'Restlessness or agitation',
      'Pent-up anger or frustration',
      'Feeling stuck or frozen',
      'Between emotional conversations',
    ],
    tags: ['movement', 'energy', 'anger', 'active'],
  },
  {
    id: 'br-post-trigger-reset',
    title: 'Post-Trigger Reset',
    subtitle: 'A full reset sequence after emotional activation',
    description: 'After a trigger, your body and mind are in emergency mode. This sequence guides you through a structured return to baseline.',
    duration: '7 min',
    steps: [
      {
        title: 'Stop Moving',
        instruction: 'Whatever you were doing, stop. Put the phone down. Step away. Create physical distance from the trigger if possible.',
      },
      {
        title: 'Cold + Breath',
        instruction: 'Splash cold water on your face or hold something cold. Then: breathe in 4, out 8. Repeat 4 times.',
      },
      {
        title: 'Ground with Senses',
        instruction: 'Name 5 things you see, 4 you can touch, 3 you hear, 2 you smell, 1 you taste. Move slowly through each one.',
      },
      {
        title: 'Name What Happened',
        instruction: 'In one sentence, what triggered you? "I got triggered when..." Don\'t analyze yet. Just name it.',
        tip: 'Naming a trigger reduces its physiological impact. Your brain shifts from reacting to processing.',
      },
      {
        title: 'Check Your Body',
        instruction: 'Where is the activation living? Heart? Stomach? Jaw? Breathe into that area gently.',
      },
      {
        title: 'Choose Your Next Step',
        instruction: 'You are calmer now. What is the wisest next step? Rest? Journal? Talk to someone? Use another tool? Or just be still for a moment?',
      },
    ],
    whenToUse: [
      'Immediately after a trigger',
      'After reading something upsetting',
      'After a confrontation or argument',
      'When your body is in fight/flight/freeze',
    ],
    tags: ['trigger', 'reset', 'comprehensive', 'post-crisis'],
  },
];
