import { NYC_TAX_RATE, type Session } from "./types";

export function sessionTotals(session: Session) {
  const plateValue = session.captures.reduce(
    (sum, c) => sum + (c.pricing.total ?? 0),
    0,
  );
  const taxMult = session.taxIncluded ? NYC_TAX_RATE : 0;
  const tipMult = (session.tipPercent || 0) / 100;
  const costPaid = session.aycePricePerPerson * (1 + taxMult + tipMult);
  const percentBeaten = costPaid > 0 ? (plateValue / costPaid) * 100 : 0;
  return { plateValue, costPaid, percentBeaten };
}
