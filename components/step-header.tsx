import Link from "next/link";

interface StepHeaderProps {
  step: number;
  total?: number;
  title: string;
  subtitle?: string;
  backHref?: string;
}

export function StepHeader({ step, total = 4, title, subtitle, backHref }: StepHeaderProps) {
  return (
    <header className="relative mb-6 text-center">
      {backHref && (
        <Link
          href={backHref}
          aria-label="Atrás"
          className="absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full text-brand-600 transition hover:bg-brand-100"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-500">
        Paso {step} de {total}
      </p>
      <h1 className="mt-1 font-serif text-2xl font-semibold text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
    </header>
  );
}

export function StepProgress({ step, total = 4 }: { step: number; total?: number }) {
  return (
    <div className="mt-6 flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i < step ? "w-6 bg-brand-500" : "w-3 bg-brand-200"
          }`}
        />
      ))}
    </div>
  );
}
