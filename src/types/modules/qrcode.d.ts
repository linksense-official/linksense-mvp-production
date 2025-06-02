declare module 'qrcode' {
  export interface QRCodeToDataURLOptions {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    type?: 'image/png' | 'image/jpeg' | 'image/webp';
    quality?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    width?: number;
  }

  export function toDataURL(
    text: string,
    options?: QRCodeToDataURLOptions
  ): Promise<string>;

  export function toString(
    text: string,
    options?: any
  ): Promise<string>;

  export function toCanvas(
    canvas: HTMLCanvasElement,
    text: string,
    options?: any
  ): Promise<void>;

  export function toFile(
    path: string,
    text: string,
    options?: any
  ): Promise<void>;

  const QRCode: {
    toDataURL: typeof toDataURL;
    toString: typeof toString;
    toCanvas: typeof toCanvas;
    toFile: typeof toFile;
  };

  export default QRCode;
}