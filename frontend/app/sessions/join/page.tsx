"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinTable } from "@/lib/api";
import { getUserName, rememberTable, setUserName } from "@/lib/storage";

function JoinForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState(params.get("code")?.toUpperCase() ?? "");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(getUserName());
  }, []);

  const valid = code.trim().length === 6 && name.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setError(null);
    try {
      setUserName(name);
      const { table, participant_id } = await joinTable(code.trim().toUpperCase(), name.trim());
      rememberTable({
        code: table.code,
        participantId: participant_id,
        tableName: table.table_name,
        restaurant: table.restaurant,
        city: table.city,
        joinedAt: Date.now(),
        finishedAt: table.finished_at,
      });
      router.push(`/sessions/${table.code}`);
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes("404")
          ? "Table not found — double check the code"
          : err instanceof Error
            ? err.message
            : "Could not join",
      );
      setBusy(false);
    }
  }

  return (
    <div className="px-5 pt-12">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Join a table</h1>
        <Link
          href="/sessions"
          className="flex items-center gap-1 rounded-full border-2 border-brand px-4 py-2 text-brand font-semibold"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>
      </header>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="code">Table code</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
            placeholder="MZ4K2P"
            className="font-mono tracking-widest text-center text-xl uppercase"
            autoComplete="off"
            inputMode="text"
            required
          />
        </div>

        <div>
          <Label htmlFor="name">Your name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah"
            required
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={!valid || busy} className="w-full">
          {busy ? "Joining..." : "Join table"}
        </Button>
      </form>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinForm />
    </Suspense>
  );
}
