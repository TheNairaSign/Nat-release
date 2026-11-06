/** Web hooks/useSpeechInput SpeechError: why listening didn't work. */
export type SpeechError = 'unsupported' | 'denied' | 'no-speech' | 'failed';

export type ListenHandlers = {
  /** The words so far, replaced as they firm up. */
  onText: (text: string) => void;
  /** Listening finished (a pause, a second tap, or an error). */
  onEnd: () => void;
  onError: (error: SpeechError) => void;
};

export interface Speech {
  /**
   * Speech to text: starts listening (asking for the microphone the first time) and
   * stops by itself after a pause. Resolves to a function that stops it early.
   */
  listen(handlers: ListenHandlers): Promise<() => void>;
  /**
   * Plays a prompt in our own voice from the scan service (`POST <url>` with the text).
   * Resolves true once it has played, false when the service says to use the phone's
   * voice instead (204) or anything goes wrong.
   */
  playVoice(request: { url: string; token: string; text: string }): Promise<boolean>;
  /** Says the text with the phone's own voice; resolves when it has finished. */
  say(text: string): Promise<void>;
  stopSaying(): void;
}
