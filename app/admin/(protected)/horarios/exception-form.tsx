"use client";

import { useActionState, useState } from "react";
import { addException, type HorarioFormState } from "./actions";

const initialState: HorarioFormState = {};

export function ExceptionForm({ staffId }: { staffId: string }) {
  const [state, formAction, pending] = useActionState(addException, initialState);
  const [isDayOff, setIsDayOff] = useState(true);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="staff_id" value={staffId} />
      <div>
        <label className="block text-xs text-neutral-500">Fecha</label>
        <input name="date" type="date" required className="rounded-md border border-neutral-300 px-2 py-1 text-sm" />
      </div>
      <label className="flex items-center gap-1 text-xs text-neutral-600">
        <input
          type="checkbox"
          name="is_day_off"
          checked={isDayOff}
          onChange={(e) => setIsDayOff(e.target.checked)}
        />
        Día libre completo
      </label>
      {!isDayOff && (
        <>
          <div>
            <label className="block text-xs text-neutral-500">Desde</label>
            <input name="start_time" type="time" className="rounded-md border border-neutral-300 px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="block text-xs text-neutral-500">Hasta</label>
            <input name="end_time" type="time" className="rounded-md border border-neutral-300 px-2 py-1 text-sm" />
          </div>
        </>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-brand-500 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Agregar excepción"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
