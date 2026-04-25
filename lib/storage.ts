"use client";

const NAME_KEY = "btb.user.name.v1";
const RECENTS_KEY = "btb.recents.v1";

export type RecentTable = {
  code: string;
  participantId: string;
  tableName: string;
  restaurant: string;
  city: string;
  joinedAt: number;
  finishedAt: number | null;
};

export function getUserName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(NAME_KEY) || "";
}

export function setUserName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(NAME_KEY, name.trim());
}

function readRecents(): RecentTable[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeRecents(items: RecentTable[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(RECENTS_KEY, JSON.stringify(items));
}

export function listRecents(): RecentTable[] {
  return readRecents().sort((a, b) => b.joinedAt - a.joinedAt);
}

export function getRecent(code: string): RecentTable | null {
  return readRecents().find((r) => r.code.toUpperCase() === code.toUpperCase()) ?? null;
}

export function rememberTable(entry: RecentTable): void {
  const items = readRecents().filter((r) => r.code !== entry.code);
  items.push(entry);
  writeRecents(items);
}

export function updateRecent(code: string, patch: Partial<RecentTable>): void {
  const items = readRecents();
  const idx = items.findIndex((r) => r.code.toUpperCase() === code.toUpperCase());
  if (idx === -1) return;
  items[idx] = { ...items[idx], ...patch };
  writeRecents(items);
}

export function forgetTable(code: string): void {
  writeRecents(readRecents().filter((r) => r.code !== code));
}
