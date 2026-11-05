export interface Linking {
  openUrl(url: string): Promise<void>;
  /** This app's page in the phone's Settings (to turn a blocked permission back on). */
  openSettings(): Promise<void>;
}
