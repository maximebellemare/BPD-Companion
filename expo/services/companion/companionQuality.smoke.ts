import { __devSmokeGenerateCompanionFallback } from './companionAIService';

const FORBIDDEN_PHRASES = [
  'One breath first',
  'For the next minute',
  'Using recent context',
  'calm your body first',
  'surface moment',
  'the silence',
  'what is alive in you',
  'your system',
  'There may be more here',
  'What part feels familiar',
  'What does it mean',
  'What are you protecting',
  'Where does fact become fear',
  'If this feeling had a sentence',
];

export function runCompanionQualitySmokeTest(): void {
  const cases = ['I feel empty', "I don't know", 'When I get bored I drink'];

  cases.forEach(input => {
    const response = __devSmokeGenerateCompanionFallback(input);
    const responseLower = response.toLowerCase();
    const failedPhrase = FORBIDDEN_PHRASES.find(phrase => responseLower.includes(phrase.toLowerCase()));

    if (failedPhrase) {
      throw new Error(`Companion quality smoke failed for "${input}": found "${failedPhrase}" in "${response}"`);
    }

    if (input.includes('drink')) {
      const lower = response.toLowerCase();
      if (!lower.includes('drink') || !lower.includes('bored')) {
        throw new Error(`Companion quality smoke failed for "${input}": response missed boredom + drinking signal: "${response}"`);
      }
    }
  });
}

if (typeof process !== 'undefined' && process.argv.some(arg => arg.includes('companionQuality.smoke'))) {
  runCompanionQualitySmokeTest();
  console.log('Companion quality smoke passed');
}
