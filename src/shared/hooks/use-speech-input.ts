import { useCallback, useEffect, useRef, useState } from 'react';

import type { SpeechError } from '@/shared/ports/speech';

import { usePorts } from './use-ports';

/**
 * Speech to text for a text box (web hooks/useSpeechInput.ts): tap to start, speak, and
 * the words appear as you go; it stops by itself after a pause, or on a second tap.
 * Nothing is sent: the person checks the text and sends it themselves.
 */
export function useSpeechInput(onText: (text: string) => void) {
  const { speech } = usePorts();
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<SpeechError | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  useEffect(() => () => stopRef.current?.(), []);

  const start = useCallback(async () => {
    setError(null);
    setListening(true);
    stopRef.current = await speech.listen({
      onText: (text) => onTextRef.current(text),
      onEnd: () => {
        stopRef.current = null;
        setListening(false);
      },
      onError: setError,
    });
  }, [speech]);

  const toggle = useCallback(() => {
    if (listening) stopRef.current?.();
    else void start();
  }, [listening, start]);

  return { listening, error, toggle };
}
