export interface Biometrics {
  isAvailable(): Promise<boolean>;
}
