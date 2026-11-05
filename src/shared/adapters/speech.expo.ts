import * as ExpoSpeech from 'expo-speech';

import type { ListenHandlers, Speech, SpeechError } from '@/shared/ports/speech';

type RecognitionModule =
  typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule;

/**
 * Speech recognition is a native module that only a development or store build has;
 * Expo Go doesn't, so it is loaded lazily and its absence reads as "unsupported".
 */
function recognition(): RecognitionModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-speech-recognition').ExpoSpeechRecognitionModule ?? null;
  } catch {
    return null;
  }
}

function errorOf(code: string): SpeechError {
  if (code === 'not-allowed' || code === 'service-not-allowed') return 'denied';
  if (code === 'no-speech' || code === 'speech-timeout') return 'no-speech';
  return 'failed';
}

export function createExpoSpeech(): Speech {
  return {
    async listen({ onText, onEnd, onError }: ListenHandlers) {
      const module = recognition();
      if (!module || !module.isRecognitionAvailable()) {
        onError('unsupported');
        onEnd();
        return () => {};
      }
      const permission = await module.requestPermissionsAsync().catch(() => null);
      if (!permission?.granted) {
        onError('denied');
        onEnd();
        return () => {};
      }
      const subs = [
        module.addListener('result', (event) => {
          onText(event.results[0]?.transcript ?? '');
        }),
        module.addListener('error', (event) => {
          if (event.error !== 'aborted') onError(errorOf(event.error));
        }),
        module.addListener('end', () => {
          subs.forEach((sub) => sub.remove());
          onEnd();
        }),
      ];
      module.start({ lang: 'en-US', interimResults: true, continuous: false });
      return () => module.stop();
    },
    say(text: string) {
      return new Promise<void>((resolve) => {
        ExpoSpeech.speak(text, {
          language: 'en-US',
          onDone: () => resolve(),
          onStopped: () => resolve(),
          onError: () => resolve(),
        });
      });
    },
    stopSaying() {
      void ExpoSpeech.stop();
    },
  };
}
