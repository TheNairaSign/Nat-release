import {
  continueLabel,
  groupToolsIntoActions,
  isThingsMatchTool,
  parseAiResponse,
  resolveActionTarget,
} from '../tools';

describe('parseAiResponse', () => {
  // Regression: the old parser expected `{ label, href }` tools, so every
  // Continue button in the agentic flow was silently dropped.
  it('reads AGENTIC answers and their tools', () => {
    const parsed = parseAiResponse({
      type: 'AGENTIC',
      data: {
        answer: 'Here you go',
        tools: [{ name: 'navigateTo', parameters: { route: '/where' } }],
      },
    });
    expect(parsed.text).toBe('Here you go');
    expect(parsed.tools).toHaveLength(1);
    expect(parsed.tools[0]?.name).toBe('navigateTo');
  });

  it('synthesises a navigateTo tool for NAVIGATION replies', () => {
    const parsed = parseAiResponse({
      type: 'NAVIGATION',
      data: { description: 'Opening the map', route: '/where' },
    });
    expect(parsed.tools[0]).toMatchObject({ name: 'navigateTo' });
  });

  it('synthesises an openExternal tool for EXTERNAL replies', () => {
    const parsed = parseAiResponse({
      type: 'EXTERNAL',
      data: { url: 'https://thingsmatch.com/add-item', title: 'ThingsMatch' },
    });
    expect(parsed.tools[0]?.name).toBe('openExternal');
  });

  it('carries CLARIFICATION options through', () => {
    const parsed = parseAiResponse({
      type: 'CLARIFICATION',
      data: { question: 'Which one?', options: ['a', 'b'] },
    });
    expect(parsed.options).toEqual(['a', 'b']);
  });

  it('falls back rather than throwing on junk', () => {
    expect(parseAiResponse(null).tools).toEqual([]);
    expect(parseAiResponse({}).text).toContain('still learning');
  });
});

describe('continueLabel', () => {
  it('prefers an explicit button label', () => {
    expect(
      continueLabel([{ name: 'x', parameters: { buttonLabel: 'Do it' } }]),
    ).toBe('Do it');
  });

  it('labels material filters "<material> nearby"', () => {
    expect(
      continueLabel([
        {
          name: 'setFilter',
          parameters: { filterType: 'materialType', value: 'plastic' },
        },
      ]),
    ).toBe('plastic nearby');
  });

  it('maps routes onto their web labels', () => {
    const nav = (route: string) => [
      { name: 'navigateTo', parameters: { route } },
    ];
    expect(continueLabel(nav('/where'))).toBe('Find nearby');
    expect(continueLabel(nav('/campaigns'))).toBe('Open Events');
    expect(continueLabel(nav('/green-profile'))).toBe('My impact');
    expect(continueLabel(nav('/dropoff/create'))).toBe('Log drop-off');
  });

  it('falls back to Continue', () => {
    expect(continueLabel([{ name: 'unknown', parameters: {} }])).toBe(
      'Continue',
    );
  });
});

describe('isThingsMatchTool', () => {
  it('detects external openers and any thingsmatch mention', () => {
    expect(isThingsMatchTool({ name: 'openExternal', parameters: {} })).toBe(
      true,
    );
    expect(
      isThingsMatchTool({
        name: 'navigateTo',
        parameters: { url: 'https://thingsmatch.com/x' },
      }),
    ).toBe(true);
    expect(isThingsMatchTool({ name: 'setFilter', parameters: {} })).toBe(
      false,
    );
  });
});

describe('groupToolsIntoActions', () => {
  it('collapses navigation and filter tools into one find_where button', () => {
    const actions = groupToolsIntoActions([
      {
        name: 'setFilter',
        parameters: { filterType: 'materialType', value: 'glass' },
      },
      { name: 'navigateTo', parameters: { route: '/where' } },
    ]);
    expect(actions).toHaveLength(1);
    expect(actions[0]?.id).toBe('find_where');
  });

  it('keeps ThingsMatch as its own action', () => {
    const actions = groupToolsIntoActions([
      { name: 'navigateTo', parameters: { route: '/where' } },
      { name: 'openExternal', parameters: { url: 'https://thingsmatch.com' } },
    ]);
    expect(actions).toHaveLength(2);
    expect(actions.some((a) => a.isTm)).toBe(true);
  });
});

describe('resolveActionTarget', () => {
  it('routes filters onto /where as query params', () => {
    const [action] = groupToolsIntoActions([
      {
        name: 'setFilter',
        parameters: { filterType: 'materialType', value: 'glass' },
      },
    ]);
    expect(resolveActionTarget(action!)).toEqual({
      kind: 'route',
      href: '/where?type=glass',
    });
  });

  it('returns an external target for ThingsMatch', () => {
    const [action] = groupToolsIntoActions([
      {
        name: 'openExternal',
        parameters: { url: 'https://thingsmatch.com/add-item' },
      },
    ]);
    expect(resolveActionTarget(action!)?.kind).toBe('external');
  });

  it('returns null when there is nothing to act on', () => {
    const [action] = groupToolsIntoActions([{ name: 'noop', parameters: {} }]);
    expect(resolveActionTarget(action!)).toBeNull();
  });
});
