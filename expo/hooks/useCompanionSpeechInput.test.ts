import {
  canAttemptCompanionSpeechInput,
  canShowCompanionSpeechInput,
  getCompanionSpeechInitializationDecision,
} from '@/hooks/useCompanionSpeechInput';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`Companion speech regression failed: ${message}`);
}

export function assertCompanionSpeechInputScenarios(): true {
  assert(
    canAttemptCompanionSpeechInput('ios', 'standalone') === false,
    'native iOS builds keep speech input disabled until the installed native module is crash-safe',
  );
  assert(
    canShowCompanionSpeechInput('ios', 'standalone') === false,
    'native iOS builds hide speech input while native activation is disabled',
  );
  assert(
    canShowCompanionSpeechInput('android', 'standalone') === true,
    'native Android builds still render the mic button',
  );
  assert(
    canAttemptCompanionSpeechInput('android', 'standalone') === true,
    'native Android builds can expose speech input for user-initiated loading',
  );
  assert(
    canAttemptCompanionSpeechInput('web', 'standalone') === false,
    'web never attempts the native speech module',
  );
  assert(
    canAttemptCompanionSpeechInput('ios', 'expo') === false,
    'Expo Go never attempts the native speech module',
  );

  assert(
    getCompanionSpeechInitializationDecision({
      canAttempt: true,
      hasModule: false,
      isInitializing: false,
      isMounted: false,
    }) === 'unavailable',
    'leaving the tab during initialization prevents native speech startup',
  );
  assert(
    getCompanionSpeechInitializationDecision({
      canAttempt: true,
      hasModule: false,
      isInitializing: false,
      isMounted: true,
    }) === 'start-initialization',
    'first mic tap starts native speech initialization',
  );
  assert(
    getCompanionSpeechInitializationDecision({
      canAttempt: true,
      hasModule: false,
      isInitializing: true,
      isMounted: true,
    }) === 'await-existing',
    'repeated mic taps share the same initialization path',
  );
  assert(
    getCompanionSpeechInitializationDecision({
      canAttempt: true,
      hasModule: true,
      isInitializing: false,
      isMounted: true,
    }) === 'use-existing',
    'initialized speech module reuses existing listeners',
  );

  return true;
}

export const companionSpeechInputTestsPassed = assertCompanionSpeechInputScenarios();
