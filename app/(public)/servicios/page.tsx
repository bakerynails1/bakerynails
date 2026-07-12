import Link from "next/link";
import { redirect } from "next/navigation";
import { getBusiness, getCategoriesWithServices } from "@/lib/public/catalog";

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
    return <main className="p-6 text-sm text-neutral-500">El negocio no está configurado todavía.</main>;
  }

  const categories = await getCategoriesWithServices(business.id);
  const contactQs = `name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}${email ? `&email=${encodeURIComponent(email)}` : ""}`;

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8">
      <h1 className="text-xl font-semibold text-neutral-900">Elige un servicio</h1>
      <p className="mt-1 text-sm text-neutral-500">Hola {name}, ¿qué te gustaría agendar?</p>

      <div className="mt-6 space-y-6">
        {categories.map((category) => (
          <section key={category.id}>
            <h2 className="mb-2 text-sm font-semibold text-neutral-700">{category.name}</h2>
            <div className="space-y-2">
              {category.services.map((service) => (
                <Link
                  key={service.id}
                  href={`/empleada?service=${service.id}&${contactQs}`}
                  className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-400"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-900">
                      {service.name}
                      {service.size ? ` (${service.size})` : ""}
                    </span>
                    <span className="text-neutral-500">{formatPrice(service.price_cents)}</span>
                  </div>
                  <p className="text-sm text-neutral-500">{service.duration_minutes} min</p>
                </Link>
              ))}
              {category.services.length === 0 && <p className="text-sm text-neutral-400">Sin servicios disponibles.</p>}
            </div>
          </section>
        ))}
        {categories.length === 0 && <p className="text-sm text-neutral-500">Todavía no hay servicios configurados.</p>}
      </div>
    </main>
  );
}
