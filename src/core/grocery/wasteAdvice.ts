import type { GroceryFoodWaste } from './grocery';

/**
 * The words for the expanded "Last 30 days" panel (Nov 25 meeting: which foods a person
 * wastes most, and what to buy less of). Mirrors web utils/groceryWasteAdvice.ts.
 */

/** Words ending in s that aren't plurals, so they take "less", not "fewer". */
const NOT_PLURAL = new Set([
  'hummus',
  'asparagus',
  'couscous',
  'molasses',
  'swiss chard',
]);

/** "eggs" → "fewer eggs"; "milk" → "less milk". */
function amountOf(label: string): string {
  const plural =
    label.endsWith('s') && !label.endsWith('ss') && !NOT_PLURAL.has(label);
  return `${plural ? 'fewer' : 'less'} ${label}`;
}

/** "Eggs", for a list row. */
export function foodName(food: GroceryFoodWaste): string {
  return food.label.charAt(0).toUpperCase() + food.label.slice(1);
}

/** "3 of 4 wasted", or "2 wasted" when none were used. */
export function wastedText(food: GroceryFoodWaste): string {
  return food.used > 0
    ? `${food.wasted} of ${food.wasted + food.used} wasted`
    : `${food.wasted} wasted`;
}

/** "Buy fewer eggs: 3 of the 4 you had went to waste." Leftovers: cook less instead. */
export function buyLessText(food: GroceryFoodWaste): string {
  const total = food.wasted + food.used;
  if (food.cooked) {
    return food.used > 0
      ? `Cook a little less: ${food.wasted} of ${total} leftovers went to waste.`
      : `Cook a little less: ${food.wasted} leftovers went to waste.`;
  }
  const head = `Buy ${amountOf(food.label)}`;
  return food.used > 0
    ? `${head}: ${food.wasted} of the ${total} you had went to waste.`
    : `${head}: all ${food.wasted} you had went to waste.`;
}
