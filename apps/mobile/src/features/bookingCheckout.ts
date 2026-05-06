import type { AppointmentQuote } from "../types/booking";

export function formatMoney(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

export function buildQuoteDisplayRows(quote: AppointmentQuote) {
  return [
    ...quote.line_items.map((item) => ({
      key: item.code,
      label: item.label,
      value: formatMoney(item.amount, quote.currency),
    })),
    {
      key: "estimated_tax",
      label: "Estimated tax",
      value: formatMoney(quote.estimated_tax, quote.currency),
    },
    {
      key: "total",
      label: "Total",
      value: formatMoney(quote.total, quote.currency),
    },
  ];
}
