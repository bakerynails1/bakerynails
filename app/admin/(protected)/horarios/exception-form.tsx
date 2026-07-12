"use client";

import { useActionState, useState } from "react";
import { addException, type HorarioFormState } from "./actions";
import { Button, Field, Input, ErrorText } from "@/components/admin/ui";

const initialState: HorarioFormState = {};

export function ExceptionForm({ staffId }: { staffId: string }) {
  const [state, formAction, pending] = useActionState(addException, initialState);
  const [isDayOff, setIsDayOff] = useState(true);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="staff_id" value={staffId} />
      <Field label="Fecha">
        <Input name="date" type="date" required className="w-40" />
      </Field>
      <label className="flex items-center gap-1.5 pb-1.5 text-sm text-ink">
        <input
          type="checkbox"
          name="is_day_off"
          checked={isDayOff}
          onChange={(e) => setIsDayOff(e.target.checked)}
          className="h-4 w-4 rounded border-line accent-brand-500"
        />
        Día libre completo
      </label>
      {!isDayOff && (
        <>
          <Field label="Desde">
            <Input name="start_time" type="time" className="w-28" />
          </Field>
          <Field label="Hasta">
            <Input name="end_time" type="time" className="w-28" />
          </Field>
        </>
      )}
      <Button type="submit" variant="primary" pending={pending}>
        Agregar excepción
      </Button>
      <ErrorText>{state.error}</ErrorText>
    </form>
  );
}
