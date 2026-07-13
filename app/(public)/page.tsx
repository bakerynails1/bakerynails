import { BrandLogo } from "@/components/brand-logo";
import { btnPrimary } from "@/components/ui";

export default async function ReservarInicioPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
      <div className="flex justify-center">
        <BrandLogo size="lg" />
      </div>

      <div className="mt-8 text-center">
        <h1 className="font-serif text-3xl font-semibold text-ink">Bienvenida</h1>
        <p className="mt-1 text-ink-soft">Agenda tu cita fácil y rápido 🤍</p>
      </div>

      <form
        method="get"
        action="/servicios"
        className="mt-8 space-y-4 rounded-3xl border border-line bg-white p-6 shadow-sm shadow-brand-100"
      >
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-ink">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Tu nombre"
            className="w-full rounded-xl border border-line bg-brand-50/40 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:bg-white"
          />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-ink">
            Teléfono
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            placeholder="Ej. 618 000 0000"
            className="w-full rounded-xl border border-line bg-brand-50/40 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:bg-white"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-ink">
            Correo <span className="font-normal text-ink-soft">(opcional)</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="tucorreo@ejemplo.com"
            className="w-full rounded-xl border border-line bg-brand-50/40 px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-400 focus:bg-white"
          />
        </div>

        <div className="rounded-2xl bg-brand-50 p-4">
          <p className="text-sm font-medium text-brand-700">🎂 Nos gusta consentirte</p>
          <p className="mt-0.5 text-xs text-ink-soft">Cuéntanos cuándo es tu cumpleaños.</p>
          <div className="mt-2">
            <label htmlFor="birthday" className="mb-1 block text-sm font-medium text-ink">
              Cumpleaños <span className="font-normal text-ink-soft">(opcional)</span>
            </label>
            <div className="relative">
              <input
                id="birthday"
                name="birthday"
                type="date"
                className="w-full appearance-none rounded-xl border border-line bg-white py-3 pl-11 pr-4 text-sm text-ink outline-none transition focus:border-brand-400 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
              />
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-400"
              >
                <rect x="4" y="5" width="16" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.7" />
                <path d="M4 9h16M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        <button type="submit" className={`${btnPrimary} w-full`}>
          Reservar cita
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-ink-soft">
        Tus datos solo se usan para confirmar tu cita.
      </p>
    </main>
  );
}
