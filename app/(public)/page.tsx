import { BrandLogo } from "@/components/brand-logo";
import { btnPrimary } from "@/components/ui";

export default async function ReservarInicioPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-8">
      <div className="flex justify-center">
        <BrandLogo size="lg" />
      </div>

      <div className="mt-8 text-center">
        <h1 className="font-serif text-3xl font-semibold text-ink">¡Hola, hermosa!</h1>
        <p className="mt-1 text-ink-soft">Agenda tu cita rápido, fácil y bonito 🤍</p>
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
