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

export type Participant = {
  id: string;
  name: string;
  joined_at: number;
};

export type ServerCapture = {
  id: string;
  participant_id: string;
  timestamp: number;
  total: number;
  counts: CountEntry[];
  pricing: Pricing;
};

export type Table = {
  code: string;
  table_name: string;
  restaurant: string;
  city: string;
  ayce_price_per_person: number;
  tax_included: boolean;
  tip_percent: number;
  created_at: number;
  finished_at: number | null;
  participants: Participant[];
  captures: ServerCapture[];
};

export const NYC_TAX_RATE = 0.08875;
