import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };
type UpdateVenueBody = Pick<TablesUpdate<"venues">, "name" | "address" | "capacity">;

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body: UpdateVenueBody = await request.json();
  const { name, address, capacity } = body;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .update({
      ...(name !== undefined && { name }),
      ...(address !== undefined && { address }),
      ...(capacity !== undefined && { capacity }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Venue not found" }, { status: 404 });
    }
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A venue with this name already exists" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase.from("venues").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
