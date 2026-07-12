"use client";

import { useActionState } from "react";
import { addScheduleRange, type HorarioFormState } from "./actions";
import { Button, Input, ErrorText } from "@/components/admin/ui";

const initialState: HorarioFormState = {};

export function RangeForm({ staffId, weekday }: { staffId: string; weekday: number }) {
  const [state, formAction, pending] = useActionState(addScheduleRange, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="staff_id" value={staffId} />
      <input type="hidden" name="weekday" value={weekday} />
      <Input name="start_time" type="time" required className="w-28" />
      <span className="pb-1.5 text-xs text-ink-soft">a</span>
      <Input name="end_time" type="time" required className="w-28" />
      <Button type="submit" size="sm" variant="primary" pending={pending}>
        Agregar
      </Button>
      <ErrorText>{state.error}</ErrorText>
    </form>
  );
}
