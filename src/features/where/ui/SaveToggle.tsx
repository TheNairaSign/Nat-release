import { Pressable } from 'react-native';

import { HeartGlyph, HeartOutlineGlyph } from '@/shared/ui/icons/whereGlyphs';

/** Web's SaveToggleButton: a heart that bookmarks a WHERE location or event. */
export function SaveToggle({
  saved,
  busy,
  onToggle,
}: {
  saved: boolean;
  busy?: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      testID="where-save"
      accessibilityRole="button"
      accessibilityState={{ selected: saved, busy: Boolean(busy) }}
      accessibilityLabel={saved ? 'Remove from My Places' : 'Save to My Places'}
      disabled={busy}
      onPress={onToggle}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: saved ? '#fecdd3' : 'rgba(0,0,0,0.08)',
        backgroundColor: saved ? '#fff1f2' : '#ffffff',
        opacity: busy ? 0.5 : 1,
      }}
    >
      {saved ? <HeartGlyph color="#f43f5e" size={15} /> : <HeartOutlineGlyph color="#94a3b8" size={15} />}
    </Pressable>
  );
}
