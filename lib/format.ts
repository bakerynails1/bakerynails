import { DateTime } from "luxon";

// Capitaliza solo la primera letra (deja "de", "julio" en minúscula).
export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// "Lunes 20 de julio" — para encabezados de día.
export function formatLongDate(dt: DateTime): string {
  return capitalizeFirst(dt.setLocale("es").toFormat("cccc d 'de' LLLL"));
}

// "Lunes 20 de julio, 14:00" — con hora.
export function formatLongDateTime(dt: DateTime): string {
  return capitalizeFirst(dt.setLocale("es").toFormat("cccc d 'de' LLLL, HH:mm"));
}
