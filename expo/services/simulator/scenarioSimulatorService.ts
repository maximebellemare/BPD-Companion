import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ScenarioInput,
  ResponseSimulation,
  ResponseStyle,
  RefineTool,
  PracticeRound,
  SimulatorSession,
  RESPONSE_STYLE_META,
} from '@/types/scenarioSimulator';

const SESSIONS_KEY = 'scenario_simulator_sessions';

function generateUrgentResponse(input: ScenarioInput): string {
  const msg = input.messageReceived.trim();
  if (msg) {
    return `We need to talk about this RIGHT NOW. I can't just sit here wondering what "${msg.slice(0, 40)}..." means. Are we okay? I need you to tell me what's going on. Please don't ignore me.`;
  }
  return `I can't keep waiting. We need to resolve this right now. Please tell me what's going on — I'm losing my mind here. I need an answer.`;
}

function generateAvoidantResponse(input: ScenarioInput): string {
  const msg = input.messageReceived.trim();
  if (msg) {
    return `Whatever. It's fine. I don't even know why I was thinking about this. Forget I brought it up.`;
  }
  return `You know what, never mind. I'm sure it doesn't matter anyway. Let's just drop it.`;
}

function generateDefensiveResponse(input: ScenarioInput): string {
  const msg = input.messageReceived.trim();
  if (msg) {
    return `I wouldn't have reacted that way if you hadn't said "${msg.slice(0, 30)}..." first. This isn't all on me — you started this. Maybe look at your own behavior before pointing fingers.`;
  }
  return `This isn't my fault. If you'd actually listen to what I was saying instead of twisting everything, we wouldn't be here. I'm not the only one who needs to change.`;
}

function generateSecureResponse(input: ScenarioInput): string {
  const msg = input.messageReceived.trim();
  const situation = input.situationDescription.trim();

  let core = "I want to talk about what happened";
  if (situation) {
    core = `I've been reflecting on ${situation.toLowerCase().slice(0, 50)}`;
  } else if (msg) {
    core = `I noticed what you said affected me`;
  }

  return `${core}. I want you to know that I care about this relationship, and I'd like to understand your perspective too. When we have a chance, could we talk about this calmly? I'm not looking to blame anyone — I just want us to feel good about how we communicate.`;
}

export function generateSimulations(input: ScenarioInput): ResponseSimulation[] {
  console.log('[ScenarioSimulator] Generating simulations');

  const styles: ResponseStyle[] = ['urgent', 'avoidant', 'defensive', 'secure'];

  const generators: Record<ResponseStyle, (input: ScenarioInput) => string> = {
    urgent: generateUrgentResponse,
    avoidant: generateAvoidantResponse,
    defensive: generateDefensiveResponse,
    secure: generateSecureResponse,
  };

  const emotionalImpacts: Record<ResponseStyle, string> = {
    urgent: "May temporarily relieve anxiety but increases dependence on their response for your emotional safety.",
    avoidant: "Feels self-protective now but leaves real feelings buried, often causing resentment later.",
    defensive: "Releases pressure in the moment but frequently leads to guilt and escalation.",
    secure: "May feel vulnerable initially but builds trust and emotional stability over time.",
  };

  const relationshipImpacts: Record<ResponseStyle, string> = {
    urgent: "Urgent responses may increase pressure on the other person, creating a push-pull dynamic.",
    avoidant: "Shutting down signals disinterest even when you care deeply, creating distance.",
    defensive: "Blame shifts focus from resolution to who's at fault, escalating conflict.",
    secure: "Calm, honest communication invites mutual respect and constructive dialogue.",
  };

  const riskLevels: Record<ResponseStyle, 'low' | 'medium' | 'high'> = {
    urgent: 'high',
    avoidant: 'medium',
    defensive: 'high',
    secure: 'low',
  };

  return styles.map(style => ({
    style,
    label: RESPONSE_STYLE_META[style].label,
    emoji: RESPONSE_STYLE_META[style].emoji,
    color: RESPONSE_STYLE_META[style].color,
    description: RESPONSE_STYLE_META[style].description,
    responseText: generators[style](input),
    emotionalImpact: emotionalImpacts[style],
    relationshipImpact: relationshipImpacts[style],
    riskLevel: riskLevels[style],
  }));
}

