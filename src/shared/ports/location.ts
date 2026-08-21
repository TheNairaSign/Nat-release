export interface Location {
  requestPermission(): Promise<boolean>;
  getCurrentPosition(): Promise<{ latitude: number; longitude: number } | null>;
}
