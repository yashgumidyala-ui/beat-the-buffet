"use client";
import type { Capture, Session } from "./types";

const KEY = "btb.sessions.v1";

function read(): Session[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(sessions: Session[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(sessions));
}

export function listSessions(): Session[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function getSession(id: string): Session | null {
  return read().find((s) => s.id === id) ?? null;
}

export function createSession(input: Omit<Session, "id" | "createdAt" | "finishedAt" | "captures">): Session {
  const session: Session = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    finishedAt: null,
    captures: [],
  };
  const all = read();
  all.push(session);
  write(all);
  return session;
}

export function addCapture(sessionId: string, capture: Capture): Session | null {
  const all = read();
  const idx = all.findIndex((s) => s.id === sessionId);
  if (idx === -1) return null;
  all[idx].captures.push(capture);
  write(all);
  return all[idx];
}

export function finishSession(sessionId: string): Session | null {
  const all = read();
  const idx = all.findIndex((s) => s.id === sessionId);
  if (idx === -1) return null;
  all[idx].finishedAt = Date.now();
  write(all);
  return all[idx];
}

export function deleteSession(sessionId: string): void {
  write(read().filter((s) => s.id !== sessionId));
}
