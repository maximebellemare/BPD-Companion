import { RelationshipRecoveryTool } from '@/types/tools';

export const RELATIONSHIP_RECOVERY_TOOLS: RelationshipRecoveryTool[] = [
  {
    id: 'rr-said-too-much',
    title: 'I Said Too Much',
    subtitle: 'What to do after words you can\'t take back',
    description: 'When intense emotions lead to saying things you regret, the shame can be overwhelming. This tool helps you move from regret toward repair.',
    duration: '5 min',
    steps: [
      {
        title: 'Pause the Shame Spiral',
        instruction: 'Take a breath. What happened does not define who you are. It reflects a moment of intense emotion, not your character.',
        tip: 'Shame tells you that you ARE bad. Guilt tells you that you DID something you regret. Focus on the action, not your identity.',
      },
      {
        title: 'Name What Happened',
        instruction: 'What did you say? Be specific but gentle with yourself. Acknowledge it honestly without adding harsh self-judgment.',
      },
      {
        title: 'Identify What Was Underneath',
        instruction: 'What emotion drove those words? Fear? Hurt? Feeling unheard? Understanding the root helps you explain, not excuse.',
      },
      {
        title: 'Plan a Repair',
        instruction: 'What would a sincere, non-over-explaining apology look like? Something like: "I said things I regret. What I was really feeling was [emotion], and I wish I had said it differently."',
      },
      {
        title: 'Decide on Timing',
        instruction: 'Is now the right time to reach out? Or does the other person need space? Repair works better when both people are calm.',
      },
    ],
    whenToUse: [
      'After an argument where you said hurtful things',
      'When shame is overwhelming after a conflict',
      'Before apologizing to someone',
      'Feeling like you ruined everything',
    ],
    tags: ['repair', 'shame', 'communication', 'post-conflict'],
  },
  {
    id: 'rr-withdrew',
    title: 'I Withdrew — How Do I Reconnect?',
    subtitle: 'Coming back after shutting down',
    description: 'Withdrawal is a common response to overwhelm. But reconnecting can feel impossible. This tool helps bridge the gap gently.',
    duration: '4 min',
    steps: [
      {
        title: 'Acknowledge the Withdrawal',
        instruction: 'It\'s okay that you withdrew. Shutting down is often a protective response, not a character flaw. You needed space.',
      },
      {
        title: 'Check Your State',
        instruction: 'Are you calm enough to re-engage? If not, that\'s okay — reconnection doesn\'t need to happen immediately.',
        tip: 'Reconnecting while still overwhelmed often leads to another withdrawal or escalation.',
      },
      {
        title: 'Prepare a Simple Opening',
        instruction: 'You don\'t need a speech. Something simple: "I shut down earlier and I\'m sorry. I\'m ready to talk when you are."',
      },
      {
        title: 'Be Honest About Why',
        instruction: 'If you can, share what happened internally: "I got overwhelmed and my brain went into shutdown mode." Vulnerability builds trust.',
      },
    ],
    whenToUse: [
      'After going silent during a conversation',
      'When you\'ve been avoiding someone for days',
      'After emotional shutdown',
      'Wanting to reconnect but feeling stuck',
    ],
    tags: ['reconnection', 'avoidance', 'vulnerability', 'post-conflict'],
  },
  {
    id: 'rr-apologize',
    title: 'How to Apologize Without Abandoning Myself',
    subtitle: 'Sincere repair without self-erasure',
    description: 'A good apology acknowledges harm without erasing your own needs. This tool helps you repair the relationship while keeping your self-respect intact.',
    duration: '5 min',
    steps: [
      {
        title: 'Acknowledge Their Experience',
        instruction: 'Start by naming what the other person felt or experienced because of your actions. "I can see that what I said hurt you."',
      },
      {
        title: 'Take Responsibility',
        instruction: 'Own your part without over-explaining or making excuses. "I reacted in a way that wasn\'t fair to you, and I\'m sorry."',
        tip: 'Good apologies don\'t include "but" — "I\'m sorry, but you also..." invalidates the apology.',
      },
      {
        title: 'Hold Your Own Truth',
        instruction: 'Apologizing doesn\'t mean your feelings were wrong. You can say: "My feelings were real, but the way I expressed them wasn\'t okay."',
      },
      {
        title: 'Offer a Path Forward',
        instruction: 'Suggest what you\'ll do differently: "Next time I\'m overwhelmed, I\'ll tell you I need a pause instead of lashing out."',
      },
    ],
    whenToUse: [
      'When you owe an apology but fear losing yourself',
      'After you\'ve been told you hurt someone',
      'When shame makes you want to over-apologize',
      'Preparing for a repair conversation',
    ],
    tags: ['apology', 'repair', 'self-respect', 'communication'],
  },
  {
    id: 'rr-shame-recovery',
    title: 'Shame Recovery After Conflict',
    subtitle: 'Reduce shame without suppressing it',
    description: 'Post-conflict shame can be paralyzing. This tool helps you process shame so it doesn\'t control your next actions.',
    duration: '5 min',
    steps: [
      {
        title: 'Name the Shame',
        instruction: 'Say it directly: "I feel ashamed because..." Naming it reduces its power. Shame thrives in silence.',
      },
      {
        title: 'Separate Behavior from Identity',
        instruction: 'What did you do? That\'s behavior. Who are you? That\'s identity. The behavior can be changed. Your worth is not in question.',
        tip: '"I did something I regret" is recoverable. "I am a terrible person" is a shame trap.',
      },
      {
        title: 'Would You Say This to a Friend?',
        instruction: 'If a friend told you they did what you did, what would you say to them? Would you tell them they\'re worthless? Or would you show compassion?',
      },
      {
        title: 'What Would Self-Respect Look Like?',
        instruction: 'Not self-punishment. Not self-erasure. What would a self-respecting next step look like? Repair? Rest? Reflection? Boundaries?',
      },
      {
        title: 'Ground in Who You Want to Be',
        instruction: 'This moment does not define your future. Who do you want to be in your relationships? What small step moves you toward that person?',
      },
    ],
    whenToUse: [
      'Intense shame after a conflict',
      'Feeling like a bad person',
      'Wanting to disappear or isolate',
      'After doing something you deeply regret',
    ],
    tags: ['shame', 'self-compassion', 'recovery', 'identity'],
  },
  {
    id: 'rr-stop-replaying',
    title: 'Stop Replaying the Conflict',
    subtitle: 'Break free from the mental loop',
    description: 'After conflict, the mind replays it endlessly — revising, ruminating, reliving. This tool helps you break the cycle.',
    duration: '4 min',
    steps: [
      {
        title: 'Notice the Replay',
        instruction: 'Catch yourself: "I\'m replaying again." Just noticing it creates a tiny gap between you and the loop.',
      },
      {
        title: 'What Is the Replay Trying to Solve?',
        instruction: 'Usually it\'s trying to figure out: "What should I have said?" or "Why did they do that?" or "Am I safe?" Name what it\'s seeking.',
        tip: 'Rumination feels productive but rarely leads to resolution. It recycles the same distress.',
      },
      {
        title: 'Answer the Core Question',
        instruction: 'Write down the answer to what the replay is seeking. Even an imperfect answer. Give your brain something to land on.',
      },
      {
        title: 'Redirect',
        instruction: 'Now engage your senses. Cold water, music, movement, naming things around you. Give your brain a different track to run on.',
      },
    ],
    whenToUse: [
      'Replaying a fight over and over',
      'Can\'t stop thinking about what you should have said',
      'Ruminating about someone\'s motives',
      'Unable to sleep after conflict',
    ],
    tags: ['rumination', 'grounding', 'post-conflict', 'cognitive'],
  },
  {
    id: 'rr-come-down-anger',
    title: 'Come Down After Anger',
    subtitle: 'Safely process anger after it peaks',
    description: 'Anger is exhausting. After the peak, you need to come down safely without suppressing or re-escalating. This tool guides that descent.',
    duration: '5 min',
    steps: [
      {
        title: 'Acknowledge the Anger',
        instruction: 'You were angry. That\'s okay. Anger is information — it tells you a boundary was crossed or a need was unmet.',
      },
      {
        title: 'Release Physical Tension',
        instruction: 'Shake your hands vigorously for 10 seconds. Roll your shoulders. Unclench your jaw. Let your body release what it\'s holding.',
        tip: 'Anger lives in the body. Physical release is essential, not optional.',
      },
      {
        title: 'Slow Your Breathing',
        instruction: 'Breathe in for 4, out for 8. Make the exhale long and slow. Do this 5 times. You\'re telling your nervous system the threat is over.',
      },
      {
        title: 'Assess the Damage',
        instruction: 'Did you say or do anything while angry? If so, you can repair it — but not right now. Right now, focus on coming down.',
      },
      {
        title: 'What Triggered the Anger?',
        instruction: 'Once calmer, name what set it off. Not "they made me angry" but "I felt angry when..." This is where understanding begins.',
      },
    ],
    whenToUse: [
      'After an angry outburst',
      'Still feeling activated after a fight',
      'Body is tense and shaking after conflict',
      'Need to calm down before doing anything else',
    ],
    tags: ['anger', 'regulation', 'body', 'post-conflict'],
  },
  {
    id: 'rr-repair-without-panic',
    title: 'Repair Without Panicking',
    subtitle: 'Calm repair when abandonment fear is active',
    description: 'When you fear the relationship is damaged, the urge to frantically repair can make things worse. This tool helps you repair from a steady place.',
    duration: '4 min',
    steps: [
      {
        title: 'Notice the Panic',
        instruction: 'The urgency you feel is likely abandonment fear, not the actual relationship ending. Name it: "This is fear of losing them, not certainty."',
        tip: 'Panic-driven repair often looks like over-apologizing, begging, or making promises you can\'t keep.',
      },
      {
        title: 'Pause Before Acting',
        instruction: 'Wait. Not forever — just long enough to calm your nervous system. Can you wait 30 minutes? An hour? Until tomorrow?',
      },
      {
        title: 'Check: Is This About Them or My Fear?',
        instruction: 'Are you repairing because you genuinely want to address what happened? Or because the uncertainty feels unbearable?',
      },
      {
        title: 'Plan a Calm Repair',
        instruction: 'A calm repair is brief, honest, and not desperate. "I care about us. I know things got hard. Can we talk when you\'re ready?"',
      },
    ],
    whenToUse: [
      'Fear of abandonment after a fight',
      'Urge to send multiple apology messages',
      'Feeling desperate to fix things immediately',
      'When the other person asked for space',
    ],
    tags: ['abandonment', 'repair', 'panic', 'relationships'],
  },
];
