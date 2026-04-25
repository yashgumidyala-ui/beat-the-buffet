"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CameraCapture } from "@/components/camera-capture";
import { addCapture, finishSession, getSession } from "@/lib/storage";
import { sessionTotals } from "@/lib/session-math";
import { formatCurrency } from "@/lib/utils";
import type { Capture, IdentifyResponse, Session } from "@/lib/types";

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    setSession(getSession(params.id));
  }, [params.id]);

  if (session === undefined) return null;
  if (session === null) {
    return (
      <div className="px-5 pt-12">
        <p>Session not found.</p>
        <Link href="/sessions" className="text-brand">Back to sessions</Link>
      </div>
    );
  }

  function handleCapture(result: IdentifyResponse) {
    if (!session) return;
    if (result.total === 0) return;
    const capture: Capture = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      total: result.total,
      counts: result.counts,
      pricing: result.pricing,
    };
    const updated = addCapture(session.id, capture);
    if (updated) setSession({ ...updated });
  }

  function handleFinish() {
    if (!session) return;
    finishSession(session.id);
    router.push("/sessions");
  }

  const { plateValue, costPaid, percentBeaten } = sessionTotals(session);
  const beat = percentBeaten >= 100;

  return (
    <div className="px-5 pt-12 pb-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold truncate">{session.tableName}</h1>
        <Link
          href="/sessions"
          className="flex items-center gap-1 rounded-full border-2 border-brand px-3 py-1.5 text-brand text-sm font-semibold"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>
      </header>

      <p className="text-gray-500 -mt-4 mb-6 text-sm">
        {session.restaurant} · {session.city}, NY · ${session.aycePricePerPerson.toFixed(2)}/person
      </p>

      <Card className={`mb-5 p-5 ${beat ? "bg-emerald-50 border-emerald-200" : ""}`}>
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-sm font-medium text-gray-500">Plate value</span>
          <span className={`text-3xl font-bold ${beat ? "text-emerald-600" : "text-gray-900"}`}>
            {formatCurrency(plateValue)}
          </span>
        </div>
        <div className="flex items-baseline justify-between text-sm text-gray-500">
          <span>You paid {formatCurrency(costPaid)}</span>
          <span className={`font-semibold ${beat ? "text-emerald-600" : "text-brand"}`}>
            {Math.round(percentBeaten)}% {beat ? "beaten 🎉" : "beaten"}
          </span>
        </div>
      </Card>

      <CameraCapture location={session.city} onCapture={handleCapture} />

      <div className="mt-6">
        <h2 className="text-lg font-bold mb-3">
          Captures ({session.captures.length})
        </h2>
        {session.captures.length === 0 ? (
          <p className="text-sm text-gray-500">
            No plates captured yet. Point your camera at your sushi and tap capture.
          </p>
        ) : (
          <div className="space-y-2">
            {session.captures
              .slice()
              .reverse()
              .map((c) => (
                <Card key={c.id} className="p-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">
                      {c.total} piece{c.total === 1 ? "" : "s"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {c.counts.map((x) => `${x.count}× ${x.display}`).join(", ")}
                    </div>
                  </div>
                  <div className="font-bold text-emerald-600">
                    {c.pricing.total != null ? formatCurrency(c.pricing.total) : "—"}
                  </div>
                </Card>
              ))}
          </div>
        )}
      </div>

      {!session.finishedAt && (
        <Button variant="outline" onClick={handleFinish} className="w-full mt-6">
          Finish session
        </Button>
      )}
    </div>
  );
}
