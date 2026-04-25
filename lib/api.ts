import type { IdentifyResponse, Table } from "./types";

// Backend URL for Python ML endpoints (identify, locations, prewarm)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${text || res.statusText}`);
  }
  return res.json();
}

// These endpoints still use the Python backend for ML functionality
export async function fetchLocations(): Promise<{ locations: string[]; default: string }> {
  return jsonFetch(`${BACKEND_URL}/locations`);
}

export async function prewarm(location: string): Promise<{ loaded: boolean; from_cache: boolean }> {
  const fd = new FormData();
  fd.append("location", location);
  return jsonFetch(`${BACKEND_URL}/prewarm`, { method: "POST", body: fd });
}

export async function identify(blob: Blob, location: string): Promise<IdentifyResponse> {
  const fd = new FormData();
  fd.append("file", blob, "frame.jpg");
  fd.append("location", location);
  return jsonFetch(`${BACKEND_URL}/identify`, { method: "POST", body: fd });
}

// Table management endpoints - use local Next.js API routes with Supabase
export type CreateTableInput = {
  table_name: string;
  restaurant: string;
  city: string;
  ayce_price_per_person: number;
  tax_included: boolean;
  tip_percent: number;
  host_name: string;
};

export async function createTable(input: CreateTableInput): Promise<{ table: Table; participant_id: string }> {
  return jsonFetch("/api/tables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function joinTable(code: string, name: string): Promise<{ table: Table; participant_id: string }> {
  return jsonFetch(`/api/tables/${code}/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function getTable(code: string): Promise<Table> {
  return jsonFetch(`/api/tables/${code}`);
}

export async function addTableCapture(
  code: string,
  body: { participant_id: string; total: number; counts: unknown[]; pricing: unknown },
): Promise<Table> {
  return jsonFetch(`/api/tables/${code}/captures`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function finishTable(code: string): Promise<Table> {
  return jsonFetch(`/api/tables/${code}/finish`, { method: "POST" });
}
