"use client";

import { useTransition } from "react";
import { setAssignment } from "./actions";

interface AssignmentCheckboxProps {
  staffId: string;
  serviceId: string;
  defaultChecked: boolean;
}

export function AssignmentCheckbox({ staffId, serviceId, defaultChecked }: AssignmentCheckboxProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <input
      type="checkbox"
      defaultChecked={defaultChecked}
      disabled={isPending}
      onChange={(event) => {
        const checked = event.target.checked;
        startTransition(async () => {
          await setAssignment(staffId, serviceId, checked);
        });
      }}
      className="h-4 w-4"
    />
  );
}
