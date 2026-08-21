export interface ShareSheet {
  share(message: string): Promise<void>;
}
