"use client";

import { useState } from "react";
import Link from "next/link";

interface Service {
  id: string;
  name: string;
  price_cents: number;
  duration_minutes: number;
  size: string | null;
}

interface Category {
  id: string;
  name: string;
  services: Service[];
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export function CategoryAccordion({ categories, contactQuery }: { categories: Category[]; contactQuery: string }) {
  const [openId, setOpenId] = useState<string | null>(categories[0]?.id ?? null);

  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const isOpen = openId === category.id;
        return (
          <section key={category.id} className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm shadow-brand-100/40">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : category.id)}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left"
              aria-expanded={isOpen}
            >
              <span className="text-sm font-semibold uppercase tracking-[0.1em] text-brand-500">{category.name}</span>
              <span className="flex items-center gap-2 text-xs text-ink-soft">
                {category.services.length} servicio{category.services.length === 1 ? "" : "s"}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={`transition-transform ${isOpen ? "rotate-180" : ""}`}>
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>

            {isOpen && (
              <div className="space-y-2 border-t border-line p-3">
                {category.services.map((service) => (
                  <Link
                    key={service.id}
                    href={`/empleada?service=${service.id}&${contactQuery}`}
                    className="flex items-center justify-between rounded-xl border border-line bg-white p-3.5 transition hover:border-brand-300 hover:bg-brand-50/30"
                  >
                    <div>
                      <p className="font-medium text-ink">
                        {service.name}
                        {service.size ? <span className="text-ink-soft"> · {service.size}</span> : ""}
                      </p>
                      <p className="text-sm text-ink-soft">
                        {formatPrice(service.price_cents)} · {service.duration_minutes} min
                      </p>
                    </div>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-brand-400">
                      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                ))}
                {category.services.length === 0 && <p className="px-1 py-2 text-sm text-ink-soft/70">Sin servicios disponibles.</p>}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
