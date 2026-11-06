import { buildSnapDivertAllChat, buildSnapDivertChat, guestItems, parseIdentified, whereFor } from '../snapdivert';

describe('SnapDivert', () => {
  it('asks DiVA about one item with its condition', () => {
    const chat = buildSnapDivertChat({ name: 'Cabinet', material: 'wood', condition: 'repair' }, { city: 'New Haven' });
    expect(chat.question).toBe("How do I divert my cabinet? It's needs repair.");
    expect(chat.context).toEqual({
      divert: { item: 'Cabinet', material: 'wood', condition: 'repair', state: 'active', place: { city: 'New Haven' } },
    });
  });

  it('asks about everything on the photo in one question', () => {
    const chat = buildSnapDivertAllChat([
      { tag: 1, name: 'Chair', material: 'wood', condition: 'good' },
      { tag: 2, name: 'Lamp', material: 'metal', condition: null },
    ]);
    expect(chat.question).toBe('How do I divert these: 1. Chair (good, usable); 2. Lamp?');
    expect(chat.context.divert).toMatchObject({ item: 'chair and lamp', material: null });
  });

  it('opens the Where tab for the material, or the whole map', () => {
    expect(whereFor('cardboard')).toBe('/where?materialType=paper');
    expect(whereFor('fabric')).toBe('/where?materialType=fabrics');
    expect(whereFor('wood')).toBe('/where');
  });

  it("keeps a guest's items on screen in the shape of kept ones", () => {
    const found = parseIdentified({ items: [{ tag: 1, label: 'kettle', material: 'metal', box: { x_min: 0, y_min: 0, x_max: 1, y_max: 1 } }] });
    const items = guestItems('https://img/x.jpg', found);
    expect(items[0]).toMatchObject({ _id: 'guest-1', name: 'kettle', status: 'pending', condition: null });
  });
});
