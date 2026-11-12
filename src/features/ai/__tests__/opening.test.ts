import { openChatSection, takeChatSection } from '../opening';

describe('chat section handoff', () => {
  it("defaults to 'general' when nothing was set", () => {
    expect(takeChatSection()).toBe('general');
  });

  it('hands over the section set just before navigating, once', () => {
    openChatSection('grocery');
    expect(takeChatSection()).toBe('grocery');
    expect(takeChatSection()).toBe('general');
  });

  it('keeps grocery and snapdivert distinct', () => {
    openChatSection('snapdivert');
    expect(takeChatSection()).toBe('snapdivert');
  });
});
