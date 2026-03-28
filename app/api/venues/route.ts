import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/database.types";
import { NextRequest, NextResponse } from "next/server";

type CreateVenueBody = Pick<TablesInsert<"venues">, "name" | "address" | "capacity">;

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body: CreateVenueBody = await request.json();
  const { name, address, capacity } = body;

  if (!name || !address || capacity === undefined) {
    return NextResponse.json(
      { error: "name, address, and capacity are required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .insert({ name, address, capacity })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A venue with this name already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
