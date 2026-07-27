import {
  SecureRewriteOptions,
  ToneAnalysis,
} from '@/types/messageGuard';
import { localizedText } from '@/lib/i18n/staticText';

function reduceUrgencyTransform(text: string): string {
  let result = text;
  result = result.replace(/right now/gi, 'when you have a moment');
  result = result.replace(/i need you to (respond|reply|answer|text|call) (now|immediately|asap)/gi, "I'd appreciate hearing from you when you can");
  result = result.replace(/please (just |)(respond|reply|answer|text me back)/gi, "I'd love to hear from you when you're ready");
  result = result.replace(/\?\?+/g, '?');
  result = result.replace(/!{2,}/g, '.');
  result = result.replace(/WHY/g, 'why');
  result = result.replace(/PLEASE/g, 'please');
  return result;
}

function removeBlameTransform(text: string): string {
  let result = text;
  result = result.replace(/you always/gi, 'I notice that sometimes');
  result = result.replace(/you never/gi, "I'd really appreciate it if");
  result = result.replace(/you don('t|t) (even |)(care|give a)/gi, "I need to feel like this matters");
  result = result.replace(/what('s|s| is) wrong with you/gi, "I'm confused about what happened");
  result = result.replace(/you('re| are) (so |)(selfish|toxic|pathetic)/gi, "this situation feels really difficult for me");
  result = result.replace(/how (could|dare) you/gi, "I'm hurt by what happened");
  result = result.replace(/it('s|s| is) (all |)your fault/gi, "I want us to work through this together");
  return result;
}

function addEmotionalClarityTransform(text: string, analysis: ToneAnalysis): string {
  const signalLabels = analysis.signals.slice(0, 2);
  let emotionalPrefix = '';

  if (signalLabels.includes('abandonment_fear')) {
    emotionalPrefix = localizedText(
      "I'm feeling vulnerable right now, and I want to be honest about that. ",
      'Me siento vulnerable ahora mismo y quiero ser honesta/o con eso. ',
    );
  } else if (signalLabels.includes('rejection_sensitivity')) {
    emotionalPrefix = localizedText(
      "I'm noticing some sensitivity coming up for me, and I want to be open about it. ",
      'Estoy notando sensibilidad en mí y quiero hablarlo con apertura. ',
    );
  } else if (signalLabels.includes('shame')) {
    emotionalPrefix = localizedText(
      "I'm carrying some hard feelings right now, and I'm doing my best to share them clearly. ",
      'Estoy cargando sentimientos difíciles ahora mismo y hago lo posible por expresarlos con claridad. ',
    );
  } else if (signalLabels.includes('anger')) {
    emotionalPrefix = localizedText(
      "I'm feeling frustrated, and I want to express that without causing harm. ",
      'Me siento frustrada/o y quiero expresarlo sin causar daño. ',
    );
  } else if (analysis.emotionalIntensity >= 6) {
    emotionalPrefix = localizedText(
      'I have some strong feelings right now, and I want to share them thoughtfully. ',
      'Tengo sentimientos intensos ahora mismo y quiero compartirlos con cuidado. ',
    );
  }

  return emotionalPrefix + text;
}

function addBoundariesTransform(text: string): string {
  const boundaryCloser = localizedText(
    ' I care about this relationship, and I also need to protect my own peace right now.',
    ' Me importa esta relación y también necesito proteger mi paz en este momento.',
  );
  return text.trimEnd().replace(/[.!?]*$/, '.') + boundaryCloser;
}

export function buildSecureRewrite(
  originalText: string,
  analysis: ToneAnalysis,
  options: SecureRewriteOptions,
): string {
  console.log('[SecureRewrite] Building rewrite with options:', options);

  let result = originalText.trim();

  if (options.removeBlame) {
    result = removeBlameTransform(result);
  }

  if (options.reduceUrgency) {
    result = reduceUrgencyTransform(result);
  }

  if (options.addEmotionalClarity) {
    result = addEmotionalClarityTransform(result, analysis);
  }

  if (options.addBoundaries) {
    result = addBoundariesTransform(result);
  }

  return result;
}

export function generateQuickSecureVersion(originalText: string, analysis: ToneAnalysis): string {
  return buildSecureRewrite(originalText, analysis, {
    reduceUrgency: analysis.urgencyLevel >= 4,
    removeBlame: analysis.signals.includes('anger'),
    addEmotionalClarity: analysis.emotionalIntensity >= 4,
    addBoundaries: false,
  });
}
