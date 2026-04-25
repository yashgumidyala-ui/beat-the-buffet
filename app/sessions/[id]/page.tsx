"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CameraCapture } from "@/components/camera-capture";
import {
  addTableCapture,
  finishTable,
  getTable,
} from "@/lib/api";
import { getRecent, updateRecent } from "@/lib/storage";
import { tableTotals, participantTotal } from "@/lib/session-math";
import { formatCurrency } from "@/lib/utils";
import type { IdentifyResponse, Table } from "@/lib/types";

const POLL_MS = 2500;

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const code = params.id.toUpperCase();
  const [table, setTable] = useState<Table | null>(null);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const recent = getRecent(code);
    if (!recent) {
      router.replace(`/sessions/join?code=${code}`);
      return;
    }
    setParticipantId(recent.participantId);

    let active = true;
    async function refresh() {
      try {
        const t = await getTable(code);
        if (!active) return;
        setTable(t);
        setError(null);
        if (t.finished_at && !recent!.finishedAt) {
          updateRecent(code, { finishedAt: t.finished_at });
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Could not load table");
      }
    }
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [code, router]);

  if (!table) {
    return (
      <div className="px-5 pt-12">
        <p className="text-gray-500">Loading table {code}...</p>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>
    );
  }

  const totals = tableTotals(table);
  const beat = totals.percentBeaten >= 100;
  const sortedParticipants = table.participants
    .map((p) => ({ ...p, plateValue: participantTotal(table, p.id) }))
    .sort((a, b) => b.plateValue - a.plateValue);

  async function handleCapture(result: IdentifyResponse) {
    if (result.total === 0 || !participantId) return;
    try {
      const updated = await addTableCapture(code, {
        participant_id: participantId,
        total: result.total,
        counts: result.counts,
        pricing: result.pricing,
      });
      setTable(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Capture sync failed");
    }
  }

  async function handleFinish() {
    try {
      await finishTable(code);
      updateRecent(code, { finishedAt: Date.now() / 1000 });
      router.push("/sessions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not finish");
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="px-5 pt-12 pb-6">
      <header className="flex items-center justify-between mb-4">
        <Link
          href="/sessions"
          className="flex items-center gap-1 rounded-full border-2 border-brand px-3 py-1.5 text-brand text-sm font-semibold"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>
        <h1 className="text-lg font-bold truncate">{table.table_name}</h1>
        <span className="w-16" />
      </header>

      <p className="text-gray-500 text-sm mb-5 text-center">
        {table.restaurant} · {table.city}, NY · ${table.ayce_price_per_person.toFixed(2)}/person
      </p>

      <Card className="mb-5 p-4 bg-gray-50 border-gray-100">
        <div className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">
          Share code
        </div>
        <button
          onClick={copyCode}
          className="w-full bg-white rounded-xl p-3 flex items-center justify-between hover:bg-gray-50 transition"
        >
          <span className="text-2xl font-mono font-bold tracking-widest">{code}</span>
          {copied ? (
            <Check className="size-5 text-emerald-600" />
          ) : (
            <Copy className="size-5 text-gray-400" />
          )}
        </button>
      </Card>

      <Card className={`mb-5 p-5 ${beat ? "bg-emerald-50 border-emerald-200" : ""}`}>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-sm font-medium text-gray-500">Total plate value</span>
          <span className={`text-3xl font-bold ${beat ? "text-emerald-600" : "text-gray-900"}`}>
            {formatCurrency(totals.plateValue)}
          </span>
        </div>
        <div className="flex items-baseline justify-between text-sm text-gray-500">
          <span>
            Paid {formatCurrency(totals.totalCost)}
            {table.participants.length > 1 && ` (${table.participants.length} people)`}
          </span>
          <span className={`font-semibold ${beat ? "text-emerald-600" : "text-brand"}`}>
            {Math.round(totals.percentBeaten)}% {beat ? "beaten 🎉" : "beaten"}
          </span>
        </div>
      </Card>

      <div className="mb-5">
        <h2 className="text-base font-bold mb-2">Players ({table.participants.length})</h2>
        <Card className="p-2">
          {sortedParticipants.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center justify-between px-2 py-2 border-b last:border-b-0 border-gray-100"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{["🥇", "🥈", "🥉"][i] ?? "🍽️"}</span>
                <span className="font-medium">
                  {p.name}
                  {p.id === participantId && <span className="text-gray-400 text-sm"> (you)</span>}
                </span>
              </div>
              <span className="font-semibold text-emerald-600">
                {formatCurrency(p.plateValue)}
              </span>
            </div>
          ))}
        </Card>
      </div>

      {!table.finished_at && (
        <CameraCapture location={table.city} onCapture={handleCapture} />
      )}

      <div className="mt-6">
        <h2 className="text-base font-bold mb-2">
          Recent captures ({table.captures.length})
        </h2>
        {table.captures.length === 0 ? (
          <p className="text-sm text-gray-500">
            No plates captured yet. Capture one and it&rsquo;ll show here for everyone at the table.
          </p>
        ) : (
          <div className="space-y-2">
            {table.captures
              .slice()
              .reverse()
              .map((c) => {
                const who = table.participants.find((p) => p.id === c.participant_id);
                return (
                  <Card key={c.id} className="p-3 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium">
                        {who?.name ?? "?"} · {c.total} piece{c.total === 1 ? "" : "s"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {c.counts.map((x) => `${x.count}× ${x.display}`).join(", ")}
                      </div>
                    </div>
                    <div className="font-bold text-emerald-600">
                      {c.pricing.total != null ? formatCurrency(c.pricing.total) : "—"}
                    </div>
                  </Card>
                );
              })}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

      {!table.finished_at && (
        <Button variant="outline" onClick={handleFinish} className="w-full mt-6">
          Finish session
        </Button>
      )}
    </div>
  );
}
