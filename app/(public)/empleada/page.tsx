import Link from "next/link";
import { redirect } from "next/navigation";
import { getCapableStaff, getService } from "@/lib/public/catalog";

export default async function EmpleadaPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; name?: string; phone?: string; email?: string }>;
}) {
  const { service: serviceId, name, phone, email } = await searchParams;
  if (!name || !phone) redirect("/");
  if (!serviceId) redirect("/servicios?" + contactQs(name, phone, email));

  const service = await getService(serviceId);
  if (!service) redirect("/servicios?" + contactQs(name, phone, email));

  const staff = await getCapableStaff(serviceId);
  const qs = `service=${serviceId}&${contactQs(name, phone, email)}`;

  return (
    <main className="mx-auto min-h-screen max-w-md px-4 py-8">
      <h1 className="text-xl font-semibold text-neutral-900">Elige empleada</h1>
      <p className="mt-1 text-sm text-neutral-500">Para {service!.name}</p>

      <div className="mt-6 space-y-2">
        <Link
          href={`/horario?staff=any&${qs}`}
          className="block rounded-lg border border-neutral-200 bg-white p-4 font-medium text-neutral-900 hover:border-neutral-400"
        >
          Cualquiera disponible
        </Link>
        {staff.map((s) => (
          <Link
            key={s.id}
            href={`/horario?staff=${s.id}&${qs}`}
            className="block rounded-lg border border-neutral-200 bg-white p-4 font-medium text-neutral-900 hover:border-neutral-400"
          >
            {s.name}
          </Link>
        ))}
        {staff.length === 0 && (
          <p className="text-sm text-neutral-500">Ninguna empleada está capacitada para este servicio todavía.</p>
        )}
      </div>
    </main>
  );
}

function contactQs(name: string, phone: string, email?: string) {
  return `name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}${email ? `&email=${encodeURIComponent(email)}` : ""}`;
}
