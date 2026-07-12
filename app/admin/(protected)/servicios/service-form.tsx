"use client";

import { useActionState } from "react";
import { createService, updateService, type ServiceFormState } from "./actions";

const initialState: ServiceFormState = {};

interface Category {
  id: string;
  name: string;
}

interface ServiceFormProps {
  categories: Category[];
  service?: {
    id: string;
    category_id: string;
    name: string;
    price_cents: number;
    duration_minutes: number;
    size: string | null;
  };
}

export function ServiceForm({ categories, service }: ServiceFormProps) {
  const action = service ? updateService : createService;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      {service && <input type="hidden" name="id" value={service.id} />}
      <div>
        <label className="block text-xs text-neutral-500">Categoría</label>
        <select
          name="category_id"
          defaultValue={service?.category_id}
          required
          className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
        >
          <option value="" disabled>
            Elige...
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-neutral-500">Nombre</label>
        <input
          name="name"
          defaultValue={service?.name}
          required
          className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-500">Precio (MXN)</label>
        <input
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={service ? (service.price_cents / 100).toFixed(2) : undefined}
          required
          className="w-24 rounded-md border border-neutral-300 px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-500">Duración (min)</label>
        <input
          name="duration_minutes"
          type="number"
          min="1"
          defaultValue={service?.duration_minutes}
          required
          className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-neutral-500">Tamaño (opcional)</label>
        <select
          name="size"
          defaultValue={service?.size ?? ""}
          className="rounded-md border border-neutral-300 px-2 py-1 text-sm"
        >
          <option value="">N/A</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Guardando..." : service ? "Guardar" : "Agregar servicio"}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
