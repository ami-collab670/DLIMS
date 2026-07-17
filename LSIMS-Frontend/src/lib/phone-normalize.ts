import { AsYouType, parsePhoneNumber } from "libphonenumber-js";
import type { CountryCode } from "libphonenumber-js";
import {
  getCountryCallingCode,
  type Country,
} from "react-phone-number-input";
import en from "react-phone-number-input/locale/en.json";

export function getPhoneCountryMeta(country: Country) {
  return {
    name: en[country] ?? country,
    callingCode: getCountryCallingCode(country),
  };
}

export function normalizePhoneValue(raw: string, country?: Country): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("+")) {
    try {
      const parsed = parsePhoneNumber(trimmed.replace(/\s/g, ""));
      if (parsed?.number) return parsed.number;
    } catch {
      // continue
    }
    return trimmed.replace(/\s/g, "");
  }

  const digitsOnly = trimmed.replace(/\D/g, "");

  if (country) {
    try {
      const national = parsePhoneNumber(trimmed, country as CountryCode);
      if (national?.number) return national.number;
    } catch {
      // continue
    }

    const formatter = new AsYouType(country as CountryCode);
    formatter.input(trimmed);
    const formatted = formatter.getNumber();
    if (formatted?.number) return formatted.number;
  }

  if (digitsOnly) {
    try {
      const parsed = parsePhoneNumber(`+${digitsOnly}`);
      if (parsed?.number) return parsed.number;
    } catch {
      // continue
    }
  }

  return digitsOnly || trimmed;
}

export function detectCountryFromValue(value: string): Country | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  try {
    const candidate = trimmed.startsWith("+")
      ? trimmed
      : `+${trimmed.replace(/\D/g, "")}`;
    const parsed = parsePhoneNumber(candidate);
    return parsed?.country as Country | undefined;
  } catch {
    return undefined;
  }
}
