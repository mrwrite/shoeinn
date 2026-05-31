import type { AppointmentQuote } from "../types/booking";
import type { Appointment } from "../types/booking";

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

export function getImmediateCheckoutUrl(appointment: Pick<Appointment, "payment_mode" | "payment_checkout_url">): string | null {
  if (appointment.payment_mode !== "service") {
    return null;
  }
  const checkoutUrl = appointment.payment_checkout_url?.trim();
  return checkoutUrl || null;
}
