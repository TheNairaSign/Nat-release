import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { fetch as expoFetch } from 'expo/fetch';
import { File, Paths } from 'expo-file-system';
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

const EXTENSIONS: Record<string, string> = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/ogg': 'ogg',
  'audio/aac': 'aac',
  'audio/mp4': 'm4a',
};

/** A short stable name for a prompt, so the same phrase reuses its cached file. */
function promptName(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return `prompt-${(hash >>> 0).toString(36)}`;
}

export function createExpoSpeech(): Speech {
  let player: AudioPlayer | null = null;
  let audioReady = false;

  return {
    async playVoice({ url, token, text }) {
      try {
        if (!audioReady) {
          // Plays even with the phone on silent, as a spoken question should.
          await setAudioModeAsync({ playsInSilentMode: true });
          audioReady = true;
        }
        const response = await expoFetch(url, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        if (response.status === 204 || !response.ok) return false;
        const type = (response.headers.get('content-type') ?? 'audio/mpeg').split(';')[0]!.trim();
        const file = new File(Paths.cache, `${promptName(text)}.${EXTENSIONS[type] ?? 'mp3'}`);
        file.write(new Uint8Array(await response.arrayBuffer()));
        player?.remove();
        const current = createAudioPlayer({ uri: file.uri });
        player = current;
        await new Promise<void>((resolve) => {
          const sub = current.addListener('playbackStatusUpdate', (status) => {
            if (status.didJustFinish) {
              sub.remove();
              resolve();
            }
          });
          current.play();
          // Never wait forever on a clip that doesn't report finishing.
          setTimeout(() => {
            sub.remove();
            resolve();
          }, 15_000);
        });
        return true;
      } catch {
        return false;
      }
    },
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
      player?.pause();
    },
  };
}
