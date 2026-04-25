"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { fetchLocations, prewarm } from "@/lib/api";
import { createSession } from "@/lib/storage";

export default function NewTablePage() {
  const router = useRouter();
  const [tableName, setTableName] = useState("");
  const [restaurant, setRestaurant] = useState("");
  const [aycePrice, setAycePrice] = useState("");
  const [taxIncluded, setTaxIncluded] = useState(true);
  const [tipPercent, setTipPercent] = useState("");
  const [city, setCity] = useState("New York");
  const [cities, setCities] = useState<string[]>(["New York"]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLocations()
      .then((data) => {
        setCities(data.locations);
        setCity(data.default);
      })
      .catch(() => {
        // Fall back silently — backend may not be reachable yet.
      });
  }, []);

  const valid = tableName.trim() !== "" && restaurant.trim() !== "" && Number(aycePrice) > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      // Best-effort prewarm so first capture is fast.
      prewarm(city).catch(() => {});
      const session = createSession({
        tableName: tableName.trim(),
        restaurant: restaurant.trim(),
        city,
        aycePricePerPerson: Number(aycePrice),
        taxIncluded,
        tipPercent: tipPercent === "" ? 0 : Number(tipPercent),
      });
      router.push(`/sessions/${session.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create session");
      setSubmitting(false);
    }
  }

  return (
    <div className="px-5 pt-12">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">New table</h1>
        <Link
          href="/sessions"
          className="flex items-center gap-1 rounded-full border-2 border-brand px-4 py-2 text-brand font-semibold"
        >
          <ArrowLeft className="size-4" /> Back
        </Link>
      </header>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="tableName">Table name</Label>
          <Input
            id="tableName"
            placeholder="e.g. Rick&rsquo;s Table"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            className={tableName ? undefined : "border-brand"}
            required
          />
        </div>

        <div>
          <Label htmlFor="restaurant">Restaurant</Label>
          <Input
            id="restaurant"
            placeholder="e.g. Kaiten Sushi, NYC"
            value={restaurant}
            onChange={(e) => setRestaurant(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="ayce">AYCE price per person</Label>
          <Input
            id="ayce"
            type="number"
            inputMode="decimal"
            placeholder="e.g. $35"
            value={aycePrice}
            onChange={(e) => setAycePrice(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="city">Pricing city</Label>
          <select
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-200 bg-transparent px-4 py-3 text-base focus:border-brand focus:outline-none"
          >
            {cities.map((c) => (
              <option key={c} value={c}>{c}, NY</option>
            ))}
          </select>
        </div>

        <div className="pt-4">
          <h2 className="text-2xl font-bold mb-3">Cost options</h2>

          <div className="rounded-2xl bg-gray-200 p-4 flex items-center justify-between">
            <span className="font-semibold">Include tax</span>
            <Switch checked={taxIncluded} onCheckedChange={setTaxIncluded} ariaLabel="Include tax" />
          </div>
          <p className="text-xs text-gray-500 mt-1.5 ml-1">NYC 8.875%</p>

          <div className="mt-5">
            <Label htmlFor="tip">Include tip</Label>
            <Input
              id="tip"
              type="number"
              inputMode="decimal"
              placeholder="e.g. 15%"
              value={tipPercent}
              onChange={(e) => setTipPercent(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={!valid || submitting} className="w-full">
          {submitting ? "Creating..." : "Create & Invite Friends"}
        </Button>
      </form>
    </div>
  );
}
