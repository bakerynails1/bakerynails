"use client";

import { useActionState } from "react";
import { createStaff, updateStaff, type StaffFormState } from "./actions";

const initialState: StaffFormState = {};

interface StaffFormProps {
  staff?: { id: string; name: string; phone: string | null };
}

export function StaffForm({ staff }: StaffFormProps) {
  const action = staff ? updateStaff : createStaff;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      {staff && <input type="hidden" name="id" value={staff.id} />}
      <div>
        <label className="block text-xs text-neutral-500">Nombre</label>
        <input
          name="name"
          defaultValue={staff?.name}
          required
          className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-500">Teléfono</label>
        <input
          name="phone"
          defaultValue={staff?.phone ?? ""}
          className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Guardando..." : staff ? "Guardar" : "Agregar"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
