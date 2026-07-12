import "server-only";

const COLOR_IDS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"];

// Asigna un colorId fijo del calendario de Google por empleada, derivado de
// su UUID para que sea estable sin tener que guardar nada extra. Con más de
// 11 empleadas activas puede haber colores repetidos — aceptable para el MVP.
export function colorIdForStaff(staffId: string): string {
  let hash = 0;
  for (let i = 0; i < staffId.length; i++) {
    hash = (hash * 31 + staffId.charCodeAt(i)) >>> 0;
  }
  return COLOR_IDS[hash % COLOR_IDS.length];
}
