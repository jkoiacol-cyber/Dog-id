// -------------------------------------------------------------
//  PARSER DE DESPARASITACIONES PARA OCR
//  Detecta antiparasitarios comunes en España y Europa
//  Extrae: nombre, fecha, próxima dosis, lote, notas, tipo
//  Compatible con tu flujo de comparación (nombre + fecha)
// -------------------------------------------------------------

// Normaliza texto OCR para mejorar coincidencias
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s/.-]/g, "")
    .trim();
}

// Lista de antiparasitarios comunes (internos y externos)
const antiparasitarios = [
  // Internos
  "drontal",
  "milbemax",
  "panacur",
  "cestal",
  "telmin",
  "dolpac",
  "zipyran",
  "lopatol",
  "paracan",
  "endogard",

  // Externos
  "bravecto",
  "nexgard",
  "simparica",
  "credelio",
  "stronghold",
  "advocate",
  "frontline",
  "seresto",
  "effitix",
  "vectra",
  "scalibor",
  "advantage",
  "exspot",
];

// Regex para fechas (OCR suele confundir guiones y barras)
const regexFecha =
  /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;

// Regex para lote
const regexLote =
  /(lote|lot|batch)\s*[:\-]?\s*([a-z0-9\-]+)/i;

// Regex para próxima dosis
const regexProxima =
  /(proxima|próxima|next)\s*(dosis|dose)?\s*[:\-]?\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i;

// Detecta si el texto menciona interno/externo
function detectarTipo(texto: string): "interno" | "externo" | null {
  if (texto.includes("interno")) return "interno";
  if (texto.includes("externo")) return "externo";
  if (texto.includes("pipeta")) return "externo";
  if (texto.includes("collar")) return "externo";
  if (texto.includes("comprimido")) return "interno";
  return null;
}

// -------------------------------------------------------------
//  FUNCIÓN PRINCIPAL: detectarParasitos
// -------------------------------------------------------------
export function detectarParasitos(texto: string) {
  const clean = normalizarTexto(texto);

  const resultados: any[] = [];

  antiparasitarios.forEach((nombre) => {
    if (clean.includes(nombre)) {
      // Extraer fecha
      const fechaMatch = clean.match(regexFecha);
      const fecha = fechaMatch ? fechaMatch[1] : "";

      // Extraer lote
      const loteMatch = clean.match(regexLote);
      const lote = loteMatch ? loteMatch[2] : "";

      // Extraer próxima dosis
      const proxMatch = clean.match(regexProxima);
      const next_date = proxMatch ? proxMatch[3] : "";

      // Detectar tipo
      const tipo = detectarTipo(clean);

      // Notas: todo el texto donde aparece el nombre
      const index = clean.indexOf(nombre);
      const notas = clean.substring(index, index + 120);

      resultados.push({
        name: nombre,
        date: fecha,
        next_date,
        batch: lote,
        notes: notas,
        type: tipo,
      });
    }
  });

  return resultados;
}

// -------------------------------------------------------------
//  FUNCIÓN: filtrarParasitosNuevos
//  Compara detectados vs existentes (nombre + fecha)
// -------------------------------------------------------------
export function filtrarParasitosNuevos(
  detectados: any[],
  existentes: any[]
) {
  const nuevos: any[] = [];
  const posiblesActualizaciones: any[] = [];

  detectados.forEach((d) => {
    const existe = existentes.find(
      (e) =>
        e.name?.toLowerCase() === d.name?.toLowerCase() &&
        e.date === d.date
    );

    if (!existe) {
      // Es nuevo
      nuevos.push(d);
    } else {
      // Existe → ver si hay cambios
      const cambios: Record<string, { antes: any; despues: any }> = {};

      if (d.batch && d.batch !== existe.batch)
        cambios["batch"] = { antes: existe.batch, despues: d.batch };

      if (d.vet && d.vet !== existe.vet)
        cambios["vet"] = { antes: existe.vet, despues: d.vet };

      if (d.notes && d.notes !== existe.notes)
        cambios["notes"] = { antes: existe.notes, despues: d.notes };

      if (d.next_date && d.next_date !== existe.next_date)
        cambios["next_date"] = {
          antes: existe.next_date,
          despues: d.next_date,
        };

      if (Object.keys(cambios).length > 0) {
        posiblesActualizaciones.push({
          existente: existe,
          detectado: d,
          cambios,
        });
      }
    }
  });

  return { nuevos, posiblesActualizaciones };
}
