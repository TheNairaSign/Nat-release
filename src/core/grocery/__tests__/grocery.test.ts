import {
  DIVERT_OPTION,
  RECIPE_OPTION,
  buildFoodCardOpening,
  daysUntil,
  dueThisWeek,
  expiringChips,
  parseGroceryItem,
  recycleHref,
  type GroceryItem,
} from '../grocery';

const TODAY = new Date(2026, 10, 5); // Nov 5
const item = (name: string, expiresOn: string, extra: Partial<GroceryItem> = {}): GroceryItem => ({
  _id: name,
  name,
  expiresOn,
  status: 'active',
  packaging: null,
  ...extra,
});

describe('grocery', () => {
  it('counts days to the date, negative once past it', () => {
    expect(daysUntil('2026-11-07', TODAY)).toBe(2);
    expect(daysUntil('2026-11-03', TODAY)).toBe(-2);
  });

  it("this week's food includes three days' grace after the date", () => {
    const list = [item('milk', '2026-11-02'), item('kiwi', '2026-11-12'), item('rice', '2026-12-30'), item('old', '2026-11-01')];
    expect(dueThisWeek(list, TODAY).map((i) => i.name)).toEqual(['milk', 'kiwi']);
  });

  it("the food card shows this week's food, one chip per name, or else the soonest", () => {
    expect(expiringChips([item('kiwi', '2026-11-06'), item('Kiwi', '2026-11-07')], TODAY).map((i) => i.name)).toEqual(['kiwi']);
    expect(expiringChips([item('rice', '2026-12-30')], TODAY).map((i) => i.name)).toEqual(['rice']);
  });

  it("opens DiVA with a recipe and the packaging's way out", () => {
    const can = { primaryType: 'metal', subType: null, label: 'can' };
    const opening = buildFoodCardOpening(
      [item('kiwi', '2026-11-06'), item('beans', '2026-11-07', { packaging: can })],
      { city: 'New Haven' },
      TODAY,
    );
    expect(opening.text).toBe("Here's what I can do with your kiwi and beans.");
    expect(opening.options).toEqual([RECIPE_OPTION, DIVERT_OPTION]);
    expect(opening.optionContexts[RECIPE_OPTION]).toEqual({
      useUp: { items: [{ name: 'kiwi', daysLeft: 1 }, { name: 'beans', daysLeft: 2 }] },
    });
    expect(opening.optionContexts[DIVERT_OPTION]).toMatchObject({
      divert: { item: 'beans', packaging: can, state: 'active', place: { city: 'New Haven' } },
    });
  });

  it('sends the packaging to its material on the map', () => {
    expect(recycleHref({ primaryType: 'plastic', subType: null, label: 'tub' })).toBe('/where?materialType=plastic');
    expect(recycleHref(null)).toBe('/where');
  });

  it('reads an item from the API', () => {
    expect(parseGroceryItem({ _id: 'a', name: 'kiwi', expiresOn: '2026-11-06', status: 'active' })?.name).toBe('kiwi');
    expect(parseGroceryItem({ name: 'no id' })).toBeNull();
  });
});
