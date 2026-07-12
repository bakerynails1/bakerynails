"use client";

import { useActionState } from "react";
import { addScheduleRange, type HorarioFormState } from "./actions";

const initialState: HorarioFormState = {};
const WEEKDAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function RangeForm({ staffId, weekday }: { staffId: string; weekday: number }) {
  const [state, formAction, pending] = useActionState(addScheduleRange, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="staff_id" value={staffId} />
      <input type="hidden" name="weekday" value={weekday} />
      <div>
        <label className="block text-xs text-neutral-500">Desde</label>
        <input name="start_time" type="time" required className="rounded-md border border-neutral-300 px-2 py-1 text-sm" />
      </div>
      <div>
        <label className="block text-xs text-neutral-500">Hasta</label>
        <input name="end_time" type="time" required className="rounded-md border border-neutral-300 px-2 py-1 text-sm" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-2 py-1 text-xs text-white disabled:opacity-50"
      >
        {pending ? "..." : `Agregar a ${WEEKDAY_LABELS[weekday]}`}
      </button>
      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
