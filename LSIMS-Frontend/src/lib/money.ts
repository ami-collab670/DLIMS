export const DEFAULT_CURRENCY = "ETB";

export type FormatMoneyOptions = {
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showCurrency?: boolean;
};

export function parseMoney(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const normalized = String(value ?? "")
    .trim()
    .replace(/,/g, "");
  if (!normalized) return 0;
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(
  value: number | null | undefined,
  options?: FormatMoneyOptions,
): string {
  const amount = value ?? 0;
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const min = options?.minimumFractionDigits ?? 2;
  const max = options?.maximumFractionDigits ?? 2;
  const formatted = safeAmount.toLocaleString("en-US", {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  });
  const showCurrency = options?.showCurrency !== false;
  if (!showCurrency) return formatted;
  const currency = options?.currency ?? DEFAULT_CURRENCY;
  return `${formatted} ${currency}`;
}

export function formatMoneyFromApi(value: string | null | undefined): string {
  return formatMoney(parseMoney(value));
}

export function formatMoneyPlain(
  value: number | null | undefined,
  fractionDigits = 2,
): string {
  return parseMoney(value ?? 0).toFixed(fractionDigits);
}
