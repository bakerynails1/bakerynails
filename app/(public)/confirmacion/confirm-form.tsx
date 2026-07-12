"use client";

import { useActionState } from "react";
import { confirmBooking, type ConfirmState } from "./actions";

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

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Reservando..." : "Confirmar cita"}
      </button>
    </form>
  );
}
