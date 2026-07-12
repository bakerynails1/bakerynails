import { requireBusinessSession } from "@/lib/admin/auth";
import { logout } from "@/lib/admin/actions";
import { BrandLogo } from "@/components/brand-logo";
import { AdminNav } from "@/components/admin/nav";

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
        <AdminNav />
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
