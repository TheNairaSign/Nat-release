export type CapturedImage = {
  uri: string;
  fileName: string;
  mimeType: string;
  base64?: string;
  /** Pixel size, when the picker knows it (so a big photo can be scaled down). */
  width?: number;
  height?: number;
};

export interface Camera {
  requestPermission(): Promise<boolean>;
  takePhoto(): Promise<CapturedImage | null>;
  pickImage(): Promise<CapturedImage | null>;
}
