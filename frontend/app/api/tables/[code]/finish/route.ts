import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = createAdminClient();

    // Get the table
    const { data: table, error: tableError } = await supabase
      .from("sessions")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (tableError || !table) {
      return NextResponse.json({ error: "Table not found" }, { status: 404 });
    }

    // Update finished_at if not already set
    if (!table.finished_at) {
      const { error: updateError } = await supabase
        .from("sessions")
        .update({ finished_at: new Date().toISOString() })
        .eq("id", table.id);

      if (updateError) {
        console.error("Error finishing table:", updateError);
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }
    }

    // Get updated table
    const { data: updatedTable } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", table.id)
      .single();

    // Get all participants
    const { data: participants } = await supabase
      .from("participants")
      .select("*")
      .eq("session_id", table.id)
      .order("joined_at", { ascending: true });

    // Get all captures
    const { data: captures } = await supabase
      .from("captures")
      .select("*")
      .eq("session_id", table.id)
      .order("timestamp", { ascending: true });

    // Format the response
    const formattedTable = {
      code: updatedTable!.code,
      table_name: updatedTable!.table_name,
      restaurant: updatedTable!.restaurant,
      city: updatedTable!.city,
      ayce_price_per_person: Number(updatedTable!.ayce_price_per_person),
      tax_included: updatedTable!.tax_included,
      tip_percent: Number(updatedTable!.tip_percent),
      created_at: new Date(updatedTable!.created_at).getTime() / 1000,
      finished_at: updatedTable!.finished_at
        ? new Date(updatedTable!.finished_at).getTime() / 1000
        : null,
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

    return NextResponse.json(formattedTable);
  } catch (error) {
    console.error("Error in POST /api/tables/[code]/finish:", error);
    return NextResponse.json(
      { error: "Failed to finish table" },
      { status: 500 }
    );
  }
}
