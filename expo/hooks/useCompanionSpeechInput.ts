import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

type SpeechInputStatus = 'idle' | 'listening' | 'error' | 'unavailable';

type UseCompanionSpeechInputOptions = {
  onTranscript: (transcript: string, isFinal: boolean) => void;
};

type SpeechModule = {
  ExpoSpeechRecognitionModule: {
    addListener: (eventName: string, listener: (event: any) => void) => { remove: () => void };
    isRecognitionAvailable: () => boolean;
    requestPermissionsAsync: () => Promise<{ granted: boolean }>;
    start: (options: Record<string, unknown>) => void;
    stop: () => void;
    abort: () => void;
  };
};

type SpeechInitializationDecisionInput = {
  canAttempt: boolean;
  hasModule: boolean;
  isInitializing: boolean;
  isMounted: boolean;
};

type SpeechInitializationDecision = 'unavailable' | 'use-existing' | 'await-existing' | 'start-initialization';

const ENABLE_COMPANION_SPEECH_INPUT = true;
const ENABLE_IOS_COMPANION_SPEECH_INPUT = false;
const LISTENING_MESSAGE = 'Listening… tap to stop';

function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

export function canAttemptCompanionSpeechInput(
  platform: typeof Platform.OS = Platform.OS,
  appOwnership: string | null | undefined = Constants.appOwnership,
): boolean {
  return ENABLE_COMPANION_SPEECH_INPUT
    && (platform !== 'ios' || ENABLE_IOS_COMPANION_SPEECH_INPUT)
    && platform !== 'web'
    && appOwnership !== 'expo';
}

export function canShowCompanionSpeechInput(
  platform: typeof Platform.OS = Platform.OS,
  appOwnership: string | null | undefined = Constants.appOwnership,
): boolean {
  return ENABLE_COMPANION_SPEECH_INPUT && platform !== 'web' && appOwnership !== 'expo';
}

export function getCompanionSpeechInitializationDecision(
  input: SpeechInitializationDecisionInput,
): SpeechInitializationDecision {
  if (!input.canAttempt || !input.isMounted) return 'unavailable';
  if (input.hasModule) return 'use-existing';
  if (input.isInitializing) return 'await-existing';
  return 'start-initialization';
}

async function loadSpeechModule(): Promise<SpeechModule | null> {
  if (!canAttemptCompanionSpeechInput()) return null;

  try {
    return await import('expo-speech-recognition') as SpeechModule;
  } catch {
    return null;
  }
}

