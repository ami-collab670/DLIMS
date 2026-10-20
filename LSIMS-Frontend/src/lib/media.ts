import QRCode from "qrcode";

export async function qrTextToDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    margin: 1,
    width: 180,
    color: {
      dark: "#111827",
      light: "#ffffff",
    },
  });
}
