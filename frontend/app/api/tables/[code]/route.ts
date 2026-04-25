import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function getFullTable(supabase: Awaited<ReturnType<typeof createClient>>, code: string) {
  // Get the table
  const { data: table, error: tableError } = await supabase
    .from("game_tables")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();

  if (tableError || !table) {
    return null;
  }

  // Get participants
  const { data: participants } = await supabase
    .from("participants")
    .select("*")
    .eq("table_id", table.id)
    .order("joined_at", { ascending: true });

  // Get captures
  const { data: captures } = await supabase
    .from("captures")
    .select("*")
    .eq("table_id", table.id)
    .order("timestamp", { ascending: true });

  // Format the response
  return {
    code: table.code,
    table_name: table.table_name,
    restaurant: table.restaurant,
    city: table.city,
    ayce_price_per_person: Number(table.ayce_price_per_person),
    tax_included: table.tax_included,
    tip_percent: Number(table.tip_percent),
    created_at: new Date(table.created_at).getTime() / 1000,
    finished_at: table.finished_at ? new Date(table.finished_at).getTime() / 1000 : null,
    participants: (participants || []).map((p) => ({
      id: p.id,
      name: p.name,
      joined_at: new Date(p.joined_at).getTime() / 1000,
    })),
    captures: (captures || []).map((c) => ({
      id: c.id,
      participant_id: c.participant_id,
      timestamp: new Date(c.timestamp).getTime() / 1000,
      total: c.total,
      counts: c.counts,
      pricing: c.pricing,
    })),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createClient();
    const table = await getFullTable(supabase, code);

    if (!table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    return NextResponse.json(table);
  } catch (error) {
    console.error("Error in GET /api/tables/[code]:", error);
    return NextResponse.json(
      { error: "Failed to get table" },
      { status: 500 }
    );
  }
}
