import Link from "next/link";
import { requireBusinessSession } from "@/lib/admin/auth";
import { logout } from "@/lib/admin/actions";
import { BrandLogo } from "@/components/brand-logo";

const NAV_ITEMS = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/empleadas", label: "Empleadas" },
  { href: "/admin/servicios", label: "Servicios" },
  { href: "/admin/asignaciones", label: "Asignaciones" },
  { href: "/admin/horarios", label: "Horarios" },
  { href: "/admin/citas", label: "Citas" },
  { href: "/admin/reportes", label: "Reportes" },
  { href: "/admin/configuracion", label: "Configuración" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireBusinessSession();

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-white p-4">
        <div className="px-1 pb-5">
          <BrandLogo size="sm" />
        </div>
        <div className="mb-4 rounded-xl bg-brand-50 px-3 py-2">
          <p className="text-sm font-semibold text-ink">{session.businessName}</p>
          <p className="truncate text-xs text-ink-soft">{session.userEmail}</p>
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-xl px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-brand-50 hover:text-brand-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="mt-auto pt-6">
          <button
            type="submit"
            className="w-full rounded-xl px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-brand-50"
          >
            Cerrar sesión
          </button>
        </form>
      </aside>
      <main className="flex-1 p-6 md:p-8">{children}</main>
    </div>
  );
}
