"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Constants } from "@/lib/supabase/database.types";

const SPORT_TYPES = Constants.public.Enums.sport;

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? "00" : "30";
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const period = h < 12 ? "AM" : "PM";
  return {
    value: `${String(h).padStart(2, "0")}:${m}`,
    label: `${hour12}:${m} ${period}`,
  };
});

function toDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getAvailableTimeSlots(date: string, today: string) {
  if (date !== today) return TIME_SLOTS;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return TIME_SLOTS.filter(({ value }) => {
    const [h, m] = value.split(":").map(Number);
    return h * 60 + m > currentMinutes;
  });
}

type Venue = { id: string; name: string };

type VenueAssignment = {
  venue_id: string;
  date: string;
  time: string;
};

type FormValues = {
  name: string;
  sport_type: string;
  description: string;
  assignments: VenueAssignment[];
};

export function AddEventButton({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [today, setToday] = useState("");

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } =
    useForm<FormValues>({
      defaultValues: {
        name: "",
        sport_type: "",
        description: "",
        assignments: [{ venue_id: "", date: "", time: "" }],
      },
    });

  const { fields, append, remove } = useFieldArray({ control, name: "assignments" });

  const assignments = watch("assignments");

  useEffect(() => {
    if (!open) return;
    setToday(toDateString(new Date()));
    fetch("/api/venues")
      .then((res) => res.json())
      .then((data) => setVenues(data))
      .catch(() => toast.error("Failed to load venues."));
  }, [open]);

  function handleClose() {
    setOpen(false);
    reset();
  }

  async function onSubmit(values: FormValues) {
    const hasPartial = values.assignments.some(
      (a) =>
        [a.venue_id, a.date, a.time].filter(Boolean).length > 0 &&
        [a.venue_id, a.date, a.time].some((v) => !v)
    );
    if (hasPartial) {
      toast.error("Each venue assignment needs a venue, date, and time.");
      return;
    }

    const filledAssignments = values.assignments.filter(
      (a) => a.venue_id && a.date && a.time
    );
    if (filledAssignments.length === 0) {
      toast.error("At least one venue with a scheduled date and time is required.");
      return;
    }

    setSubmitting(true);
    try {
      const eventRes = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          sport_type: values.sport_type,
          description: values.description,
        }),
      });

      const eventJson = await eventRes.json();
      if (!eventRes.ok) {
        toast.error(eventJson.error ?? "Failed to create event.");
        return;
      }

      const eventId: string = eventJson.id;

      const venueErrors: string[] = [];
      await Promise.all(
        filledAssignments.map(async (a) => {
          const res = await fetch("/api/event-venues", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              event_id: eventId,
              venue_id: a.venue_id,
              scheduled_at: `${a.date}T${a.time}:00`,
            }),
          });
          if (!res.ok) {
            const json = await res.json();
            venueErrors.push(json.error ?? "Failed to assign venue.");
          }
        })
      );

      if (venueErrors.length > 0) {
        venueErrors.forEach((err) => toast.error(err));
      } else {
        toast.success(`Event "${eventJson.name}" created.`);
      }

      handleClose();
      onSuccess?.();
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add Event</Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Event</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Event name"
                {...register("name", { required: "Name is required" })}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Sport Type</Label>
              <Select
                value={watch("sport_type") || undefined}
                onValueChange={(v) => setValue("sport_type", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a sport" />
                </SelectTrigger>
                <SelectContent>
                  {SPORT_TYPES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.sport_type && (
                <p className="text-xs text-destructive">{errors.sport_type.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Optional"
                {...register("description")}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Venues</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ venue_id: "", date: "", time: "" })}
                >
                  <Plus size={13} className="mr-1" /> Add Venue
                </Button>
              </div>

              {fields.map((field, i) => {
                const currentDate = assignments[i]?.date ?? "";
                const availableSlots = getAvailableTimeSlots(currentDate, today);
                return (
                  <div key={field.id} className="flex flex-col gap-2 border rounded-md p-3">
                    <Select
                      value={assignments[i]?.venue_id || undefined}
                      onValueChange={(v) => setValue(`assignments.${i}.venue_id`, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select venue" />
                      </SelectTrigger>
                      <SelectContent>
                        {venues.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                      <Input
                        type="date"
                        min={today}
                        className="flex-1"
                        {...register(`assignments.${i}.date`, {
                          onChange: () => {
                            setValue(`assignments.${i}.time`, "");
                          },
                        })}
                      />

                      <Select
                        value={assignments[i]?.time || undefined}
                        onValueChange={(v) => setValue(`assignments.${i}.time`, v)}
                        disabled={!currentDate}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSlots.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(i)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
