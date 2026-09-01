export const glass = {
  /**
   * Web: `background: rgba(255,255,255,0.55)` with
   * `backdrop-filter: blur(20px) saturate(180%)` (MobileNav.tsx:74-78).
   *
   * expo-blur supplies the blur. On web its `default` tint already paints
   * rgba(255,255,255,0.3) at intensity 100, so `fillOverBlur` is the extra
   * white needed to composite up to web's 0.55:
   *   0.3 + 0.357 * (1 - 0.3) = 0.55
   */
  fill: 'rgba(255, 255, 255, 0.55)',
  fillOverBlur: 'rgba(255, 255, 255, 0.357)',
  /** intensity * 0.2 = CSS blur px, so 100 -> blur(20px). */
  blurIntensity: 100,
  border: 'rgba(255, 255, 255, 0.5)',
  discInactive: 'rgba(255, 255, 255, 0.45)',
  discLocked: 'rgba(255, 255, 255, 0.4)',
  toggle: 'rgba(17, 24, 39, 0.4)',
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;
