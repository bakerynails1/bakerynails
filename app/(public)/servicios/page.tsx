import { redirect } from "next/navigation";
import { getBusiness, getCategoriesWithServices } from "@/lib/public/catalog";
import { StepHeader } from "@/components/step-header";
import { contactQueryString } from "@/lib/public/contact";
import { CategoryAccordion } from "./category-accordion";

export default async function ServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; phone?: string; email?: string; birthday?: string }>;
}) {
  const { name, phone, email, birthday } = await searchParams;
  if (!name || !phone) redirect("/");

  const business = await getBusiness();
  if (!business) {
    return <main className="mx-auto max-w-md p-6 text-sm text-ink-soft">El negocio no está configurado todavía.</main>;
  }

  const categories = await getCategoriesWithServices(business.id);
  const contact = contactQueryString({ name, phone, email, birthday });

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-5 py-8">
      <StepHeader step={1} title="Elige tu servicio" subtitle={`Hola ${name}, ¿qué te consentimos hoy?`} backHref={`/?${contact}`} />

      <CategoryAccordion categories={categories} contactQuery={contact} />

      {categories.length === 0 && <p className="text-sm text-ink-soft">Todavía no hay servicios configurados.</p>}
    </main>
  );
}
