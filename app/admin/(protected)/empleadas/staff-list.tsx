"use client";

import { useMemo, useState } from "react";
import { StaffRow } from "./staff-row";
import { Input, EmptyState } from "@/components/admin/ui";

interface StaffListProps {
  staff: { id: string; name: string; phone: string | null; active: boolean }[];
}

export function StaffList({ staff }: StaffListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter((s) => s.name.toLowerCase().includes(q) || (s.phone ?? "").includes(q));
  }, [staff, query]);

  if (staff.length === 0) {
    return <EmptyState>Todavía no hay empleadas registradas.</EmptyState>;
  }

  return (
    <div className="space-y-3">
      <Input
        type="search"
        placeholder="Buscar por nombre o teléfono..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-xs"
      />
      <div className="space-y-2">
        {filtered.map((s) => (
          <StaffRow key={s.id} staff={s} />
        ))}
        {filtered.length === 0 && <EmptyState>Sin resultados para &quot;{query}&quot;.</EmptyState>}
      </div>
    </div>
  );
}
