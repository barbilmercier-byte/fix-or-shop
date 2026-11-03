export function money(amount: number | null | undefined, currency = "USD") {
  if (amount == null) return "–";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function moneyRange(low: number, high: number, currency = "USD") {
  return low === high ? money(low, currency) : `${money(low, currency)}–${money(high, currency)}`;
}

export function partsTotal(parts: { cost_low: number; cost_high: number }[]) {
  return parts.reduce(
    (acc, p) => ({ low: acc.low + p.cost_low, high: acc.high + p.cost_high }),
    { low: 0, high: 0 },
  );
}
