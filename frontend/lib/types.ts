export type CountEntry = {
  label: string;
  display: string;
  count: number;
};

export type PriceBreakdownEntry = {
  display: string;
  count: number;
  price_per_piece: number | null;
  subtotal: number | null;
};

export type Pricing = {
  available: boolean;
  total: number | null;
  location: string;
  breakdown: PriceBreakdownEntry[];
};

export type IdentifyResponse = {
  image_size: [number, number];
  boxes: number[][];
  counts: CountEntry[];
  total: number;
  pricing: Pricing;
  error?: string;
};

export type Capture = {
  id: string;
  timestamp: number;
  total: number;
  counts: CountEntry[];
  pricing: Pricing;
};

export type Session = {
  id: string;
  tableName: string;
  restaurant: string;
  city: string;
  aycePricePerPerson: number;
  taxIncluded: boolean;
  tipPercent: number;
  createdAt: number;
  finishedAt: number | null;
  captures: Capture[];
};

export const NYC_TAX_RATE = 0.08875;
