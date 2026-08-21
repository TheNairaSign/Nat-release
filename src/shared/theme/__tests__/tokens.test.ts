import { palette, radius, typeScale } from '@/shared/theme/tokens';
import { layout } from '@/shared/theme/layout';

describe('replica tokens', () => {
  it('matches client main light surfaces and type', () => {
    expect(palette.light.bg).toBe('#fbfbfb');
    expect(palette.light.text).toBe('#111111');
    expect(palette.light.ink).toBe('#1A1A1A');
    expect(palette.light.accent).toBe('#204C27');
    expect(palette.light.lime).toBe('#D1FF52');
    expect(radius.lg).toBe(16);
    expect(radius.card24).toBe(24);
    expect(radius.card28).toBe(28);
    expect(typeScale.heading).toBe(22);
    expect(layout.authColumnMaxWidth).toBe(450);
    expect(layout.appColumnMaxWidth).toBe(550);
    expect(layout.signInTopRatio).toBe(0.15);
    expect(layout.tabBarRadius).toBe(28);
  });
});
