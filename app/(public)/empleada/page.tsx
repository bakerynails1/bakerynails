import Link from "next/link";
import { redirect } from "next/navigation";
import { getCapableStaff, getService } from "@/lib/public/catalog";
import { StepHeader } from "@/components/step-header";
import { contactQueryString } from "@/lib/public/contact";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default async function EmpleadaPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; name?: string; phone?: string; email?: string; birthday?: string }>;
}) {
  const { service: serviceId, name, phone, email, birthday } = await searchParams;
  if (!name || !phone) redirect("/");
  const contact = contactQueryString({ name, phone, email, birthday });
  if (!serviceId) redirect("/servicios?" + contact);

  const service = await getService(serviceId);
  if (!service) redirect("/servicios?" + contact);

  const staff = await getCapableStaff(serviceId);
  const qs = `service=${serviceId}&${contact}`;

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-5 py-8">
      <StepHeader
        step={2}
        title="Elige a tu artista"
        subtitle={`Para ${service!.name}`}
        backHref={`/servicios?${contact}`}
      />

      <div className="space-y-2">
        <Link
          href={`/horario?staff=any&${qs}`}
          className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 transition hover:border-brand-300"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-200 text-brand-700">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 3l2.2 4.5 5 .7-3.6 3.5.8 4.9L12 14.8 7.6 16.6l.8-4.9L4.8 8.2l5-.7L12 3z"
                fill="currentColor"
              />
            </svg>
          </span>
          <div>
            <p className="font-medium text-ink">Cualquiera disponible</p>
            <p className="text-sm text-ink-soft">Te asignamos a la primera con espacio</p>
          </div>
        </Link>

        {staff.map((s) => (
          <Link
            key={s.id}
            href={`/horario?staff=${s.id}&${qs}`}
            className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm shadow-brand-100/40 transition hover:border-brand-300 hover:shadow-md"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-600">
              {initials(s.name)}
            </span>
            <p className="font-medium text-ink">{s.name}</p>
          </Link>
        ))}

        {staff.length === 0 && (
          <p className="rounded-2xl border border-line bg-white p-4 text-sm text-ink-soft">
            Ninguna artista está capacitada para este servicio todavía.
          </p>
        )}
      </div>
    </main>
  );
}
