import { aiLandingTitle, formatAiLines, parseAiHref } from '@/core/ai';

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
});

describe('formatAiLines', () => {
  it('bolds "Method N" headings', () => {
    const lines = formatAiLines('Method 1: rinse it\nThen dry it');
    expect(lines[0]?.isTitle).toBe(true);
    expect(lines[1]?.isTitle).toBe(false);
  });

  it('is case insensitive and tolerates spacing', () => {
    expect(formatAiLines('METHOD  2')[0]?.isTitle).toBe(true);
  });

  it('bolds the two option suffixes', () => {
    expect(formatAiLines('Kerbside pickup (default option)')[0]?.isTitle).toBe(
      true,
    );
    expect(formatAiLines('Burn it (only if safe)')[0]?.isTitle).toBe(true);
  });

  it('keeps blank lines so paragraph spacing survives', () => {
    const lines = formatAiLines('One\n\nTwo');
    expect(lines).toHaveLength(3);
    expect(lines[1]?.isBlank).toBe(true);
  });

  it('does not treat ordinary text as a heading', () => {
    expect(formatAiLines('This method works well')[0]?.isTitle).toBe(false);
  });
});
