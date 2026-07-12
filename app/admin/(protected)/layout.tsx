import Link from "next/link";
import { requireBusinessSession } from "@/lib/admin/auth";
import { logout } from "@/lib/admin/actions";

const NAV_ITEMS = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/empleadas", label: "Empleadas" },
  { href: "/admin/servicios", label: "Servicios" },
  { href: "/admin/asignaciones", label: "Asignaciones" },
  { href: "/admin/horarios", label: "Horarios" },
  { href: "/admin/citas", label: "Citas" },
  { href: "/admin/reportes", label: "Reportes" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireBusinessSession();

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="w-56 shrink-0 border-r border-neutral-200 bg-white p-4">
        <div className="mb-6">
          <p className="text-sm font-semibold text-neutral-900">{session.businessName}</p>
          <p className="truncate text-xs text-neutral-500">{session.userEmail}</p>
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="mt-6">
          <button type="submit" className="w-full rounded-md px-3 py-2 text-left text-sm text-neutral-500 hover:bg-neutral-100">
            Cerrar sesión
          </button>
        </form>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
