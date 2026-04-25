import { NYC_TAX_RATE, type Table } from "./types";

export function tableTotals(table: Table) {
  const plateValue = table.captures.reduce(
    (sum, c) => sum + (c.pricing.total ?? 0),
    0,
  );
  const taxMult = table.tax_included ? NYC_TAX_RATE : 0;
  const tipMult = (table.tip_percent || 0) / 100;
  const perPersonCost = table.ayce_price_per_person * (1 + taxMult + tipMult);
  const totalCost = perPersonCost * Math.max(1, table.participants.length);
  const percentBeaten = totalCost > 0 ? (plateValue / totalCost) * 100 : 0;
  return { plateValue, perPersonCost, totalCost, percentBeaten };
}

export function participantTotal(table: Table, participantId: string): number {
  return table.captures
    .filter((c) => c.participant_id === participantId)
    .reduce((sum, c) => sum + (c.pricing.total ?? 0), 0);
}
