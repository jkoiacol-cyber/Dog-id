// lib/vacunasParser.ts

function normalizarFecha(f: string): string {
  if (!f) return "";
  const clean = f.replace(/\s+/g, " ").trim();

  const meses: Record<string, string> = {
    ene: "01", feb: "02", mar: "03", abr: "04", may: "05", jun: "06",
    jul: "07", ago: "08", sep: "09", oct: "10", nov: "11", dic: "12",
    jan: "01", apr: "04", aug: "08",
  };

  const textMatch = clean.match(/(\d{1,2})\s+de\s+([a-záéíóú]+)(?:\s+(\d{2,4}))?/i);
  if (textMatch) {
    const [, d, mes, y] = textMatch;
    const m = meses[mes.toLowerCase().slice(0, 3)];
    if (m && y) {
      const yyyy = y.length === 2 ? "20" + y : y;
      return `${yyyy}-${m}-${d.padStart(2, "0")}`;
    }
  }

  const parts = clean.replace(/[.\-]/g, "/").split("/");
  if (parts.length !== 3) return "";

  let [a, b, c] = parts.map((p) => p.trim());
  if (c.length === 2) c = "20" + c;
  if (c.length !== 4) return "";

  const aNum = parseInt(a), bNum = parseInt(b);
  let day: string, month: string;
  if (aNum > 12) { day = a; month = b; }
  else if (bNum > 12) { month = a; day = b; }
  else { day = a; month = b; }

  return `${c}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function extraerFechas(texto: string): string[] {
  const resultados: string[] = [];

  // Intentar extraer año de contexto (ej: "ANTIRRABICA 2023", "Expire: 27/01/2024")
  const anioCtx = texto.match(/\b(20\d{2})\b/)?.[1] || "";

  const regexNum = /\b(\d{1,2}[\s\/\-\.]\d{1,2}(?:[\s\/\-\.]\d{2,4})?)\b/g;
  let m;
  while ((m = regexNum.exec(texto)) !== null) {
    let candidato = m[1];
    // Si solo tiene 2 partes (sin año), añadir año del contexto
    const partes = candidato.replace(/[.\-]/g, "/").split("/");
    if (partes.length === 2 && anioCtx) {
      candidato = candidato + "/" + anioCtx;
    }
    const n = normalizarFecha(candidato);
    if (n && !resultados.includes(n)) resultados.push(n);
  }

  const textMatches = texto.match(/\d{1,2}\s+de\s+[a-záéíóú]+(?:\s+\d{2,4})?/gi) || [];
  for (const t of textMatches) {
    const n = normalizarFecha(t);
    if (n && !resultados.includes(n)) resultados.push(n);
  }

  return resultados;
}

function limpiarTexto(texto: string): string {
  return texto
    // Quitar markdown bold y bullets
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^\*+\s*/gm, "")
    // Quitar sección de sellos/stamps
    .replace(/\*\*stamps\*\*[\s\S]*/i, "")
    .replace(/sellos?[\s\S]*/i, "")
    // Quitar texto legal de página izquierda
    .replace(/responsabilidad del propietario[\s\S]*?(?=\d+\.\s|n[°º]\s*cole)/i, "")
    .replace(/la rabia es una enfermedad[\s\S]*?(?=\d+\.\s|n[°º]\s*cole)/i, "")
    .trim();
}

// Nombres de vacunas conocidas
const NOMBRES_VACUNA = [
  "rabigen", "eurican", "nobivac", "versiguard", "quantum",
  "vanguard", "primodog", "cylap", "canigen", "biocan",
  "rabisin", "defensor", "recombitek", "purevax", "felocell",
  "feligen", "leucofeligen", "rabigam", "lubrican", "rinotraqueitis",
  "flevo", "intranasal",
];

function detectarNombreEnBloque(bloque: string): string {
  const lower = bloque.toLowerCase();

  // 1. Buscar "Vacuna: X"
  const vacunaMatch = bloque.match(/vacuna[:\s]+([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñ0-9\s\-]{1,30})/i);
  if (vacunaMatch) return vacunaMatch[1].trim();

  // 2. Buscar nombre conocido
  for (const n of NOMBRES_VACUNA) {
    if (lower.includes(n)) {
      const idx = lower.indexOf(n);
      return bloque.substring(idx, idx + 20).trim().split(/\s{2,}/)[0];
    }
  }

  // 3. Si menciona rabia → antirrábica
  if (/rabia|antirrábic|antirrabic/i.test(bloque)) return "Vacunación antirrábica";

  return "";
}

// -----------------------------------------------------------------------
//  FUNCIÓN PRINCIPAL: detectarVacunas
// -----------------------------------------------------------------------
export function detectarVacunas(textoOCR: string) {
  const textoLimpio = limpiarTexto(textoOCR);
  const lineas = textoLimpio.split("\n").map((l) => l.trim()).filter(Boolean);
  const resultados: any[] = [];
  const usados = new Set<string>();

  // Dividir en bloques por numeración "1." "2." "3." o "N° Colegido"
  const bloques: string[] = [];
  let actual: string[] = [];

  for (const linea of lineas) {
    const esNuevoBloque =
      /^\d+\.\s/.test(linea) ||
      (/n[°º]\s*cole/i.test(linea) && actual.length > 0);

    if (esNuevoBloque && actual.length > 0) {
      bloques.push(actual.join("\n"));
      actual = [];
    }
    actual.push(linea);
  }
  if (actual.length > 0) bloques.push(actual.join("\n"));

  for (const bloque of bloques) {
    const name = detectarNombreEnBloque(bloque);
    if (!name) continue;

    const fechas = extraerFechas(bloque);
    const date = fechas[0] || "";
    if (!date) continue;

    const key = `${name.toLowerCase().slice(0, 10)}_${date}`;
    if (usados.has(key)) continue;
    usados.add(key);

    const loteMatch = bloque.match(/lote[:\s]+([A-Za-z0-9\-]{2,12})|(?:ES-\d+)/i);
    const batch = loteMatch?.[0]?.replace(/lote[:\s]+/i, "").trim() || "";

    const colegiadoMatch = bloque.match(/n[°º]\s*cole[a-z]*[:\s]*(\d+)/i) ||
      bloque.match(/(?:^|\n)(\d{4,6})(?:\n|$)/m);
    const vet = colegiadoMatch?.[1] || "";

    const next_date = fechas[1] || "";

    resultados.push({ name, date, next_date, batch, vet, notes: "" });
  }

  return resultados;
}

// -----------------------------------------------------------------------
export function yaExiste(v: any, registradas: any[]) {
  return registradas.some(
    (r) => r.name?.toLowerCase() === v.name?.toLowerCase() && r.date === v.date
  );
}

export function filtrarVacunasNuevas(detectadas: any[], registradas: any[]) {
  if (registradas.length === 0) return detectadas;
  const nuevas = detectadas.filter((v) => !yaExiste(v, registradas));
  nuevas.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return nuevas;
}