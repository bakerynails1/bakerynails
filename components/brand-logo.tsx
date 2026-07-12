interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { icon: 26, script: "text-2xl", nails: "text-[0.6rem] tracking-[0.35em]" },
  md: { icon: 40, script: "text-4xl", nails: "text-xs tracking-[0.45em]" },
  lg: { icon: 56, script: "text-5xl", nails: "text-sm tracking-[0.5em]" },
};

export function CupcakeIcon({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {/* liner */}
      <path d="M15 27h18l-2.4 15.2A2 2 0 0 1 28.6 44h-9.2a2 2 0 0 1-1.98-1.8L15 27z" fill="#f4cdd7" />
      <path d="M19 28l-1 15M24 28v15M29 28l1 15" stroke="#e7aebc" strokeWidth="1.1" strokeLinecap="round" />
      {/* frosting */}
      <path
        d="M24 6c3 0 5.2 1.9 5.8 4.4 3 .3 5.2 2.7 5.2 5.6 0 1.4-.5 2.7-1.4 3.7 1 .8 1.6 2 1.6 3.4 0 1.6-.9 3-2.2 3.7H15c-1.3-.7-2.2-2.1-2.2-3.7 0-1.4.6-2.6 1.6-3.4-.9-1-1.4-2.3-1.4-3.7 0-2.9 2.2-5.3 5.2-5.6C18.8 7.9 21 6 24 6z"
        fill="#e5849b"
      />
      <path
        d="M18.4 12.6c1.2-.2 2.2-1 2.6-2M29.6 12.6c-1.2-.2-2.2-1-2.6-2"
        stroke="#f2b3c1"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      {/* cherry */}
      <circle cx="24" cy="5" r="2.4" fill="#c85c78" />
      <path d="M24 3c1.6-1.8 3.6-2 4.6-1.2" stroke="#a8455f" strokeWidth="1.1" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function BrandLogo({ size = "md", className = "" }: BrandLogoProps) {
  const s = SIZES[size];
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <CupcakeIcon size={s.icon} />
      <div className="flex flex-col leading-none">
        <span className={`font-script ${s.script} text-brand-600`}>Bakery</span>
        <span className={`${s.nails} font-medium uppercase text-ink-soft`}>Nails</span>
      </div>
    </div>
  );
}
