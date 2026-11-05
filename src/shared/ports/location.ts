/** Web's locationAccess(): "prompt" can still be asked; "denied" needs Settings. */
export type LocationAccess = 'granted' | 'prompt' | 'denied';

export interface Location {
  requestPermission(): Promise<boolean>;
  /** The permission as it stands, without asking. */
  getPermissionStatus(): Promise<LocationAccess>;
  /** Null unless location is already allowed: never prompts. */
  getCurrentPosition(): Promise<{ latitude: number; longitude: number } | null>;
}
