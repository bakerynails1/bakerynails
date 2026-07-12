"use client";

import { useState } from "react";
import { StaffForm } from "./staff-form";
import { toggleStaffActive } from "./actions";
import { Badge, Button, Card } from "@/components/admin/ui";

interface StaffRowProps {
  staff: { id: string; name: string; phone: string | null; active: boolean };
}

export function StaffRow({ staff }: StaffRowProps) {
  const [editing, setEditing] = useState(false);

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-medium text-ink">
            {staff.name}
            {!staff.active && <Badge variant="neutral">Inactiva</Badge>}
          </p>
          <p className="text-sm text-ink-soft">{staff.phone || "Sin teléfono"}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" onClick={() => setEditing((v) => !v)}>
            {editing ? "Cancelar" : "Editar"}
          </Button>
          <form action={toggleStaffActive}>
            <input type="hidden" name="id" value={staff.id} />
            <input type="hidden" name="active" value={String(staff.active)} />
            <Button type="submit" size="sm" variant={staff.active ? "danger" : "primary"}>
              {staff.active ? "Desactivar" : "Reactivar"}
            </Button>
          </form>
        </div>
      </div>
      {editing && (
        <div className="mt-3 border-t border-line pt-3">
          <StaffForm staff={staff} />
        </div>
      )}
    </Card>
  );
}
