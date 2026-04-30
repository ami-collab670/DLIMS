/**
 * Build a PNG data URL for a QR code without a local `qrcode` package import
 * (avoids Vite/Docker node_modules resolution issues).
 *
 * Loads `qrcode` from esm.sh once at runtime; requires network the first time.
 */

type QrModule = {
  default: {
    toDataURL: (
      text: string,
      opts?: {
        width?: number;
        margin?: number;
        color?: { dark: string; light: string };
        errorCorrectionLevel?: string;
      },
    ) => Promise<string>;
  };
};

const ESM_URL = "https://esm.sh/qrcode@1.5.4";

let cached: QrModule | null = null;

export async function qrTextToDataUrl(text: string): Promise<string> {
  if (!cached) {
    cached = (await import(/* @vite-ignore */ ESM_URL)) as QrModule;
  }
  const QRCode = cached.default;
  return QRCode.toDataURL(text, {
    width: 180,
    margin: 2,
    color: { dark: "#000000ff", light: "#ffffffff" },
    errorCorrectionLevel: "M",
  });
}
