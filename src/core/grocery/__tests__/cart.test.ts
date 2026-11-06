import { interpretAnswer, parseMlCart, questionPrompt, type MlOpenQuestion } from '../cart';

const TODAY = new Date(2026, 10, 6);
const q = (kind: MlOpenQuestion['kind'], tag = 4, hint: string | null = null): MlOpenQuestion => ({ kind, tag, hint });

describe('scan cart', () => {
  it('asks each kind of question as web does', () => {
    expect(questionPrompt(q('label', 4, 'canned beans'), null).text).toBe('Is number 4 canned beans?');
    expect(questionPrompt(q('label', 4), null).text).toBe('What is number 4?');
    expect(questionPrompt(q('expiry', 4, 'milk'), null).text).toBe('When does the milk expire?');
    expect(questionPrompt(q('review'), null).text).toBe('Does this look right?');
    expect(questionPrompt(q('merge', 2, 'limes'), null).text).toBe('I found more than one limes. Treat them as one?');
  });

  it('understands answers to the review question', () => {
    expect(interpretAnswer('yes', q('review'))).toEqual({ type: 'confirm' });
    expect(interpretAnswer('remove 9', q('review'))).toEqual({ type: 'remove', tag: 9 });
    expect(interpretAnswer('3 is milk', q('review'))).toEqual({ type: 'update', tag: 3, changes: { label: 'milk' } });
    expect(interpretAnswer('hmm', q('review')).type).toBe('sayAgain');
  });

  it('a yes takes the suggested name, a name replaces it', () => {
    expect(interpretAnswer('yes', q('label', 4, 'canned beans'))).toEqual({
      type: 'update',
      tag: 4,
      changes: { label: 'canned beans' },
    });
    expect(interpretAnswer("no, it's chickpeas", q('label', 4, 'canned beans'))).toEqual({
      type: 'update',
      tag: 4,
      changes: { label: 'chickpeas' },
    });
  });

  it('reads a spoken date, and asks again when it can not', () => {
    expect(interpretAnswer('in 5 days', q('expiry'), TODAY)).toEqual({
      type: 'update',
      tag: 4,
      changes: { expires_on: '2026-11-11' },
    });
    expect(interpretAnswer('soonish', q('expiry'), TODAY).type).toBe('sayAgain');
  });

  it('yes combines, no keeps apart', () => {
    expect(interpretAnswer('yes', q('merge', 2))).toEqual({ type: 'merge', tag: 2 });
    expect(interpretAnswer('no keep them', q('merge', 2))).toEqual({ type: 'keepSeparate', tag: 2 });
  });

  it('reads a cart from the service', () => {
    const cart = parseMlCart({
      id: 'c1',
      status: 'awaiting_answers',
      image_url: 'https://img/x.jpg',
      items: [{ tag: 1, quantity: 2, tags: [1, 3], merged_into: null, box: { x_min: 0.1, y_min: 0.1, x_max: 0.3, y_max: 0.4 }, label: null, suggested_label: 'lime', expiry: null }],
      open_questions: [{ tag: 1, kind: 'label', hint: 'lime' }, { tag: 9, kind: 'bogus' }],
    });
    expect(cart?.items[0]?.tags).toEqual([1, 3]);
    expect(cart?.open_questions).toHaveLength(1);
  });
});
