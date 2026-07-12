"use client";

import { useActionState } from "react";
import { createCategory, type ServiceFormState } from "./actions";
import { Button, Field, Input, ErrorText } from "@/components/admin/ui";

const initialState: ServiceFormState = {};

export function CategoryForm() {
  const [state, formAction, pending] = useActionState(createCategory, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <Field label="Nueva categoría" className="min-w-[10rem]">
        <Input name="name" required placeholder="Ej. Manos" />
      </Field>
      <Button type="submit" variant="primary" pending={pending}>
        Agregar categoría
      </Button>
      <ErrorText>{state.error}</ErrorText>
    </form>
  );
}
