import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import { NextRequest, NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };
type UpdateEventVenueBody = Pick<
  TablesUpdate<"event_venues">,
  "event_id" | "venue_id" | "scheduled_at"
>;


export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_venues")
    .select("*, events(*), venues(*)")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { error: "Event-venue assignment not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body: UpdateEventVenueBody = await request.json();
  const { event_id, venue_id, scheduled_at } = body;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_venues")
    .update({
      ...(event_id !== undefined && { event_id }),
      ...(venue_id !== undefined && { venue_id }),
      ...(scheduled_at !== undefined && { scheduled_at }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*, events(*), venues(*)")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json(
        { error: "Event-venue assignment not found" },
        { status: 404 },
      );
    }
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "This event is already scheduled at this time" },
        { status: 409 },
      );
    }
    if (error.code === "23503") {
      return NextResponse.json(
        { error: "Referenced event or venue does not exist" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from("event_venues")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
