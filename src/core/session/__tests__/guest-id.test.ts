import { isUsableGuestId, newGuestId } from '../guest-id';

describe('guest id', () => {
  it('uses the runtime UUID when there is one', () => {
    expect(newGuestId(() => '0f8e4a2c-1d3b-4f5a-9e7d-2b6c8a1f0e3d')).toBe(
      '0f8e4a2c-1d3b-4f5a-9e7d-2b6c8a1f0e3d',
    );
  });

  it("falls back to web's shape, which the server still accepts", () => {
    const id = newGuestId(undefined, () => 1_762_300_000_000, () => 0.123456789);
    expect(isUsableGuestId(id)).toBe(true);
  });

  it('rejects what the server would', () => {
    expect(isUsableGuestId('short')).toBe(false);
    expect(isUsableGuestId('has spaces in it!!!!!')).toBe(false);
    expect(isUsableGuestId(null)).toBe(false);
  });
});
