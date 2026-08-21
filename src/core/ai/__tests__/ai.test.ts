import { aiLandingTitle, extractAssistantReply, parseAiHref } from '@/core/ai';

describe('ai helpers', () => {
  it('greets with first name', () => {
    expect(aiLandingTitle('Ada')).toBe(
      'Hi Ada, what diversion questions do you have?',
    );
    expect(aiLandingTitle()).toContain('there');
  });

  it('maps prompts to in-app hrefs', () => {
    expect(parseAiHref('Find recycling places near me')).toBe('/where');
    expect(parseAiHref('Take me to green profile')).toBe('/impact');
  });

  it('parses ask responses', () => {
    const parsed = extractAssistantReply({
      data: {
        answer: 'Head to Where',
        tools: [{ label: 'Open Where', href: '/where' }],
        options: ['Plastic', 'Glass'],
      },
    });
    expect(parsed.text).toBe('Head to Where');
    expect(parsed.tools[0]?.href).toBe('/where');
    expect(parsed.options).toEqual(['Plastic', 'Glass']);
  });
});
