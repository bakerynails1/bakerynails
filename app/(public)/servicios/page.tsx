import Link from "next/link";
import { redirect } from "next/navigation";
import { getBusiness, getCategoriesWithServices } from "@/lib/public/catalog";
import { StepHeader } from "@/components/step-header";

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export default async function ServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; phone?: string; email?: string }>;
}) {
  const { name, phone, email } = await searchParams;
  if (!name || !phone) redirect("/");

  const business = await getBusiness();
  if (!business) {
    return <main className="mx-auto max-w-md p-6 text-sm text-ink-soft">El negocio no está configurado todavía.</main>;
  }

  const categories = await getCategoriesWithServices(business.id);
  const contactQs = `name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}${email ? `&email=${encodeURIComponent(email)}` : ""}`;

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-5 py-8">
      <StepHeader step={1} title="Elige tu servicio" subtitle={`Hola ${name}, ¿qué te consentimos hoy?`} backHref={`/?${contactQs}`} />

      <div className="space-y-6">
        {categories.map((category) => (
          <section key={category.id}>
            <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.15em] text-brand-500">{category.name}</h2>
            <div className="space-y-2">
              {category.services.map((service) => (
                <Link
                  key={service.id}
                  href={`/empleada?service=${service.id}&${contactQs}`}
                  className="flex items-center justify-between rounded-2xl border border-line bg-white p-4 shadow-sm shadow-brand-100/40 transition hover:border-brand-300 hover:shadow-md"
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
              {category.services.length === 0 && <p className="px-1 text-sm text-ink-soft/70">Sin servicios disponibles.</p>}
            </div>
          </section>
        ))}
        {categories.length === 0 && <p className="text-sm text-ink-soft">Todavía no hay servicios configurados.</p>}
      </div>
    </main>
  );
}
