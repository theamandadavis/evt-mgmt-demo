"use client";

import { useEffect, useState, useCallback } from "react";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MapPin, Users, Calendar, Pencil, Trash2, X } from "lucide-react";
import { AddEventButton } from "@/components/add-event-button";
import { EditEventDialog } from "@/components/edit-event-dialog";
import { Constants } from "@/lib/supabase/database.types";

const SPORT_TYPES = Constants.public.Enums.sport;

type VenueDetail = {
  scheduled_at: string;
  venue: {
    id: string;
    name: string;
    address: string;
    capacity: number;
  };
};

type EventVenueRow = {
  event_id: string | null;
  event_name: string | null;
  sport_type: string | null;
  description: string | null;
  venues_details: VenueDetail[] | null;
};

type EditTarget = {
  id: string;
  name: string;
  sport_type: string;
  description: string | null;
};

export function EventVenueList() {
  const [events, setEvents] = useState<EventVenueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 300);
  const [sportFilter, setSportFilter] = useState("");
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EventVenueRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEvents = useCallback(async (name?: string, sportType?: string) => {
    try {
      const params = new URLSearchParams();
      if (name) params.set("name", name);
      if (sportType) params.set("sportType", sportType);
      const query = params.toString() ? `?${params}` : "";
      const res = await fetch(`/api/event-venues${query}`, { cache: "no-store" });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? "Failed to load events.");
        return;
      }
      const data = await res.json();
      setEvents(data);
    } catch {
      toast.error("An unexpected error occurred loading events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    setLoading(true);
    fetchEvents(debouncedSearch || undefined, sportFilter || undefined);
  }, [debouncedSearch, sportFilter, fetchEvents]);

  function handleSportFilter(value: string) {
    setSportFilter(value === "all" ? "" : value);
  }

  function handleClearFilters() {
    setSearch("");
    setSportFilter("");
  }

  async function handleDelete() {
    if (!deleteTarget?.event_id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${deleteTarget.event_id}`, {
        method: "DELETE",
      });

      if (!res.ok && res.status !== 204) {
        const json = await res.json();
        toast.error(json.error ?? "Failed to delete event.");
        return;
      }

      toast.success(`Event "${deleteTarget.event_name}" deleted.`);
      setDeleteTarget(null);
      fetchEvents(search || undefined, sportFilter || undefined);
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Upcoming Events</h1>
        <AddEventButton onSuccess={() => fetchEvents(search || undefined, sportFilter || undefined)} />
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 items-center">
        <div className="relative max-w-sm w-full">
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-8"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearFilters}
              aria-label="Clear search"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground"
            >
              <X size={14} />
            </Button>
          )}
        </div>

        <Select value={sportFilter || "all"} onValueChange={handleSportFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All sports" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sports</SelectItem>
            {SPORT_TYPES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <p className="text-muted-foreground">Loading events...</p>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground">No events found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {events.map((event, i) => {
            const venues = event.venues_details ?? [];
            return (
              <Card key={event.event_id ?? i}>
                <CardContent className="p-4">
                  <div className="grid grid-cols-[1fr_auto] items-start gap-4">
                    {/* Left: event info + venues */}
                    <div className="grid grid-cols-[180px_1fr] gap-x-6 gap-y-1 items-start">
                      {/* Event name, badge, description */}
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-sm">{event.event_name}</span>
                        {event.sport_type && (
                          <Badge variant="secondary" className="capitalize w-fit text-xs">
                            {event.sport_type}
                          </Badge>
                        )}
                        {event.description && (
                          <span className="text-xs text-muted-foreground line-clamp-2">
                            {event.description}
                          </span>
                        )}
                      </div>

                      {/* Venues */}
                      <div className="flex flex-col gap-2">
                        {venues.length > 0 ? (
                          venues.map((item, j) => (
                            <div
                              key={item.venue?.id ? `${item.venue.id}-${item.scheduled_at}` : j}
                              className="grid grid-cols-[1fr_auto_auto] gap-x-6 gap-y-0.5 text-xs text-muted-foreground items-center"
                            >
                              <span className="font-medium text-foreground">{item.venue?.name}</span>
                              <div className="flex items-center gap-1">
                                <MapPin size={11} className="shrink-0" />
                                <span>{item.venue?.address}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <Users size={11} className="shrink-0" />
                                  <span>{item.venue?.capacity?.toLocaleString() ?? "N/A"}</span>
                                </div>
                                {item.scheduled_at && (
                                  <div className="flex items-center gap-1">
                                    <Calendar size={11} className="shrink-0" />
                                    <span>
                                      {new Date(item.scheduled_at).toLocaleDateString(undefined, {
                                        dateStyle: "medium",
                                      })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No venues assigned.</span>
                        )}
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          event.event_id &&
                          setEditTarget({
                            id: event.event_id,
                            name: event.event_name ?? "",
                            sport_type: event.sport_type ?? "",
                            description: event.description,
                          })
                        }
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(event)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit dialog */}
      {editTarget && (
        <EditEventDialog
          open={!!editTarget}
          onOpenChange={(v) => !v && setEditTarget(null)}
          event={editTarget}
          onSuccess={() => fetchEvents(search || undefined, sportFilter || undefined)}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{deleteTarget?.event_name}</span>? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
