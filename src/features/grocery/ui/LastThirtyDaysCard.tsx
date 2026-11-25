import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { buyLessText, foodName, type GroceryFoodWaste, wastedText } from '@/core/grocery';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';
import { ChevronDownGlyph } from '@/shared/ui/icons/featherGlyphs';

/** One side of the split bar, 23 tall, with a faint highlight running along it. */
function Bar({ color, grow }: { color: string; grow: number }) {
  return (
    <View
      style={{
        flexGrow: grow,
        flexBasis: 0,
        minWidth: 23,
        height: 23,
        borderRadius: 12,
        backgroundColor: color,
        boxShadow: '0 3px 6px rgba(0,0,0,0.16)',
      }}
    >
      <View
        style={{
          position: 'absolute',
          left: 8,
          right: 9,
          top: 8,
          height: 6,
          borderRadius: 3,
          backgroundColor: 'rgba(255,255,255,0.2)',
        }}
      />
    </View>
  );
}

/**
 * "Last 30 days" (prototype Flow 3, "Current list"; web components/grocery/
 * LastThirtyDaysCard): a 150-tall card at 45% #F0EFF0, the diverted share large on the
 * left with "Diverted" beside it, the landfilled share small and red on the right, and a
 * split bar under them — green for diverted, red for landfilled.
 *
 * "What went to waste" opens the card (Nov 25 meeting: an expanded panel, not a new tab):
 * the foods wasted most, and what to buy less of.
 */
export function LastThirtyDaysCard({
  share,
  foods,
  buyLess = [],
}: {
  share: number;
  /** Absent from older servers: then the card doesn't open. */
  foods?: GroceryFoodWaste[];
  buyLess?: GroceryFoodWaste[];
}) {
  const theme = useTheme();
  const diverted = Math.round(Math.min(1, Math.max(0, share)) * 100);
  const landfilled = 100 - diverted;
  const [open, setOpen] = useState(false);

  return (
    <View
      testID="grocery-stats"
      style={{
        marginHorizontal: -3,
        marginTop: 6,
        borderRadius: 38,
        backgroundColor: 'rgba(240,239,240,0.45)',
      }}
    >
      <View style={{ height: 150 }}>
        <Text style={{ position: 'absolute', left: 49, top: 18, fontSize: 12, lineHeight: 14, color: '#1E0D2A' }}>
          Last 30 days
        </Text>

        <View style={{ position: 'absolute', left: 52, top: 45, flexDirection: 'row', alignItems: 'center', gap: 26 }}>
          <Text style={{ fontSize: 34, lineHeight: 38, fontFamily: theme.font.bold, letterSpacing: -1.36, color: '#1E0D2A' }}>
            {diverted}%
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 17, fontFamily: theme.font.bold, color: '#000000' }}>Diverted</Text>
        </View>

        {/* Web: 52 wide at right 49. 62 wide here (so "landfilled" never wraps in the app's
            font), moved 5 right to keep the same centre. */}
        <Text
          style={{
            position: 'absolute',
            right: 44,
            top: 41,
            width: 62,
            textAlign: 'center',
            fontSize: 12,
            lineHeight: 14,
            fontFamily: theme.font.bold,
            color: '#9F2530',
          }}
        >
          {`${landfilled}%\nlandfilled`}
        </Text>

        {/* Green reads first, so it sits on the left. */}
        <View style={{ position: 'absolute', left: 29, right: 31, top: 88, flexDirection: 'row', gap: 2 }}>
          {diverted > 0 ? <Bar color="#0A5A14" grow={diverted} /> : null}
          {landfilled > 0 ? <Bar color="#B72735" grow={landfilled} /> : null}
        </View>

        {foods ? (
          <Pressable
            testID="grocery-stats-toggle"
            onPress={() => setOpen((v) => !v)}
            accessibilityRole="button"
            accessibilityState={{ expanded: open }}
            hitSlop={8}
            style={{
              position: 'absolute',
              left: 41,
              top: 115,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}
          >
            <Text style={{ fontSize: 12, lineHeight: 16, fontFamily: theme.font.bold, color: '#1E0D2A' }}>
              {open ? 'Hide' : 'What went to waste'}
            </Text>
            <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
              <ChevronDownGlyph color="#1E0D2A" size={14} />
            </View>
          </Pressable>
        ) : null}
      </View>

      {foods && open ? (
        <View testID="grocery-stats-panel" style={{ paddingHorizontal: 29, paddingBottom: 36, paddingTop: 4 }}>
          {foods.length === 0 ? (
            <Text style={{ paddingHorizontal: 20, fontSize: 13, lineHeight: 17, color: '#1E0D2A' }}>
              Nothing went to waste in the last 30 days.
            </Text>
          ) : (
            <>
              <Text style={{ paddingHorizontal: 20, fontSize: 12, lineHeight: 14, color: '#1E0D2A' }}>Most wasted</Text>
              <View style={{ marginTop: 10, gap: 6 }}>
                {foods.map((food) => (
                  <View
                    key={food.label}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 12,
                      borderRadius: 18,
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      paddingHorizontal: 20,
                      paddingVertical: 10,
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{ flexShrink: 1, fontSize: 14, lineHeight: 17, fontFamily: theme.font.bold, color: '#1E0D2A' }}
                    >
                      {foodName(food)}
                    </Text>
                    <Text style={{ fontSize: 12, lineHeight: 14, fontFamily: theme.font.bold, color: '#9F2530' }}>
                      {wastedText(food)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {buyLess.length > 0 ? (
            <View
              style={{ marginTop: 12, borderRadius: 22, backgroundColor: '#1E0D2A', paddingHorizontal: 20, paddingVertical: 14 }}
            >
              <Text style={{ fontSize: 12, lineHeight: 14, fontFamily: theme.font.bold, color: '#D3FD5D' }}>Next shop</Text>
              <View style={{ marginTop: 6, gap: 4 }}>
                {buyLess.map((food) => (
                  <Text key={food.label} style={{ fontSize: 13, lineHeight: 17, color: '#FFFFFF' }}>
                    {buyLessText(food)}
                  </Text>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
