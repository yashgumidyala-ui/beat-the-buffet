"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { getUserName } from "@/lib/storage";

export default function ProfilePage() {
  const [name, setName] = useState("");
  useEffect(() => setName(getUserName() || "You"), []);

  return (
    <div className="px-5 pt-12 pb-6">
      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full bg-brand text-white flex items-center justify-center text-4xl font-bold mb-3">
          {(name[0] || "?").toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold">{name}</h1>
        <p className="text-gray-500 text-sm">Buffet warrior · joined Apr 2026</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat label="Sessions" value="12" />
        <Stat label="Beaten" value="9" />
        <Stat label="Win rate" value="75%" />
      </div>

      <h2 className="text-base font-bold mb-2">Achievements</h2>
      <Card className="p-4 space-y-3">
        <Achievement icon="🍣" title="First Plate" desc="Captured your first sushi" />
        <Achievement icon="🥇" title="Buffet Crusher" desc="Beat the buffet 10 times" />
        <Achievement icon="🐟" title="Salmon Specialist" desc="50 salmon nigiri lifetime" />
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3 text-center">
      <div className="text-2xl font-bold text-brand">{value}</div>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
    </Card>
  );
}

function Achievement({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
    </div>
  );
}
