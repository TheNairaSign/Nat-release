export type AnalyticsProps = Record<string, string | number | boolean | null>;

export interface Analytics {
  track(event: string, props?: AnalyticsProps): void;
  identify(userId: string | null): void;
}
