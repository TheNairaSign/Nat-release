import { hrefForTab, isTabLocked, tabIdFromPath } from '../tabs';

describe('consumer tabs', () => {
  it('locks Impact and You for guests', () => {
    expect(isTabLocked('impact', true)).toBe(true);
    expect(isTabLocked('you', true)).toBe(true);
    expect(isTabLocked('home', true)).toBe(false);
    expect(isTabLocked('where', true)).toBe(false);
    expect(isTabLocked('impact', false)).toBe(false);
  });

  it('resolves guest and app hrefs', () => {
    expect(hrefForTab('home', true)).toBe('/guest/dashboard');
    expect(hrefForTab('where', true)).toBe('/guest/where');
    expect(hrefForTab('impact', true)).toBeNull();
    expect(hrefForTab('you', false)).toBe('/profile');
  });

  it('maps pathnames onto tab ids', () => {
    expect(tabIdFromPath('/guest/dashboard')).toBe('home');
    expect(tabIdFromPath('/guest/where')).toBe('where');
    expect(tabIdFromPath('/profile/update-profile')).toBe('you');
    expect(tabIdFromPath('/material-contributions')).toBe('impact');
  });
});
