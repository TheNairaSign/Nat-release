import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { ReactNode } from 'react';

/**
 * Port of the web `SnapCardCarousel`
 * (client/src/pages/dashboard/components/SnapCardCarousel.tsx).
 *
 * Cards are a fraction of the **carousel's own width** so the next one peeks,
 * the scroll snaps card by card, and `activeIndex` is two-way bound: tapping a
 * tab scrolls here, swiping reports the new index back.
 *
 * Sizing against the window instead of the measured container is what killed
 * the peek — every page that hosts a carousel adds its own horizontal padding
 * (16 on most screens, 12 on Where), so a window-relative card ends up wider
 * than the space it lives in and nothing is left to show of the next card.
 */
export function SnapCarousel({
  children,
  activeIndex,
  onActiveIndexChange,
  cardWidthRatio = 0.92,
  padLeft = 4,
  padRight,
  gap = 12,
  scaleInactive = false,
  scrollEnabled = true,
}: {
  children: ReactNode[];
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
  /** Web `cardWidth` — fraction of the carousel's width per card. */
  cardWidthRatio?: number;
  /** Web `padLeftClassName`. */
  padLeft?: number;
  /** Web `peekRight`; defaults to `padLeft`. */
  padRight?: number;
  /** Web `gapClassName` (gap-3 = 12). */
  gap?: number;
  /** Web `scaleInactive` — shrinks the non-active card to 0.92. */
  scaleInactive?: boolean;
  /**
   * Set false while a nested horizontal scroller (e.g. the material chips) is
   * being dragged. Web does the same with `chipGestureRef`, locking the outer
   * carousel so a chip swipe cannot slide the whole card.
   */
  scrollEnabled?: boolean;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const [width, setWidth] = useState(0);

  const cardWidth = width > 0 ? Math.round(width * cardWidthRatio) : 0;
  const interval = cardWidth + gap;

  useEffect(() => {
    if (interval <= 0) return;
    scrollRef.current?.scrollTo({ x: activeIndex * interval, animated: true });
  }, [activeIndex, interval]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      scrollEnabled={scrollEnabled}
      showsHorizontalScrollIndicator={false}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      snapToInterval={interval > 0 ? interval : undefined}
      decelerationRate="fast"
      disableIntervalMomentum
      contentContainerStyle={{
        gap,
        paddingLeft: padLeft,
        // Trailing room so the final card can still snap flush.
        paddingRight: padRight ?? padLeft,
      }}
      onMomentumScrollEnd={(event) => {
        if (interval <= 0) return;
        const next = Math.round(event.nativeEvent.contentOffset.x / interval);
        if (next !== activeIndex) onActiveIndexChange(next);
      }}
    >
      {children.map((child, index) => (
        <View
          key={index}
          style={{
            // Before measurement, fall back to full width so the first paint
            // is not a zero-width flash.
            width: cardWidth > 0 ? cardWidth : undefined,
            ...(scaleInactive
              ? { transform: [{ scale: index === activeIndex ? 1 : 0.92 }] }
              : null),
          }}
        >
          {child}
        </View>
      ))}
    </ScrollView>
  );
}
