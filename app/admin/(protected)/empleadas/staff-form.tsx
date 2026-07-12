"use client";

import { useActionState } from "react";
import { createStaff, updateStaff, type StaffFormState } from "./actions";
import { Button, Field, Input, ErrorText } from "@/components/admin/ui";

const initialState: StaffFormState = {};

interface StaffFormProps {
  staff?: { id: string; name: string; phone: string | null };
}

export function StaffForm({ staff }: StaffFormProps) {
  const action = staff ? updateStaff : createStaff;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      {staff && <input type="hidden" name="id" value={staff.id} />}
      <Field label="Nombre" className="min-w-[10rem] flex-1">
        <Input name="name" defaultValue={staff?.name} required placeholder="Ej. Daniela" />
      </Field>
      <Field label="Teléfono" className="min-w-[10rem] flex-1">
        <Input name="phone" defaultValue={staff?.phone ?? ""} placeholder="Opcional" />
      </Field>
      <Button type="submit" variant="primary" pending={pending}>
        {staff ? "Guardar" : "Agregar"}
      </Button>
      <ErrorText>{state.error}</ErrorText>
    </form>
  );
}
