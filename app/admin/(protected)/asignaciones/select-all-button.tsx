"use client";

import { useTransition } from "react";
import { setManyAssignments } from "./actions";
import { Button } from "@/components/admin/ui";

export function SelectAllButton({ staffId, serviceIds, assigned }: { staffId: string; serviceIds: string[]; assigned: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      pending={isPending}
      onClick={() => startTransition(async () => await setManyAssignments(staffId, serviceIds, assigned))}
    >
      {assigned ? "Marcar todo" : "Quitar todo"}
    </Button>
  );
}
