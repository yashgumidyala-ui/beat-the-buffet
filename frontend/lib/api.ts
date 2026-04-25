import type { IdentifyResponse } from "./types";

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function fetchLocations(): Promise<{ locations: string[]; default: string }> {
  const res = await fetch(`${BASE}/locations`);
  if (!res.ok) throw new Error(`locations: ${res.status}`);
  return res.json();
}

export async function prewarm(location: string): Promise<{ loaded: boolean; from_cache: boolean }> {
  const fd = new FormData();
  fd.append("location", location);
  const res = await fetch(`${BASE}/prewarm`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`prewarm: ${res.status}`);
  return res.json();
}

export async function identify(blob: Blob, location: string): Promise<IdentifyResponse> {
  const fd = new FormData();
  fd.append("file", blob, "frame.jpg");
  fd.append("location", location);
  const res = await fetch(`${BASE}/identify`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`identify: ${res.status}`);
  return res.json();
}
