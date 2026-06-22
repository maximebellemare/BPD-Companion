import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

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

const ENABLE_COMPANION_SPEECH_INPUT = __DEV__;

function loadSpeechModule(): SpeechModule | null {
  if (!ENABLE_COMPANION_SPEECH_INPUT || Platform.OS === 'web') return null;

  try {
    return require('expo-speech-recognition') as SpeechModule;
  } catch {
    return null;
  }
}

export function useCompanionSpeechInput({ onTranscript }: UseCompanionSpeechInputOptions) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState<SpeechInputStatus>('unavailable');
  const [message, setMessage] = useState<string | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  const speechModuleRef = useRef<SpeechModule['ExpoSpeechRecognitionModule'] | null>(null);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const speechModule = loadSpeechModule()?.ExpoSpeechRecognitionModule ?? null;
    speechModuleRef.current = speechModule;

    if (!speechModule) {
      setIsAvailable(false);
      setStatus('unavailable');
      return undefined;
    }

    try {
      const available = speechModule.isRecognitionAvailable();
      setIsAvailable(available);
      setStatus(available ? 'idle' : 'unavailable');
    } catch {
      setIsAvailable(false);
      setStatus('unavailable');
      return undefined;
    }

    const subscriptions = [
      speechModule.addListener('start', () => {
        setIsListening(true);
        setStatus('listening');
        setMessage('Listening… tap to stop');
      }),
      speechModule.addListener('end', () => {
        setIsListening(false);
        setStatus((current) => (current === 'error' ? current : 'idle'));
        setMessage((current) => (current === 'Listening… tap to stop' ? null : current));
      }),
      speechModule.addListener('result', (event: { isFinal?: boolean; results?: Array<{ transcript?: string }> }) => {
        const transcript = event.results?.[0]?.transcript?.trim();
        if (!transcript) return;
        onTranscriptRef.current(transcript, Boolean(event.isFinal));
        setMessage(event.isFinal ? 'Transcription added. You can edit before sending.' : 'Listening… tap to stop');
      }),
      speechModule.addListener('error', () => {
        setIsListening(false);
        setStatus('error');
        setMessage('Transcription failed, please type instead.');
      }),
    ];

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
      try {
        speechModule.abort();
      } catch {
        // Native module may already be inactive.
      }
    };
  }, []);

  const startListening = useCallback(async () => {
    const speechModule = speechModuleRef.current;
    if (!speechModule || !isAvailable) {
      setStatus('unavailable');
      setMessage('Voice input is temporarily unavailable. Please type instead.');
      return;
    }

    try {
      const permissions = await speechModule.requestPermissionsAsync();
      if (!permissions.granted) {
        setStatus('error');
        setMessage('Microphone permission is needed for voice input. You can type instead.');
        return;
      }

      setMessage('Listening… tap to stop');
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
    }
  }, [isAvailable]);

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
