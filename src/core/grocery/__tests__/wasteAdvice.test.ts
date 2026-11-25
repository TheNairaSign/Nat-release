import { buyLessText, foodName, parseWasteStats, wastedText } from '../index';

const food = (label: string, wasted: number, used: number, cooked = false) => ({ label, wasted, used, cooked });

describe('waste advice (web utils/groceryWasteAdvice)', () => {
  it('says fewer for things you count, less for the rest', () => {
    expect(buyLessText(food('eggs', 3, 1))).toBe('Buy fewer eggs: 3 of the 4 you had went to waste.');
    expect(buyLessText(food('milk', 2, 0))).toBe('Buy less milk: all 2 you had went to waste.');
    expect(buyLessText(food('hummus', 2, 1))).toMatch(/^Buy less hummus/);
  });

  it('tells leftovers to cook less', () => {
    expect(buyLessText(food('leftovers', 2, 0, true))).toBe('Cook a little less: 2 leftovers went to waste.');
  });

  it('names and counts a row', () => {
    expect(foodName(food('salad leaves', 2, 2))).toBe('Salad leaves');
    expect(wastedText(food('eggs', 3, 1))).toBe('3 of 4 wasted');
    expect(wastedText(food('leftovers', 2, 0))).toBe('2 wasted');
  });
});

describe('parseWasteStats food breakdown', () => {
  it('reads foods and buyLess, dropping malformed rows', () => {
    const stats = parseWasteStats({
      used: 3,
      wasted: 4,
      savedShare: 0.43,
      foods: [{ label: 'eggs', wasted: 3, used: 1, cooked: false }, { wasted: 1 }, null],
      buyLess: [{ label: 'eggs', wasted: 3, used: 1 }],
    });
    expect(stats?.foods).toEqual([{ label: 'eggs', wasted: 3, used: 1, cooked: false }]);
    expect(stats?.buyLess).toEqual([{ label: 'eggs', wasted: 3, used: 1, cooked: false }]);
  });

  it('an older server sends no breakdown: the card does not open', () => {
    const stats = parseWasteStats({ used: 1, wasted: 0, savedShare: 1 });
    expect(stats?.foods).toBeUndefined();
    expect(stats?.buyLess).toEqual([]);
  });
});
