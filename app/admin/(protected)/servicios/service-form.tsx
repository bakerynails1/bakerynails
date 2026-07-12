"use client";

import { useActionState } from "react";
import { createService, updateService, type ServiceFormState } from "./actions";
import { Button, Field, Input, Select, ErrorText } from "@/components/admin/ui";

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
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      {service && <input type="hidden" name="id" value={service.id} />}
      <Field label="Categoría" className="min-w-[9rem]">
        <Select name="category_id" defaultValue={service?.category_id} required>
          <option value="" disabled>
            Elige...
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Nombre" className="min-w-[12rem] flex-1">
        <Input name="name" defaultValue={service?.name} required placeholder="Ej. Gel Manos" />
      </Field>
      <Field label="Precio (MXN)" className="w-28">
        <Input
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={service ? (service.price_cents / 100).toFixed(2) : undefined}
          required
        />
      </Field>
      <Field label="Duración (min)" className="w-24">
        <Input name="duration_minutes" type="number" min="1" defaultValue={service?.duration_minutes} required />
      </Field>
      <Field label="Tamaño" className="w-24">
        <Select name="size" defaultValue={service?.size ?? ""}>
          <option value="">N/A</option>
          <option value="S">S</option>
          <option value="M">M</option>
          <option value="L">L</option>
          <option value="XL">XL</option>
        </Select>
      </Field>
      <Button type="submit" variant="primary" pending={pending}>
        {service ? "Guardar" : "Agregar servicio"}
      </Button>
      <ErrorText>{state.error}</ErrorText>
    </form>
  );
}