export function useCompanionSpeechInput({ onTranscript }: UseCompanionSpeechInputOptions) {
  const canAttemptSpeechInput = canAttemptCompanionSpeechInput();
  const canShowSpeechInput = canShowCompanionSpeechInput();
  const [isAvailable, setIsAvailable] = useState(canShowSpeechInput);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<SpeechInputStatus>(canAttemptSpeechInput ? 'idle' : 'unavailable');
  const [message, setMessage] = useState<string | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const speechModuleRef = useRef<SpeechModule['ExpoSpeechRecognitionModule'] | null>(null);
  const subscriptionsRef = useRef<{ remove: () => void }[]>([]);
  const initializationPromiseRef = useRef<Promise<SpeechModule['ExpoSpeechRecognitionModule'] | null> | null>(null);
  const startListeningInFlightRef = useRef(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  const cleanupSpeechModule = useCallback(() => {
    subscriptionsRef.current.forEach((subscription) => {
      try {
        subscription.remove();
      } catch {
        // Native listener may already be inactive.
      }
    });
    subscriptionsRef.current = [];
    initializationPromiseRef.current = null;
    startListeningInFlightRef.current = false;
    try {
      speechModuleRef.current?.abort();
    } catch {
      // Native module may already be inactive.
    }
    speechModuleRef.current = null;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanupSpeechModule();
    };
  }, [cleanupSpeechModule]);

  const markSpeechUnavailable = useCallback((nextMessage?: string) => {
    setIsAvailable(false);
    setIsListening(false);
    setStatus('unavailable');
    setMessage(nextMessage ?? (
      isExpoGo()
        ? 'Voice input unavailable in Expo Go.'
        : 'Voice input is temporarily unavailable. Please type instead.'
    ));
  }, []);

  const loadAndRegisterSpeechModule = useCallback(async () => {
    const speechModule = (await loadSpeechModule())?.ExpoSpeechRecognitionModule ?? null;
    if (!isMountedRef.current) return null;
    if (!speechModule) {
      markSpeechUnavailable();
      return null;
    }

    try {
      if (!speechModule.isRecognitionAvailable()) {
        markSpeechUnavailable();
        return null;
      }

      const subscriptions = [
        speechModule.addListener('start', () => {
          setIsListening(true);
          setStatus('listening');
          setMessage(LISTENING_MESSAGE);
        }),
        speechModule.addListener('end', () => {
          setIsListening(false);
          setStatus((current) => (current === 'error' ? current : 'idle'));
          setMessage((current) => (current === LISTENING_MESSAGE ? null : current));
        }),
        speechModule.addListener('result', (event: { isFinal?: boolean; results?: { transcript?: string }[] }) => {
          const transcript = event.results?.[0]?.transcript?.trim();
          if (!transcript) return;
          onTranscriptRef.current(transcript, Boolean(event.isFinal));
          setMessage(event.isFinal ? 'Transcription added. You can edit before sending.' : LISTENING_MESSAGE);
        }),
        speechModule.addListener('error', () => {
          setIsListening(false);
          setStatus('error');
          setMessage('Transcription failed, please type instead.');
        }),
      ];

      subscriptionsRef.current = subscriptions;
      speechModuleRef.current = speechModule;
      setIsAvailable(true);
      setStatus('idle');
      return speechModule;
    } catch {
      cleanupSpeechModule();
      markSpeechUnavailable();
      return null;
    }
  }, [cleanupSpeechModule, markSpeechUnavailable]);

  const ensureSpeechModule = useCallback(async () => {
    const decision = getCompanionSpeechInitializationDecision({
      canAttempt: canAttemptSpeechInput,
      hasModule: !!speechModuleRef.current,
      isInitializing: !!initializationPromiseRef.current,
      isMounted: isMountedRef.current,
    });

    if (decision === 'unavailable') {
      markSpeechUnavailable();
      return null;
    }

    if (decision === 'use-existing') {
      return speechModuleRef.current;
    }

    if (decision === 'await-existing') {
      return initializationPromiseRef.current;
    }

    initializationPromiseRef.current = loadAndRegisterSpeechModule().finally(() => {
      initializationPromiseRef.current = null;
    });
    return initializationPromiseRef.current;
  }, [canAttemptSpeechInput, loadAndRegisterSpeechModule, markSpeechUnavailable]);

  const startListening = useCallback(async () => {
    if (startListeningInFlightRef.current) return;
    startListeningInFlightRef.current = true;
    const speechModule = await ensureSpeechModule();
    if (!speechModule) {
      startListeningInFlightRef.current = false;
      return;
    }

    try {
      const permissions = await speechModule.requestPermissionsAsync();
      if (!isMountedRef.current) return;
      if (!permissions.granted) {
        setStatus('error');
        setMessage('Microphone permission is needed for voice input. You can type instead.');
        return;
      }

      setMessage(LISTENING_MESSAGE);
      setStatus('listening');
      speechModule.start({
        lang: 'en-US',
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        addsPunctuation: true,
        iosVoiceProcessingEnabled: true,
        contextualStrings: ['BPD', 'abandonment', 'rejection', 'trigger', 'Companion', 'therapy', 'therapist'],
      });
    } catch {
      setIsListening(false);
      setStatus('error');
      setMessage('Transcription failed, please type instead.');
    } finally {
      startListeningInFlightRef.current = false;
    }
  }, [ensureSpeechModule]);

  const stopListening = useCallback(() => {
    try {
      speechModuleRef.current?.stop();
      setMessage('Transcription added. You can edit before sending.');
    } catch {
      setIsListening(false);
      setStatus('error');
      setMessage('Transcription failed, please type instead.');
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }
    void startListening();
  }, [isListening, startListening, stopListening]);

  return {
    isAvailable,
    isListening,
    status,
    message,
    startListening,
    stopListening,
    toggleListening,
    clearMessage: () => setMessage(null),
  };
}
