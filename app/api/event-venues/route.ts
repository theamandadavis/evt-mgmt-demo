import { createClient } from "@/lib/supabase/server";
import type {
  TablesInsert,
  Enums,
  Database,
} from "@/lib/supabase/database.types";
import { NextRequest, NextResponse } from "next/server";

type CreateEventVenueBody = Pick<
  TablesInsert<"event_venues">,
  "event_id" | "venue_id" | "scheduled_at"
>;

export type SportType = Enums<"sport">;

export type View<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = request.nextUrl;
  const name = searchParams.get("name");
  const sportType = searchParams.get("sportType") as SportType | null;

  let query = supabase
    .from("formatted_event_details")
    .select("event_id, event_name, sport_type, description, venues_details")
    .order("event_name", { ascending: true });

  if (name) query = query.ilike("event_name", `%${name}%`);

  if (sportType) query = query.eq("sport_type", sportType);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body: CreateEventVenueBody = await request.json();
  const { event_id, venue_id, scheduled_at } = body;

  if (!event_id || !venue_id || !scheduled_at) {
    return NextResponse.json(
      { error: "event_id, venue_id, and scheduled_at are required" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_venues")
    .insert({ event_id, venue_id, scheduled_at })
    .select("*, events(*), venues(*)")
    .single();

  if (error) {
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

  return NextResponse.json(data, { status: 201 });
}
