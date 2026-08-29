import QRCode from "qrcode";
import { buildQrScanUrl } from "./tokens";

export async function generateQrCodePng(token: string, siteUrl?: string): Promise<Buffer> {
  const url = buildQrScanUrl(token, siteUrl);
  return QRCode.toBuffer(url, {
    type: "png",
    width: 512,
    margin: 2,
    color: {
      dark: "#1a2f28",
      light: "#ffffff",
    },
  });
}

export async function generateQrCodeDataUrl(token: string, siteUrl?: string): Promise<string> {
  const url = buildQrScanUrl(token, siteUrl);
  return QRCode.toDataURL(url, {
    width: 320,
    margin: 2,
    color: {
      dark: "#1a2f28",
      light: "#ffffff",
    },
  });
}
