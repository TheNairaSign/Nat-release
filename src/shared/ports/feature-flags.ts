export interface FeatureFlags {
  isEnabled(flag: string): boolean;
}
