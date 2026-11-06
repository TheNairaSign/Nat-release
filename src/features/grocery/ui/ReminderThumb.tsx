import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable } from 'react-native';

import { URGENCY_STYLES, type Urgency } from '@/core/grocery';
import { BellOffGlyph, BellOnGlyph } from '@/shared/ui/icons/groceryGlyphs';

/**
 * The reminder switch on a grocery card (web ReminderThumb.tsx): a tall white track with
 * a black edge, the thumb dropping to the bottom in the card's deeper shade when on.
 * Regular 4.1×2.3rem (66×37), compact 3.4×2rem for the scanner's list.
 */
export function ReminderThumb({
  on,
  urgency,
  onToggle,
  disabled,
  size = 'regular',
}: {
  on: boolean;
  urgency: Urgency;
  onToggle: () => void;
  disabled?: boolean;
  size?: 'regular' | 'compact';
}) {
  const styles = URGENCY_STYLES[urgency];
  const compact = size === 'compact';
  const travel = compact ? 14.4 : 17.6;
  const [offset] = useState(() => new Animated.Value(on ? travel : 0));

  useEffect(() => {
    Animated.timing(offset, {
      toValue: on ? travel : 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [on, travel, offset]);

  return (
    <Pressable
      testID="grocery-reminder"
      accessibilityRole="switch"
      accessibilityState={{ checked: on, disabled }}
      accessibilityLabel={on ? 'Reminders on' : 'Reminders off'}
      disabled={disabled}
      onPress={onToggle}
      style={{
        width: compact ? 32 : 37,
        height: compact ? 54 : 66,
        borderRadius: 15,
        borderWidth: 1.5,
        borderColor: '#000000',
        backgroundColor: '#ffffff',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Animated.View
        style={{
          position: 'absolute',
          left: -1.5,
          right: -1.5,
          top: -1.5,
          height: compact ? 40 : 48,
          borderRadius: 15,
          borderWidth: 1.5,
          borderColor: '#000000',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: on ? styles.thumb : '#E2E8F0',
          transform: [{ translateY: offset }],
        }}
      >
        {on ? (
          <BellOnGlyph color={styles.thumbIcon} size={compact ? 16 : 18} />
        ) : (
          <BellOffGlyph color="#64748B" size={compact ? 16 : 18} />
        )}
      </Animated.View>
    </Pressable>
  );
}
