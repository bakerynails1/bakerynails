"use client";

import { useActionState } from "react";
import { confirmBooking, type ConfirmState } from "./actions";
import { btnPrimary } from "@/components/ui";

const initialState: ConfirmState = {};

interface ConfirmFormProps {
  serviceId: string;
  staffId: string;
  startsAt: string;
  name: string;
  phone: string;
  email?: string;
}

export function ConfirmForm({ serviceId, staffId, startsAt, name, phone, email }: ConfirmFormProps) {
  const [state, formAction, pending] = useActionState(confirmBooking, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-3">
      <input type="hidden" name="service_id" value={serviceId} />
      <input type="hidden" name="staff_id" value={staffId} />
      <input type="hidden" name="starts_at" value={startsAt} />
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="phone" value={phone} />
      {email && <input type="hidden" name="email" value={email} />}

      {state.error && (
        <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className={`${btnPrimary} w-full`}>
        {pending ? "Reservando..." : "Confirmar cita 🤍"}
      </button>
    </form>
  );
}
