import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';

/**
 * The three bouncing dots web shows while the assistant is composing
 * (`AiChat.tsx:966-971`): `w-2 h-2 bg-slate-300 rounded-full animate-bounce`
 * with -0.3s / -0.15s / 0s delays.
 *
 * Mobile previously only flipped the header subtitle to "Typing…", so there
 * was no in-thread indication that a reply was coming.
 *
 * Uses RN's Animated rather than Reanimated: this renders inside the chat
 * tests, and Reanimated's worklets runtime is not available under Jest.
 */
const DOT = 8;
const SLATE_300 = '#CBD5E1';

function Dot({ delay }: { delay: number }) {
  // Lazy useState rather than useRef: the React Compiler lint forbids reading
  // `ref.current` during render, and the value must be created only once.
  const [offset] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(offset, {
          toValue: -4,
          duration: 350,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(offset, {
          toValue: 0,
          duration: 350,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [delay, offset]);

  return (
    <Animated.View
      style={{
        width: DOT,
        height: DOT,
        borderRadius: DOT / 2,
        backgroundColor: SLATE_300,
        transform: [{ translateY: offset }],
      }}
    />
  );
}

export function TypingDots() {
  return (
    <View
      testID="ai-typing"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 32,
        paddingHorizontal: 4,
      }}
    >
      {[0, 150, 300].map((delay) => (
        <Dot key={delay} delay={delay} />
      ))}
    </View>
  );
}
