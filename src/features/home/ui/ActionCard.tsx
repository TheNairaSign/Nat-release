import type { ReactNode } from 'react';
import { Dimensions, Pressable, ScrollView, View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';
import { GradientFill } from '@/shared/ui/GradientFill';
import { ChevronGlyph } from '@/shared/ui/icons/glyphs';

/**
 * Home's action cards, from the prototype (HOME – ActionSlide1 – 8, Nov 2) via web
 * DashboardActionCarousel.tsx, ActionCardButtons.tsx and actionCardTheme.ts.
 */
export const ACTION_CARD_BG = {
  /** "unused items?" (#C8ECEE) */
  green: '#C8ECEE',
  /** groceries (#FBE2B7) */
  orange: '#FBE2B7',
} as const;

/** 252pt on the prototype's 852-tall screen (29.6%), from 196 on short screens. */
const CARD_HEIGHT = Math.min(
  252,
  Math.max(196, Math.round(Dimensions.get('window').height * 0.296)),
);
/** The chip row's gap under the title: clamp(10px, 3.7dvh, 31.5px). */
const CHIPS_TOP = Math.min(
  31.5,
  Math.max(10, Dimensions.get('window').height * 0.037),
);
/** The title's gap from the top on the uncentred card: clamp(18px, 3.4dvh, 34px). */
const CARD_TOP = Math.min(34, Math.max(18, Dimensions.get('window').height * 0.034));

/** "Ask Diva": the prototype's 112° gradient, #C4DDFF → #ACF5FF → #ACFFB9 → #FFDB96. */
const ASK_DIVA_STOPS = [
  { offset: 0, color: '#C4DDFF' },
  { offset: 0.33, color: '#ACF5FF' },
  { offset: 0.66, color: '#ACFFB9' },
  { offset: 1, color: '#FFDB96' },
];

export function ActionCardShell({
  bg,
  greeting,
  title,
  chips,
  buttons,
  centered = false,
  testID,
}: {
  bg: string;
  greeting: string;
  title: string;
  chips: ReactNode;
  buttons: ReactNode;
  /** The text and chips centred in the space above the buttons. */
  centered?: boolean;
  testID?: string;
}) {
  const theme = useTheme();
  return (
    // 39pt corners, everything centred, the buttons straddling the bottom edge.
    <View
      testID={testID}
      style={{
        height: CARD_HEIGHT,
        width: '100%',
        borderRadius: 39,
        backgroundColor: bg,
        alignItems: 'center',
        overflow: 'visible',
        ...(centered ? { justifyContent: 'center', paddingBottom: 7 } : { paddingTop: CARD_TOP }),
      }}
    >
      {greeting ? (
        <Text
          style={{
            fontSize: 16,
            lineHeight: centered ? 18 : 26,
            color: '#1E0D2A',
            textAlign: 'center',
          }}
        >
          {greeting}
        </Text>
      ) : null}
      <Text
        style={{
          maxWidth: 243,
          fontSize: 30,
          lineHeight: 34,
          fontFamily: theme.font.semibold,
          color: '#010B02',
          textAlign: 'center',
        }}
      >
        {title}
      </Text>
      <View style={{ marginTop: CHIPS_TOP, height: 32, width: '100%' }}>{chips}</View>
      {buttons}
    </View>
  );
}

/** Prototype chip: a 32pt pill, 13pt side padding, bold 16. */
export function Chip({
  label,
  bg,
  color,
  onPress,
  selected,
  testID,
}: {
  label: string;
  bg: string;
  color: string;
  onPress: () => void;
  selected: boolean;
  testID?: string;
}) {
  const theme = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        height: 32,
        paddingHorizontal: 13,
        borderRadius: 999,
        backgroundColor: bg,
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 16, lineHeight: 18, fontFamily: theme.font.bold, color }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** The row scrolls to the card's edge; the first chip starts 25pt in, 12pt apart. */
export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 25, gap: 12, alignItems: 'center' }}
    >
      {children}
    </ScrollView>
  );
}

/** "Ask Diva" and a dark button, 46pt tall, straddling the card's bottom edge. */
export function ActionCardButtons({
  onAskDiva,
  secondaryLabel,
  secondaryIcon,
  onSecondary,
}: {
  /** Left out for a card with only the dark button (a guest's "Scan groceries"). */
  onAskDiva?: () => void;
  secondaryLabel: string;
  secondaryIcon?: ReactNode;
  onSecondary: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: -23,
        zIndex: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      {onAskDiva ? (
        <Pressable
          testID="home-ask-diva"
          onPress={onAskDiva}
          style={{
            height: 46,
            width: 124,
            borderRadius: 999,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <GradientFill angle={112} stops={ASK_DIVA_STOPS} />
          <Text style={{ fontSize: 16, fontFamily: theme.font.medium, color: '#010B02' }}>
            Ask Diva
          </Text>
        </Pressable>
      ) : null}
      <Pressable
        testID="home-secondary"
        onPress={onSecondary}
        style={{
          height: 46,
          ...(secondaryIcon ? { paddingHorizontal: 20 } : { width: 124, paddingHorizontal: 8 }),
          borderRadius: 999,
          backgroundColor: '#1C0F28',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {secondaryIcon}
        <Text
          numberOfLines={1}
          style={{
            fontSize: !secondaryIcon && secondaryLabel.length > 11 ? 15 : 16,
            fontFamily: theme.font.medium,
            color: '#FAFFEF',
          }}
        >
          {secondaryLabel}
        </Text>
      </Pressable>
    </View>
  );
}

/** Stands in for the buttons until a chip is picked: 253×27, just inside the card. */
export function ActionCardPrompt({ text }: { text: string }) {
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 21,
        zIndex: 20,
        alignItems: 'center',
      }}
    >
      <View
        style={{
          height: 27,
          width: 253,
          borderRadius: 999,
          backgroundColor: '#F5F3E9',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 20,
        }}
      >
        <ChevronGlyph color="#010B02" size={14} direction="up" />
        <Text style={{ fontSize: 15, color: '#010B02' }}>{text}</Text>
      </View>
    </View>
  );
}
