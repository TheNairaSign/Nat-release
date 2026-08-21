import { Pressable, ScrollView, TextInput, View } from 'react-native';

import type { WherePlace } from '@/core/where';
import { useTheme } from '@/shared/theme';
import { CloseGlyph, SearchGlyph } from '@/shared/ui/icons/glyphs';
import { Text } from '@/shared/ui/Text';

export function MapSearchPanel({
  query,
  onQuery,
  onCancel,
  results,
  onSelect,
}: {
  query: string;
  onQuery: (value: string) => void;
  onCancel: () => void;
  results: WherePlace[];
  onSelect: (place: WherePlace) => void;
}) {
  const theme = useTheme();
  const hasQuery = query.trim().length > 0;

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderRadius: theme.radius.pill,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.1)',
          }}
        >
          <SearchGlyph color={theme.color.textMuted} />
          <TextInput
            testID="where-search-input"
            value={query}
            onChangeText={onQuery}
            placeholder="Search…"
            placeholderTextColor={theme.color.placeholder}
            autoFocus
            style={{
              flex: 1,
              fontSize: 14,
              color: theme.color.text,
              fontFamily: theme.font.regular,
              padding: 0,
            }}
          />
          {hasQuery ? (
            <Pressable accessibilityRole="button" onPress={() => onQuery('')}>
              <CloseGlyph color={theme.color.textMuted} size={16} />
            </Pressable>
          ) : null}
        </View>
        <Pressable testID="where-search-cancel" onPress={onCancel}>
          <Text
            variant="small"
            style={{ fontFamily: theme.font.semibold, color: theme.color.ink }}
          >
            Cancel
          </Text>
        </Pressable>
      </View>
      <Text
        style={{ fontSize: 11, color: theme.color.textMuted, lineHeight: 16 }}
      >
        Search by location name, material (plastic, food…), organization, or
        event. Browse nearby below.
      </Text>
      <View
        style={{
          maxHeight: 280,
          borderRadius: theme.radius.lg,
          backgroundColor: 'rgba(255,255,255,0.85)',
          borderWidth: 1,
          borderColor: 'rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        <Text
          style={{
            fontSize: 10,
            fontFamily: theme.font.bold,
            color: theme.color.textMuted,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            paddingHorizontal: 16,
            paddingTop: 10,
          }}
        >
          {hasQuery ? `Results (${results.length})` : 'Nearby (closest first)'}
        </Text>
        {results.length === 0 ? (
          <Text
            muted
            variant="small"
            style={{ textAlign: 'center', padding: 24 }}
          >
            {hasQuery ? 'No results found' : 'No locations loaded yet'}
          </Text>
        ) : (
          <ScrollView>
            {results.map((place) => (
              <Pressable
                key={`${place.kind}-${place.id}`}
                testID={`where-search-result-${place.id}`}
                onPress={() => onSelect(place)}
                style={{ paddingHorizontal: 16, paddingVertical: 10 }}
              >
                <Text
                  variant="small"
                  style={{ fontFamily: theme.font.semibold }}
                  numberOfLines={1}
                >
                  {place.name}
                </Text>
                <Text variant="caption" muted numberOfLines={1}>
                  {place.tag ?? place.kind}
                  {place.address ? ` · ${place.address}` : ''}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
