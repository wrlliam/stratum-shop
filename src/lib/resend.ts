import { Resend } from "resend";

let _resend: Resend | null = null;
export function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) throw new Error("Missing RESEND_API_KEY");
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "orders@stratum.store";
export const APP_NAME = process.env.APP_NAME || "Stratum";
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
