import Link from "next/link";
import type { ComponentProps } from "react";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-200 transition hover:bg-brand-600 disabled:opacity-50";

export const btnOutline =
  "inline-flex items-center justify-center gap-2 rounded-full border border-brand-300 bg-white px-6 py-3 text-sm font-semibold text-brand-600 transition hover:bg-brand-50 disabled:opacity-50";

export const card =
  "rounded-2xl border border-line bg-white p-4 shadow-sm shadow-brand-100/50";

export const cardHover =
  "rounded-2xl border border-line bg-white p-4 shadow-sm shadow-brand-100/50 transition hover:border-brand-300 hover:shadow-md";

export function PrimaryButton({ className = "", ...props }: ComponentProps<"button">) {
  return <button className={`${btnPrimary} ${className}`} {...props} />;
}

export function PrimaryLink({ className = "", ...props }: ComponentProps<typeof Link>) {
  return <Link className={`${btnPrimary} ${className}`} {...props} />;
}
