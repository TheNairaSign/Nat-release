import { useMemo, useState } from 'react';
import { Dimensions, View } from 'react-native';

import {
  daysUntil,
  expiringChips,
  recycleHref,
  type GroceryItem,
} from '@/core/grocery';
import { SnapCarousel } from '@/shared/ui/SnapCarousel';
import { Text } from '@/shared/ui';
import { CameraGlyph } from '@/shared/ui/icons/featherGlyphs';

import {
  ACTION_CARD_BG,
  ActionCardButtons,
  ActionCardPrompt,
  ActionCardShell,
  Chip,
  ChipRow,
} from './ActionCard';

const WINDOW_W = Dimensions.get('window').width;

/**
 * Home's two action cards, swiped sideways (web DashboardActionCarousel.tsx, Nov 2):
 * "unused items?" with material chips, and the food card with the person's expiring
 * groceries (or, with none, "start scanning"). The food card leads when there are
 * groceries, or when they're outside the map's states, where it still works.
 */
export function HomeActionCards({
  guest,
  materialsLoading,
  materials,
  selectedMaterial,
  onSelectMaterial,
  groceries,
  outsideCoverage,
  onAskHowTo,
  onFindWhere,
  onAskAboutGroceries,
  onNavigate,
  onStartScanning,
}: {
  guest: boolean;
  materialsLoading: boolean;
  materials: string[];
  selectedMaterial: string | null;
  onSelectMaterial: (item: string) => void;
  /** Null while loading; empty for a guest or with none. */
  groceries: GroceryItem[] | null;
  outsideCoverage: boolean;
  onAskHowTo: (question: string) => void;
  onFindWhere: (material: string | null) => void;
  onAskAboutGroceries: (items: GroceryItem[]) => void;
  onNavigate: (href: string) => void;
  onStartScanning: () => void;
}) {
  const [active, setActive] = useState(0);
  const [pickIds, setPickIds] = useState<string[]>([]);

  const expiring = useMemo(
    () => (groceries && groceries.length > 0 ? expiringChips(groceries) : null),
    [groceries],
  );
  const picked = expiring ? expiring.filter((item) => pickIds.includes(item._id)) : [];
  const toggle = (id: string) =>
    setPickIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );

  const disposeCard = (
    <ActionCardShell
      key="dispose"
      testID="home-card-dispose"
      bg={ACTION_CARD_BG.green}
      centered
      greeting="How are you diverting these"
      title="unused items?"
      chips={
        materialsLoading ? (
          <View />
        ) : (
          <ChipRow>
            {materials.map((item) => {
              const on = selectedMaterial === item;
              // Flow 3: #A1D2D5 with black text; deep #010B02 with #A1D2D5 once picked.
              return (
                <Chip
                  key={item}
                  testID={`home-material-${item}`}
                  label={item.toLowerCase()}
                  selected={on}
                  bg={on ? '#010B02' : '#A1D2D5'}
                  color={on ? '#A1D2D5' : '#000000'}
                  onPress={() => onSelectMaterial(item)}
                />
              );
            })}
          </ChipRow>
        )
      }
      buttons={
        selectedMaterial ? (
          <ActionCardButtons
            onAskDiva={() => onAskHowTo(`How do I dispose of ${selectedMaterial}?`)}
            secondaryLabel="Find where"
            onSecondary={() => onFindWhere(selectedMaterial)}
          />
        ) : (
          <ActionCardPrompt text="select material for options" />
        )
      }
    />
  );

  const groceryChips = expiring ? (
    <ChipRow>
      {expiring.map((item) => {
        const expired = daysUntil(item.expiresOn) < 0;
        const on = pickIds.includes(item._id);
        // Tan while in date, red tint once past it; deep when picked.
        const bg = expired ? (on ? '#DC3545' : 'rgba(220,53,69,0.23)') : on ? '#010B02' : '#E1D0A8';
        const color = expired ? (on ? '#FAFFEF' : '#AC0056') : on ? '#FBE2B7' : '#000000';
        return (
          <Chip
            key={item._id}
            testID={`home-grocery-${item._id}`}
            label={item.name.charAt(0).toUpperCase() + item.name.slice(1)}
            selected={on}
            bg={bg}
            color={color}
            onPress={() => toggle(item._id)}
          />
        );
      })}
    </ChipRow>
  ) : (
    // Nothing scanned yet (or a guest): point them at the scanner.
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 15, lineHeight: 19, color: 'rgba(26,26,26,0.75)' }}>
        {groceries === null && !guest
          ? 'Checking your groceries…'
          : guest
            ? 'to see expiring items'
            : "Scan your groceries to see what's expiring."}
      </Text>
    </View>
  );

  const groceryCard = (
    <ActionCardShell
      key="groceries"
      testID="home-card-groceries"
      bg={ACTION_CARD_BG.orange}
      centered
      greeting={guest ? '' : 'How are you diverting these'}
      title={guest ? 'start scanning' : 'expiring food?'}
      chips={groceryChips}
      buttons={
        expiring && picked.length === 0 ? (
          <ActionCardPrompt text="select grocery for options" />
        ) : expiring && picked[0] ? (
          <ActionCardButtons
            onAskDiva={() => onAskAboutGroceries(picked)}
            secondaryLabel="Find where"
            // Where its packaging goes, from the item itself.
            onSecondary={() => onNavigate(recycleHref(picked[0]?.packaging ?? null))}
          />
        ) : guest ? (
          <ActionCardButtons
            secondaryLabel="Scan groceries"
            secondaryIcon={<CameraGlyph color="#FAFFEF" size={18} />}
            onSecondary={onStartScanning}
          />
        ) : (
          <ActionCardButtons
            onAskDiva={() => onAskHowTo("What can I do with food that's about to expire?")}
            secondaryLabel="Scan groceries"
            onSecondary={onStartScanning}
          />
        )
      }
    />
  );

  const cards =
    expiring || outsideCoverage ? [groceryCard, disposeCard] : [disposeCard, groceryCard];

  // Full-bleed, as the prototype: cards 6.6% in, 17pt apart, the next one peeking at
  // the right (9.2%); each card is 84.2% of the screen. Room under them for the
  // buttons that straddle their bottom edge.
  return (
    <View style={{ marginHorizontal: -16 }}>
      <SnapCarousel
        activeIndex={active}
        onActiveIndexChange={setActive}
        cardWidthRatio={0.842}
        padLeft={Math.round(WINDOW_W * 0.066)}
        gap={17}
      >
        {cards.map((card) => (
          <View key={card.key} style={{ paddingBottom: 23 }}>
            {card}
          </View>
        ))}
      </SnapCarousel>
    </View>
  );
}
