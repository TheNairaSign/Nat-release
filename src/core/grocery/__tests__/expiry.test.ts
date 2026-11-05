import { expiryLine, listExpiryLine, parseExpiryInput, urgencyOf } from '../expiry';

const TODAY = new Date(2026, 10, 6); // 6 Nov 2026

describe('grocery dates', () => {
  it('reads typed and spoken dates, day first', () => {
    expect(parseExpiryInput('15/10/2026', TODAY)).toBe('2026-10-15');
    expect(parseExpiryInput('the third of December', TODAY)).toBe('2026-12-03');
    expect(parseExpiryInput('in 5 days', TODAY)).toBe('2026-11-11');
    expect(parseExpiryInput('10/2026', TODAY)).toBe('2026-10-31');
    expect(parseExpiryInput('31/02/2026', TODAY)).toBeNull();
    expect(parseExpiryInput('banana', TODAY)).toBeNull();
  });

  it('words the date as web does', () => {
    expect(expiryLine('2026-11-07', 'printed', TODAY)).toBe('Expires tomorrow');
    expect(listExpiryLine('2026-11-04', 'printed', TODAY)).toBe('expired 2 days ago');
    expect(expiryLine('2026-11-20', 'shelf_life', TODAY)).toBe('Usually expires in 2 weeks');
  });

  it('colours by urgency', () => {
    expect(urgencyOf('2026-11-05', 'active', TODAY)).toBe('expired');
    expect(urgencyOf('2026-11-08', 'active', TODAY)).toBe('critical');
    expect(urgencyOf('2026-11-11', 'active', TODAY)).toBe('soon');
    expect(urgencyOf('2026-11-08', 'consumed', TODAY)).toBe('fine');
  });
});
