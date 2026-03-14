import { MentalizationTool } from '@/types/tools';

export const MENTALIZATION_TOOLS: MentalizationTool[] = [
  {
    id: 'mbt-assumptions',
    title: 'What Am I Assuming?',
    subtitle: 'Separate facts from mental stories',
    description: 'When emotions run high, the mind fills gaps with assumptions. This tool helps you notice what you actually know versus what your mind is creating.',
    duration: '3 min',
    prompts: [
      {
        title: 'Name the Situation',
        instruction: 'Briefly describe what happened or what triggered you. Keep it factual — just the events.',
      },
      {
        title: 'What Am I Assuming?',
        instruction: 'What meaning am I adding to this? What am I telling myself about the other person\'s intentions, thoughts, or feelings?',
        tip: 'Assumptions feel like facts when we\'re emotional. They often start with "they obviously..." or "they must think..."',
      },
      {
        title: 'What Do I Actually Know?',
        instruction: 'Strip away the assumptions. What evidence do I actually have? What could I verify if I asked?',
      },
      {
        title: 'What Might Be Missing?',
        instruction: 'What information don\'t I have? What context might explain their behavior that I haven\'t considered?',
      },
    ],
    whenToUse: [
      'Feeling certain about someone else\'s intentions',
      'After reading a text and feeling triggered',
      'Before confronting someone',
      'When anger feels justified but something feels off',
    ],
    tags: ['perspective', 'assumptions', 'relationships', 'quick'],
  },
  {
    id: 'mbt-other-explanation',
    title: 'Could There Be Another Explanation?',
    subtitle: 'Challenge certainty with curiosity',
    description: 'Emotional intensity narrows our thinking. This tool reopens your perspective by generating alternative explanations for what happened.',
    duration: '3 min',
    prompts: [
      {
        title: 'My Current Interpretation',
        instruction: 'What do I believe happened and why? Write down your interpretation as clearly as you can.',
      },
      {
        title: 'Alternative Explanation 1',
        instruction: 'What if this had nothing to do with me? What else might be going on in their life that could explain this?',
      },
      {
        title: 'Alternative Explanation 2',
        instruction: 'What if they had good intentions but communicated poorly? How might that change things?',
        tip: 'Most people are not trying to hurt us — they are dealing with their own emotional limitations.',
      },
      {
        title: 'Alternative Explanation 3',
        instruction: 'What would someone I trust say about this situation? How might they see it differently?',
      },
      {
        title: 'Most Balanced View',
        instruction: 'Looking at all possibilities, which explanation has the most evidence? Which one would help you respond most wisely?',
      },
    ],
    whenToUse: [
      'Feeling rejected or dismissed',
      'When someone didn\'t reply',
      'After perceiving disrespect',
      'Before making a relationship decision while emotional',
    ],
    tags: ['perspective', 'cognitive', 'relationships', 'reframe'],
  },
  {
    id: 'mbt-their-feelings',
    title: 'What Might They Be Feeling?',
    subtitle: 'Step into another perspective',
    description: 'When we\'re hurt, it\'s hard to imagine the other person has their own emotional experience. This tool builds empathy without dismissing your own feelings.',
    duration: '4 min',
    prompts: [
      {
        title: 'What I\'m Feeling',
        instruction: 'Start by naming your own emotions. This isn\'t about dismissing yourself — it\'s about creating space for a wider view.',
      },
      {
        title: 'What Might They Be Feeling?',
        instruction: 'Try to imagine their emotional state. Are they stressed, scared, overwhelmed, defensive, hurt? What clues do you have?',
        tip: 'You don\'t need to be right. The goal is to consider their inner world, not diagnose it.',
      },
      {
        title: 'What Might They Need?',
        instruction: 'If they are feeling that way, what might they need right now? Space? Reassurance? Understanding? Clarity?',
      },
      {
        title: 'How Does This Change Things?',
        instruction: 'Does considering their perspective change how you want to respond? Does it soften anything? Does it add complexity to a simple story?',
      },
    ],
    whenToUse: [
      'After conflict with someone you care about',
      'When you feel misunderstood',
      'Before having a difficult conversation',
      'When you\'re seeing someone as all-bad',
    ],
    tags: ['empathy', 'perspective', 'relationships', 'splitting'],
  },
  {
    id: 'mbt-self-view',
    title: 'What Changed in My View of Myself?',
    subtitle: 'Track identity shifts during emotional moments',
    description: 'Intense emotions can rapidly change how we see ourselves. This tool helps you notice those shifts and reconnect with a more stable self-view.',
    duration: '4 min',
    prompts: [
      {
        title: 'Before This Happened',
        instruction: 'How did you see yourself before this emotional event? What did you believe about yourself?',
      },
      {
        title: 'Right Now',
        instruction: 'How do you see yourself now? What story is your mind telling about who you are? Notice any harsh labels.',
        tip: 'Emotional events can make us feel like a fundamentally different person. This shift is temporary.',
      },
      {
        title: 'What Triggered the Shift?',
        instruction: 'What specific moment caused your self-view to change? Was it something someone said? Something you did? An interpretation?',
      },
      {
        title: 'A More Stable View',
        instruction: 'Who are you on a calm day? What do people who love you see? Can you hold both the pain and a more stable sense of yourself?',
      },
    ],
    whenToUse: [
      'Feeling worthless after conflict',
      'Identity confusion or emptiness',
      'After shame or embarrassment',
      'When your self-view shifts dramatically',
    ],
    tags: ['identity', 'self-awareness', 'shame', 'stability'],
  },
  {
    id: 'mbt-view-of-them',
    title: 'What Changed in My View of Them?',
    subtitle: 'Notice when someone flips from good to bad',
    description: 'When someone hurts us, they can instantly become "all bad." This tool helps you hold a more nuanced view, even during pain.',
    duration: '3 min',
    prompts: [
      {
        title: 'How I Saw Them Before',
        instruction: 'Think about this person on a good day. What qualities do they have? What have they done that you valued?',
      },
      {
        title: 'How I See Them Now',
        instruction: 'How are you seeing them right now? What labels or judgments are present? "They\'re selfish." "They don\'t care."',
        tip: 'This dramatic shift — from all-good to all-bad — is called splitting. It\'s very common and very human.',
      },
      {
        title: 'Can Both Be True?',
        instruction: 'Can this person be both imperfect and still care about you? Can they have made a mistake and still be a good person? Can you be hurt and still see them as complex?',
      },
      {
        title: 'What Would Help Most?',
        instruction: 'Given a more nuanced view, what action would be most effective right now? Not what feels most satisfying — what would be most wise?',
      },
    ],
    whenToUse: [
      'When someone suddenly feels like an enemy',
      'After betrayal or perceived betrayal',
      'When you want to cut someone off in anger',
      'Feeling completely disillusioned with someone',
    ],
    tags: ['splitting', 'relationships', 'perspective', 'nuance'],
  },
  {
    id: 'mbt-need-underneath',
    title: 'What Need Is Underneath This?',
    subtitle: 'Find the unmet need driving the reaction',
    description: 'Strong emotional reactions often signal unmet needs. Identifying the need gives you power to address it directly, instead of reacting to symptoms.',
    duration: '3 min',
    prompts: [
      {
        title: 'Name the Reaction',
        instruction: 'What are you feeling? What urge is strongest? Be specific about the emotional experience.',
      },
      {
        title: 'What Need Is Underneath?',
        instruction: 'What do you actually need right now? Safety? Connection? Respect? Reassurance? Clarity? To be seen? To matter?',
        tip: 'Common unmet needs: to feel safe, valued, respected, connected, understood, autonomous, or worthy.',
      },
      {
        title: 'Is This Need Being Met?',
        instruction: 'Is this need being addressed in this situation? If not, what would meeting it look like?',
      },
      {
        title: 'How Can You Ask For It?',
        instruction: 'Can you ask for what you need directly? Can you meet some of this need yourself? What is one small step toward getting this need met?',
      },
    ],
    whenToUse: [
      'Intense reactions that feel disproportionate',
      'Repeated arguments about the same thing',
      'Feeling desperate for something but unsure what',
      'Before making demands in a relationship',
    ],
    tags: ['needs', 'self-awareness', 'relationships', 'depth'],
  },
  {
    id: 'mbt-story-mind',
    title: 'What Story Is My Mind Creating?',
    subtitle: 'Catch the narrative before it takes over',
    description: 'Our minds are storytelling machines. During emotional moments, these stories can become the entire reality. This tool helps you step back and see the story as a story.',
    duration: '3 min',
    prompts: [
      {
        title: 'The Story',
        instruction: 'Write out the narrative your mind is running. Don\'t filter it. Let it be dramatic, catastrophic, or unfair. Get it out.',
      },
      {
        title: 'The Facts',
        instruction: 'Now strip the story down to bare facts. What happened? What was actually said or done? Remove interpretations.',
        tip: 'Stories add meaning to facts. The meaning feels real, but it\'s added by your mind, not by reality.',
      },
      {
        title: 'The Gap',
        instruction: 'Notice the gap between the facts and the story. How much did your mind add? What assumptions filled the gaps?',
      },
      {
        title: 'A Different Story',
        instruction: 'Using the same facts, write a different story. A kinder one. A more neutral one. Notice how the same facts support multiple stories.',
      },
    ],
    whenToUse: [
      'Spiraling thoughts',
      'Catastrophizing',
      'Feeling certain about a negative outcome',
      'When your mind won\'t stop replaying something',
    ],
    tags: ['cognitive', 'stories', 'spiraling', 'awareness'],
  },
];
