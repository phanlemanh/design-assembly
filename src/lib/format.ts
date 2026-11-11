const LOCALE = "vi-VN";
const CURRENCY = "VND";

export function formatMoney(value: number): string {
  return new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY }).format(value);
}

export function formatDate(value: Date): string {
  return new Intl.DateTimeFormat(LOCALE).format(value);
}
