import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function generateCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      table_name,
      restaurant,
      city,
      ayce_price_per_person,
      tax_included,
      tip_percent,
      host_name,
    } = body;

    const supabase = await createClient();

    // Generate a unique code
    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from("game_tables")
        .select("code")
        .eq("code", code)
        .single();
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    // Create the table
    const { data: table, error: tableError } = await supabase
      .from("game_tables")
      .insert({
        code,
        table_name,
        restaurant,
        city,
        ayce_price_per_person,
        tax_included,
        tip_percent,
      })
      .select()
      .single();

    if (tableError) {
      console.error("Error creating table:", tableError);
      return NextResponse.json({ error: tableError.message }, { status: 500 });
    }

    // Create the host participant
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .insert({
        table_id: table.id,
        name: host_name?.trim() || "Player",
      })
      .select()
      .single();

    if (participantError) {
      console.error("Error creating participant:", participantError);
      return NextResponse.json({ error: participantError.message }, { status: 500 });
    }

    // Format the response to match the expected structure
    const formattedTable = {
      code: table.code,
      table_name: table.table_name,
      restaurant: table.restaurant,
      city: table.city,
      ayce_price_per_person: Number(table.ayce_price_per_person),
      tax_included: table.tax_included,
      tip_percent: Number(table.tip_percent),
      created_at: new Date(table.created_at).getTime() / 1000,
      finished_at: table.finished_at ? new Date(table.finished_at).getTime() / 1000 : null,
      participants: [
        {
          id: participant.id,
          name: participant.name,
          joined_at: new Date(participant.joined_at).getTime() / 1000,
        },
      ],
      captures: [],
    };

    return NextResponse.json({
      table: formattedTable,
      participant_id: participant.id,
    });
  } catch (error) {
    console.error("Error in POST /api/tables:", error);
    return NextResponse.json(
      { error: "Failed to create table" },
      { status: 500 }
    );
  }
}
