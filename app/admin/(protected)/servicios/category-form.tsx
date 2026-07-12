"use client";

import { useActionState } from "react";
import { createCategory, type ServiceFormState } from "./actions";

const initialState: ServiceFormState = {};

export function CategoryForm() {
  const [state, formAction, pending] = useActionState(createCategory, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="block text-xs text-neutral-500">Nueva categoría</label>
        <input name="name" required placeholder="Ej. Manos" className="rounded-md border border-neutral-300 px-2 py-1 text-sm" />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Agregar categoría"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
