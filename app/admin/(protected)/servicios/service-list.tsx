"use client";

import { useMemo, useState } from "react";
import { ServiceForm } from "./service-form";
import { toggleServiceActive } from "./actions";
import { Badge, Button, Input, EmptyState } from "@/components/admin/ui";

interface Category {
  id: string;
  name: string;
}

interface Service {
  id: string;
  category_id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
  size: string | null;
  active: boolean;
  image_url: string | null;
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export function ServiceList({ categories, services }: { categories: Category[]; services: Service[] }) {
  const [query, setQuery] = useState("");
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => new Set(categories[0] ? [categories[0].id] : []));
  const [editingId, setEditingId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const isSearching = q.length > 0;

  const grouped = useMemo(() => {
    return categories.map((category) => {
      const categoryServices = services
        .filter((s) => s.category_id === category.id)
        .filter((s) => !isSearching || s.name.toLowerCase().includes(q));
      return { category, services: categoryServices };
    });
  }, [categories, services, q, isSearching]);

  function toggleCategory(id: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <Input
        type="search"
        placeholder="Buscar servicio por nombre..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-xs"
      />

      <div className="space-y-3">
        {grouped.map(({ category, services: categoryServices }) => {
          if (isSearching && categoryServices.length === 0) return null;
          const isOpen = isSearching || openCategories.has(category.id);

          return (
            <div key={category.id} className="overflow-hidden rounded-xl border border-line bg-white">
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-brand-50/40"
              >
                <span className="text-sm font-semibold text-ink">{category.name}</span>
                <span className="flex items-center gap-2 text-xs text-ink-soft">
                  {categoryServices.length} servicio{categoryServices.length === 1 ? "" : "s"}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                  >
                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-line">
                  {categoryServices.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-ink-soft">Sin servicios en esta categoría.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-line bg-brand-50/30 text-left text-xs text-ink-soft">
                          <th className="px-4 py-2 font-medium">Servicio</th>
                          <th className="px-2 py-2 font-medium">Precio</th>
                          <th className="px-2 py-2 font-medium">Duración</th>
                          <th className="px-2 py-2 font-medium">Estado</th>
                          <th className="px-4 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {categoryServices.map((s) => (
                          <ServiceRow
                            key={s.id}
                            service={s}
                            categories={categories}
                            editing={editingId === s.id}
                            onToggleEdit={() => setEditingId(editingId === s.id ? null : s.id)}
                          />
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {isSearching && grouped.every(({ services: cs }) => cs.length === 0) && <EmptyState>Sin resultados para &quot;{query}&quot;.</EmptyState>}
        {categories.length === 0 && <EmptyState>Todavía no hay categorías. Crea una arriba para empezar.</EmptyState>}
      </div>
    </div>
  );
}

function ServiceRow({
  service,
  categories,
  editing,
  onToggleEdit,
}: {
  service: Service;
  categories: Category[];
  editing: boolean;
  onToggleEdit: () => void;
}) {
  return (
    <>
      <tr className="border-b border-line last:border-0 hover:bg-brand-50/20">
        <td className="px-4 py-2.5 font-medium text-ink">
          <div className="flex items-center gap-2.5">
            {service.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={service.image_url} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
                  <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
                  <path d="M4 17l4.5-4 3 2.5L15 11l5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
            <span>
              {service.name}
              {service.size && <span className="ml-1 text-ink-soft">· {service.size}</span>}
            </span>
          </div>
        </td>
        <td className="px-2 py-2.5 text-ink">{formatPrice(service.price_cents)}</td>
        <td className="px-2 py-2.5 text-ink-soft">{service.duration_minutes} min</td>
        <td className="px-2 py-2.5">
          <Badge variant={service.active ? "success" : "neutral"}>{service.active ? "Activo" : "Inactivo"}</Badge>
        </td>
        <td className="px-4 py-2.5">
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={onToggleEdit}>
              {editing ? "Cancelar" : "Editar"}
            </Button>
            <form action={toggleServiceActive}>
              <input type="hidden" name="id" value={service.id} />
              <input type="hidden" name="active" value={String(service.active)} />
              <Button type="submit" size="sm" variant={service.active ? "danger" : "primary"}>
                {service.active ? "Desactivar" : "Reactivar"}
              </Button>
            </form>
          </div>
        </td>
      </tr>
      {editing && (
        <tr className="border-b border-line bg-brand-50/20 last:border-0">
          <td colSpan={5} className="px-4 py-3">
            <ServiceForm categories={categories} service={service} />
          </td>
        </tr>
      )}
    </>
  );
}
