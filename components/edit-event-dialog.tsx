"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Constants } from "@/lib/supabase/database.types";

const SPORT_TYPES = Constants.public.Enums.sport;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: {
    id: string;
    name: string;
    sport_type: string;
    description: string | null;
  };
  onSuccess: () => void;
};

type FormValues = {
  name: string;
  sport_type: string;
  description: string;
};

export function EditEventDialog({ open, onOpenChange, event, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } =
    useForm<FormValues>({
      defaultValues: {
        name: event.name,
        sport_type: event.sport_type,
        description: event.description ?? "",
      },
    });

  useEffect(() => {
    reset({
      name: event.name,
      sport_type: event.sport_type,
      description: event.description ?? "",
    });
  }, [event, reset]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Failed to update event.");
        return;
      }

      toast.success(`Event "${json.name}" updated.`);
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
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
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              placeholder="Optional"
              {...register("description")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
