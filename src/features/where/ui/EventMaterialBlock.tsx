import { View } from 'react-native';

import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui/Text';

/**
 * Port of client/src/pages/dashboard/where/components/EventMaterialBlock.tsx
 * (web commits 0f2dd19 / aa5d04f — "Style event popup materials like location
 * card chips" / "Use location card green material block on event popup").
 *
 * Events previously listed their materials as a plain "Accepted: a, b, c" line
 * on mobile; web now renders the same lime chip block the location cards use.
 */
function formatMaterialLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  if (trimmed.toLowerCase() === 'all') return 'All materials';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/** Mirrors web's `normalizeMaterialList`. */
export function eventMaterialList(materials: string[]): string[] {
  if (materials.length === 0) return [];
  if (materials.some((entry) => entry.trim().toLowerCase() === 'all')) {
    return ['All materials'];
  }
  return materials.map((entry) => entry.trim()).filter(Boolean);
}

export function EventMaterialBlock({ materials }: { materials: string[] }) {
  const theme = useTheme();
  const list = eventMaterialList(materials);
  if (list.length === 0) return null;

  return (
    <View
      style={{
        // web: rounded-2xl bg-[#D1FF52]/35 px-2.5 py-2.5
        borderRadius: theme.radius.lg,
        backgroundColor: 'rgba(209,255,82,0.35)',
        paddingHorizontal: 10,
        paddingVertical: 10,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {list.map((entry) => (
          <View
            key={entry}
            style={{
              // web: px-3 py-1 rounded-full bg-[#D1FF52] border-[#B8E83A]/80
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: theme.radius.pill,
              backgroundColor: '#D1FF52',
              borderWidth: 1,
              borderColor: 'rgba(184,232,58,0.8)',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: theme.font.semibold,
                color: '#1A1A1A',
              }}
            >
              {formatMaterialLabel(entry)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
