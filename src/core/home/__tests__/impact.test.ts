import {
  aiHref,
  greetingPeriod,
  homeGreeting,
  impactMeter,
  whereHref,
} from '@/core/home';

describe('home impact', () => {
  it('maps carbon units onto the Seedling meter', () => {
    const meter = impactMeter(12);
    expect(meter.name).toBe('Seedling');
    expect(meter.start).toBe(0);
    expect(meter.end).toBe(500);
    expect(meter.displayCu).toBe(12);
    expect(meter.filledSegments).toBeGreaterThan(0);
  });

  it('greets by time of day', () => {
    expect(greetingPeriod(9)).toBe('Morning');
    expect(homeGreeting(15, true)).toBe('Good Afternoon there!');
    expect(homeGreeting(15, false, 'Ada')).toBe('Good Afternoon Ada!');
  });

  it('builds Where and AI hrefs', () => {
    expect(whereHref(true, 'Food')).toBe('/guest/where?type=Food');
    expect(whereHref(false, null)).toBe('/where');
    expect(aiHref('How do I recycle?', 's1')).toBe(
      '/ai?q=How+do+I+recycle%3F&suggestionId=s1',
    );
  });
});
