import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from './Text';

/** Anything with a number on the photo and a box (0..1 of the image) to put it on. */
export type TaggedItem = {
  tag: number;
  box: { x_min: number; y_min: number; x_max: number; y_max: number };
};

/**
 * A photo shown whole, with each item's numbered dot on it (web TaggedPhoto.tsx): the
 * Grocery Manager's cart and SnapDivert's snaps both use it. A blurred copy fills the
 * frame behind, so an odd-shaped photo leaves no black bands.
 */
export function TaggedPhoto({
  src,
  items,
  activeTag,
  onTagTap,
}: {
  src: string;
  items: TaggedItem[];
  activeTag?: number | null;
  /** Makes each number a button, e.g. to take a wrong detection out. */
  onTagTap?: (tag: number) => void;
}) {
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const scale =
    natural.width && natural.height && frame.width && frame.height
      ? Math.min(frame.width / natural.width, frame.height / natural.height)
      : 0;
  const fitted = { width: natural.width * scale, height: natural.height * scale };

  return (
    <View
      style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
      onLayout={(e) => setFrame(e.nativeEvent.layout)}
    >
      <Image source={{ uri: src }} blurRadius={24} style={[StyleSheet.absoluteFill, { opacity: 0.6 }]} resizeMode="cover" />
      <View style={scale ? fitted : { width: '100%', height: '100%' }}>
        <Image
          testID="tagged-photo"
          source={{ uri: src }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
          onLoad={(e) => {
            const { width, height } = e.nativeEvent.source;
            setNatural({ width, height });
          }}
        />
        {scale > 0
          ? items.map((item) => {
              const active = activeTag === item.tag;
              const size = active ? 36 : 28;
              const left = ((item.box.x_min + item.box.x_max) / 2) * fitted.width - size / 2;
              const top = ((item.box.y_min + item.box.y_max) / 2) * fitted.height - size / 2;
              return (
                <Pressable
                  key={item.tag}
                  testID={`tag-${item.tag}`}
                  disabled={!onTagTap}
                  accessibilityLabel={onTagTap ? `Item ${item.tag}: not food? Tap to remove` : `Item ${item.tag}`}
                  onPress={() => onTagTap?.(item.tag)}
                  style={{
                    position: 'absolute',
                    left,
                    top,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: '#D1FF52',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: active ? 3 : 0,
                    borderColor: '#ffffff',
                    shadowColor: '#000',
                    shadowOpacity: 0.35,
                    shadowRadius: 4,
                    shadowOffset: { width: 0, height: 2 },
                    elevation: 3,
                  }}
                >
                  <Text style={{ fontSize: active ? 15 : 13, fontWeight: '700', color: '#14361B' }}>{item.tag}</Text>
                </Pressable>
              );
            })
          : null}
      </View>
    </View>
  );
}
