import {
  groupToolsIntoActions,
  parseAiResponse,
  resolveActionTarget,
} from '../tools';

/**
 * A verbatim capture from the live service
 * (POST https://natcycleai-production.up.railway.app/api/v1/ask,
 *  question: "Where can I recycle plastic?").
 *
 * Kept as a fixture so the parser is pinned to a real payload rather than an
 * assumed shape — the original mobile parser expected `{ label, href }` tools
 * and silently produced none.
 */
const LIVE_AGENTIC = {
  type: 'AGENTIC',
  data: {
    answer:
      'On it — opening the Where map with plastic selected. Tap Continue to see matching drop-off spots.',
    tools: [
      {
        name: 'navigateToWithParams',
        parameters: {
          route: '/where',
          params: { materialType: 'plastic', type: 'plastic' },
        },
        description: 'plastic nearby',
      },
      { name: 'navigateTo', parameters: { route: '/where' } },
      {
        name: 'setFilter',
        parameters: {
          filterType: 'materialType',
          value: 'plastic',
          page: 'where',
        },
        description: 'plastic nearby',
      },
    ],
    confidence: 0.93,
  },
};

describe('live AI contract', () => {
  it('extracts the answer text', () => {
    expect(parseAiResponse(LIVE_AGENTIC).text).toContain(
      'opening the Where map',
    );
  });

  it('extracts all three tools', () => {
    expect(parseAiResponse(LIVE_AGENTIC).tools).toHaveLength(3);
  });

  it('collapses them into a single Continue button', () => {
    const actions = groupToolsIntoActions(parseAiResponse(LIVE_AGENTIC).tools);
    expect(actions).toHaveLength(1);
    expect(actions[0]?.id).toBe('find_where');
  });

  it('labels it from the tool description', () => {
    const [action] = groupToolsIntoActions(parseAiResponse(LIVE_AGENTIC).tools);
    expect(action?.label).toBe('plastic nearby');
  });

  it('routes to the Where map carrying the material filter', () => {
    const [action] = groupToolsIntoActions(parseAiResponse(LIVE_AGENTIC).tools);
    expect(resolveActionTarget(action!)).toEqual({
      kind: 'route',
      href: '/where?type=plastic',
    });
  });
});
