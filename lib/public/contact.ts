export interface ContactInfo {
  name: string;
  phone: string;
  email?: string;
  birthday?: string;
}

// Arma el query string que lleva los datos de contacto de un paso al
// siguiente en el flujo de reservas (no hay estado global, todo viaja en la URL).
export function contactQueryString(contact: ContactInfo): string {
  const params = new URLSearchParams({ name: contact.name, phone: contact.phone });
  if (contact.email) params.set("email", contact.email);
  if (contact.birthday) params.set("birthday", contact.birthday);
  return params.toString();
}
