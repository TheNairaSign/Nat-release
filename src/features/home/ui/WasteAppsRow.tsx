import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import { dueThisWeek, type GroceryItem } from '@/core/grocery';
import { useTheme } from '@/shared/theme';
import { Text } from '@/shared/ui';
import {
  EVENTS_BIN_SVG,
  GROCERY_MANAGER_SVG,
  SNAPDIVERT_SVG,
  WHERE_MAP_SVG,
} from '@/shared/ui/icons/homeAppIcons';

type Glance =
  | { state: 'loading' }
  | { state: 'empty' }
  | { state: 'calm' }
  | { state: 'due'; count: number };

/** How much food is about to go off (web useGroceryGlance). */
export function groceryGlance(items: GroceryItem[] | null): Glance {
  if (items === null) return { state: 'loading' };
  if (items.length === 0) return { state: 'empty' };
  const count = dueThisWeek(items).reduce((sum, item) => sum + (item.quantity ?? 1), 0);
  return count > 0 ? { state: 'due', count } : { state: 'calm' };
}

function groceryCopy(glance: Glance): string {
  switch (glance.state) {
    case 'loading':
      return 'Checking your groceries…';
    case 'empty':
      return 'Scan your groceries';
    case 'calm':
      return 'Nothing expiring this week';
    case 'due':
      return glance.count === 1 ? '1 item is expiring' : `${glance.count} items are expiring`;
  }
}

/** The red count on a card's top edge: #DC3545, 28pt, white 14, 113pt in, 21pt up. */
function Badge({ count }: { count: number }) {
  const theme = useTheme();
  return (
    <View
      style={{
        position: 'absolute',
        top: -21,
        left: 113,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#DC3545',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 14, fontFamily: theme.font.medium, color: '#ffffff' }}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
}

/**
 * A waste app (prototype HOME – ActionSlide1 – 8): a white 152×77 card with 23pt
 * corners, a 65pt coloured tile 5pt in holding the icon, then a line of what's new
 * (12pt black) and the app's name (10pt, #1E0D2A at 26%).
 */
function AppCard({
  testID,
  tile,
  icon,
  text,
  label,
  badge,
  onPress,
}: {
  testID: string;
  tile: string;
  icon: ReactNode;
  text: string;
  label: string;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={{
        height: 77,
        width: 152,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 23,
        backgroundColor: '#ffffff',
        paddingLeft: 5,
        paddingRight: 6,
      }}
    >
      <View
        style={{
          width: 65,
          height: 65,
          borderRadius: 21,
          backgroundColor: tile,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1, minWidth: 0, paddingTop: 9 }}>
        <Text style={{ fontSize: 12, lineHeight: 14, color: '#000000' }}>{text}</Text>
        <Text style={{ marginTop: 4, fontSize: 10, lineHeight: 12, color: 'rgba(30,13,42,0.26)' }}>
          {label}
        </Text>
      </View>
      {badge ? <Badge count={badge} /> : null}
    </Pressable>
  );
}

/** A bare 65pt tile (Where, Events). */
function Tile({
  testID,
  label,
  color,
  icon,
  onPress,
}: {
  testID: string;
  label: string;
  color: string;
  icon: ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        width: 65,
        height: 65,
        borderRadius: 21,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {icon}
    </Pressable>
  );
}

/**
 * Home's row of waste apps, under the action cards: Grocery Manager, SnapDivert, then
 * the Where map and Events. Scrolls sideways. Web WasteAppsDash.tsx (Nov 4).
 */
export function WasteAppsRow({
  groceries,
  onGrocery,
  onSnapDivert,
  onWhere,
  onEvents,
}: {
  groceries: GroceryItem[] | null;
  onGrocery: () => void;
  onSnapDivert: () => void;
  onWhere: () => void;
  onEvents: () => void;
}) {
  const glance = groceryGlance(groceries);
  return (
    // 79pt from the cards above on the prototype's screen, badges included.
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -16, marginTop: 12 }}
      contentContainerStyle={{
        paddingHorizontal: 15,
        paddingTop: 21,
        paddingBottom: 8,
        gap: 11,
        alignItems: 'center',
      }}
    >
      <AppCard
        testID="home-app-grocery"
        tile="rgba(255, 210, 139, 0.584)"
        icon={<SvgXml xml={GROCERY_MANAGER_SVG} width={27.66} height={32.54} />}
        text={groceryCopy(glance)}
        label="Grocery man."
        badge={glance.state === 'due' ? glance.count : undefined}
        onPress={onGrocery}
      />
      <AppCard
        testID="home-app-snapdivert"
        tile="#D1E1FF"
        icon={<SvgXml xml={SNAPDIVERT_SVG} width={40.96} height={33.64} />}
        text="Snap it to find reuse"
        label="SnapDivert"
        onPress={onSnapDivert}
      />
      <Tile
        testID="home-app-where"
        label="Where map"
        color="#E6F9B0"
        icon={<SvgXml xml={WHERE_MAP_SVG} width={28} height={28} />}
        onPress={onWhere}
      />
      <Tile
        testID="home-app-events"
        label="Events"
        color="#C3F2C9"
        icon={<SvgXml xml={EVENTS_BIN_SVG} width={26} height={28} />}
        onPress={onEvents}
      />
    </ScrollView>
  );
}