export function refineResponse(
  response: string,
  tools: RefineTool[],
): string {
  console.log('[ScenarioSimulator] Refining response with tools:', tools);
  let refined = response;

  if (tools.includes('remove_blame')) {
    refined = refined
      .replace(/you always/gi, 'sometimes it feels like')
      .replace(/you never/gi, 'I sometimes wish')
      .replace(/your fault/gi, 'what happened')
      .replace(/you started/gi, 'things escalated')
      .replace(/you made me/gi, 'I felt')
      .replace(/if you hadn't/gi, 'looking back,')
      .replace(/you did this/gi, 'this situation');
  }

  if (tools.includes('reduce_urgency')) {
    refined = refined
      .replace(/RIGHT NOW/gi, 'when you have a moment')
      .replace(/right now/gi, 'when we can')
      .replace(/I need you to/gi, 'I would appreciate if you could')
      .replace(/I can't wait/gi, 'I would like')
      .replace(/immediately/gi, 'soon')
      .replace(/ASAP/gi, 'when it works for you')
      .replace(/losing my mind/gi, 'feeling uncertain')
      .replace(/I need an answer/gi, 'I'd value hearing your thoughts');
  }

  if (tools.includes('add_clarity')) {
    if (!refined.match(/I feel|I'm feeling|I noticed/i)) {
      refined = "I want to be honest about how I'm feeling. " + refined;
    }
    if (!refined.match(/because|when you|when this/i)) {
      refined += " I'm sharing this because I care about us.";
    }
  }

  if (tools.includes('add_boundaries')) {
    if (!refined.match(/I need|boundary|limit|important to me/i)) {
      refined += " At the same time, it's important to me that we both feel respected in how we communicate.";
    }
  }

  return refined;
}

export function generatePracticeFeedback(
  chosenStyle: ResponseStyle,
  refinedResponse: string,
): { feedback: string; improvementTip: string } {
  console.log('[ScenarioSimulator] Generating practice feedback for style:', chosenStyle);

  const hasBlame = /you always|you never|your fault|you made me/i.test(refinedResponse);
  const hasUrgency = /right now|immediately|need you to|can't wait/i.test(refinedResponse);
  const hasClarity = /I feel|I'm feeling|I noticed|it matters to me/i.test(refinedResponse);
  const hasBoundary = /important to me|I need|boundary|respect/i.test(refinedResponse);

  let feedback = '';
  let tip = '';

  if (chosenStyle === 'secure') {
    if (hasBlame) {
      feedback = "Good start toward a secure tone, but there's still some blaming language that could trigger defensiveness.";
      tip = "Try replacing 'you' statements with 'I' statements to keep the focus on your experience.";
    } else if (hasUrgency) {
      feedback = "Your message shows self-awareness, but the urgency might create pressure.";
      tip = "Consider softening timelines — 'when we can' feels safer than 'right now.'";
    } else if (hasClarity && hasBoundary) {
      feedback = "This is a strong, grounded response. You expressed yourself clearly with respect for both sides.";
      tip = "You could add a small opening for their perspective, like 'I'd love to hear how you feel too.'";
    } else if (hasClarity) {
      feedback = "Great emotional clarity. Your feelings are expressed without blame.";
      tip = "Adding a gentle boundary could make this even stronger — what matters most to you here?";
    } else {
      feedback = "This reads as calm and thoughtful. It invites dialogue rather than demanding it.";
      tip = "Including a specific feeling ('I felt hurt when...') can deepen connection.";
    }
  } else {
    feedback = `You chose a ${RESPONSE_STYLE_META[chosenStyle].label.toLowerCase()} response. Notice how it might feel to receive this message.`;
    tip = "Try switching to the secure response builder to practice a calmer version.";
  }

  return { feedback, improvementTip: tip };
}

export async function saveSession(session: SimulatorSession): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(SESSIONS_KEY);
    const sessions: SimulatorSession[] = stored ? JSON.parse(stored) : [];
    sessions.unshift(session);
    const trimmed = sessions.slice(0, 30);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed));
    console.log('[ScenarioSimulator] Session saved:', session.id);
  } catch (err) {
    console.error('[ScenarioSimulator] Error saving session:', err);
  }
}

export async function getSessions(): Promise<SimulatorSession[]> {
  try {
    const stored = await AsyncStorage.getItem(SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.error('[ScenarioSimulator] Error loading sessions:', err);
    return [];
  }
}
