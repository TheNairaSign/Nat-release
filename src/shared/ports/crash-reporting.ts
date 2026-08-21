export interface CrashReporting {
  captureException(error: unknown, context?: Record<string, string>): void;
}
