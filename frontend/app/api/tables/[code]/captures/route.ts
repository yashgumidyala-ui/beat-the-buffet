import { createAdminClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await request.json();
    const { participant_id, total, counts, pricing } = body;

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

    // Verify participant exists
    const { data: participant } = await supabase
      .from("participants")
      .select("*")
      .eq("id", participant_id)
      .eq("session_id", table.id)
      .single();

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      );
    }

    // Create the capture
    const { error: captureError } = await supabase.from("captures").insert({
      session_id: table.id,
      participant_id,
      total,
      counts,
      pricing,
    });

    if (captureError) {
      console.error("Error creating capture:", captureError);
      return NextResponse.json(
        { error: captureError.message },
        { status: 500 }
      );
    }

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
      code: table.code,
      table_name: table.table_name,
      restaurant: table.restaurant,
      city: table.city,
      ayce_price_per_person: Number(table.ayce_price_per_person),
      tax_included: table.tax_included,
      tip_percent: Number(table.tip_percent),
      created_at: new Date(table.created_at).getTime() / 1000,
      finished_at: table.finished_at
        ? new Date(table.finished_at).getTime() / 1000
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
    console.error("Error in POST /api/tables/[code]/captures:", error);
    return NextResponse.json(
      { error: "Failed to add capture" },
      { status: 500 }
    );
  }
}
