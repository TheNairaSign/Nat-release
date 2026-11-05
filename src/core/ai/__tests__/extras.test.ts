import { parseAiResponse } from '@/core/ai';

describe('DiVA reply extras', () => {
  it('keeps the advice card, the recipe, images and the token cost', () => {
    const reply = parseAiResponse({
      type: 'KNOWLEDGE',
      data: {
        answer: 'Here is how.',
        guidance: {
          item: 'old phone',
          summary: 'Wipe it first.',
          steps: ['Back up', 'Factory reset'],
          elsewhere: ['Phone shops'],
          caution: null,
          material: 'electronics',
          nearby: [{ name: 'Fix-It', mapsUrl: 'https://maps.example/1', placeId: null }],
        },
        recipe: { title: 'Banana bread', uses: ['bananas'], minutes: 60, steps: ['Mash'], tip: null },
        images: ['https://img.example/a.jpg', { url: '' }],
      },
      tokens: { kind: 'divaQuestion', cost: 20, left: 980 },
    });
    expect(reply.guidance?.nearby?.[0]?.name).toBe('Fix-It');
    expect(reply.recipe?.minutes).toBe(60);
    expect(reply.images).toEqual([{ url: 'https://img.example/a.jpg' }]);
    expect(reply.tokenCost).toBe(20);
  });

  it("keeps a clarification's context for the picked option", () => {
    const reply = parseAiResponse({
      type: 'CLARIFICATION',
      data: { question: 'Which?', options: ['A', 'B'], context: { step: 2 } },
    });
    expect(reply.options).toEqual(['A', 'B']);
    expect(reply.context).toEqual({ step: 2 });
  });

  it('adds nothing when the reply carries none of them', () => {
    const reply = parseAiResponse({ type: 'KNOWLEDGE', data: { answer: 'Hi' } });
    expect(reply).toEqual({ text: 'Hi', tools: [], options: [] });
  });
});
