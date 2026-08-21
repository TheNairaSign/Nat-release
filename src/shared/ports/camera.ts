export type CapturedImage = {
  uri: string;
  fileName: string;
  mimeType: string;
  base64?: string;
};

export interface Camera {
  requestPermission(): Promise<boolean>;
  takePhoto(): Promise<CapturedImage | null>;
  pickImage(): Promise<CapturedImage | null>;
}
