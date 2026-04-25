"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SessionCard } from "@/components/session-card";
import { listSessions } from "@/lib/storage";
import type { Session } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "planned" | "in-progress" | "finished";

export default function SessionsPage() {
  const [tab, setTab] = useState<Tab>("in-progress");
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    setSessions(listSessions());
  }, []);

  const inProgress = sessions.filter((s) => !s.finishedAt);
  const finished = sessions.filter((s) => s.finishedAt);

  return (
    <div className="px-5 pt-12">
      <header className="flex items-center justify-between mb-6">
        <span className="w-6" />
        <h1 className="text-xl font-bold">Sessions</h1>
        <button aria-label="Search" className="text-brand">
          <Search className="size-6" />
        </button>
      </header>

      <div className="mb-8 flex rounded-full bg-gray-100 p-1 text-sm font-semibold">
        {(["planned", "in-progress", "finished"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-full py-2.5 capitalize transition",
              tab === t ? "bg-white shadow text-gray-900" : "text-gray-500",
            )}
          >
            {t.replace("-", " ")}
          </button>
        ))}
      </div>

      {tab === "in-progress" && <InProgressView sessions={inProgress} />}
      {tab === "finished" && <FinishedView sessions={finished} />}
      {tab === "planned" && (
        <p className="text-center text-gray-500 mt-10">Planned sessions coming soon.</p>
      )}
    </div>
  );
}

function InProgressView({ sessions }: { sessions: Session[] }) {
  if (sessions.length > 0) {
    return (
      <div className="space-y-4">
        {sessions.map((s) => (
          <SessionCard key={s.id} session={s} />
        ))}
        <Link href="/sessions/new" className="block pt-4">
          <Button className="w-full">+ Start another table</Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-3">Get ready to...</h2>
        <Image
          src="/wordmark.png"
          alt="beat the buffet"
          width={400}
          height={80}
          className="mx-auto h-12 w-auto"
          priority
        />
        <p className="text-gray-500 mt-3">Prepare your body and your table.</p>
      </div>

      <Card className="p-6 bg-gray-50 border-gray-100">
        <div className="aspect-[4/3] rounded-xl bg-white flex items-center justify-center mb-4">
          <Emoji label="🍣" />
        </div>
        <Link href="/sessions/new">
          <Button className="w-full">Create a table</Button>
        </Link>
      </Card>

      <Card className="p-6 bg-gray-50 border-gray-100">
        <div className="aspect-[4/3] rounded-xl bg-white flex items-center justify-center mb-4">
          <Emoji label="👥" />
        </div>
        <Button className="w-full" disabled title="Multi-user coming in phase 3">
          Join a table
        </Button>
      </Card>
    </div>
  );
}

function FinishedView({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) {
    return (
      <div className="text-center pt-8">
        <div className="text-7xl mb-6">😮‍💨</div>
        <h2 className="text-2xl font-bold mb-2">Nothing here. For now.</h2>
        <p className="text-gray-500 mb-6">This is where you&rsquo;ll find your previous sessions.</p>
        <Link href="/sessions/new">
          <Button>Start a session</Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-5">
      {sessions.map((s) => (
        <SessionCard key={s.id} session={s} />
      ))}
    </div>
  );
}

function Emoji({ label }: { label: string }) {
  return <div className="text-6xl" role="img">{label}</div>;
}
