// lib/vaccine-email-templates.ts

function getBrandInfo(species: string): { emoji: string; name: string; subtitle: string } {
  if (species === "cat") {
    return {
      emoji: "🐱",
      name: "Cat ID",
      subtitle: "Pasaporte Digital para tu gato",
    };
  }
  return {
    emoji: "🐾",
    name: "Dog ID",
    subtitle: "Pasaporte Digital para tu perro",
  };
}

function baseTemplate(content: string, species: string): string {
  const brand = getBrandInfo(species);
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Dog ID - Notificación de vacuna</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);max-width:600px;width:100%;">
          
          <!-- Header -->
          <tr>
            <td style="background:#1c1c1e;padding:28px 32px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">${brand.emoji} ${brand.name}</p>
              <p style="margin:6px 0 0;color:#a0a0a0;font-size:13px;">${brand.subtitle}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f5f5f0;padding:24px 32px;border-top:1px solid #e8e8e4;">
              <p style="margin:0;font-size:13px;color:#8a8a8a;line-height:1.6;">
                <strong style="color:#1c1c1e;">¿Por qué es importante registrar todo en el pasaporte?</strong><br/>
                Mantener el pasaporte digital actualizado con cada vacuna, desparasitación y cambio médico permite a cualquier veterinario conocer el historial completo de tu mascota al instante. Es la forma más segura de garantizar su salud y cumplir con la normativa vigente.
              </p>
              <p style="margin:16px 0 0;font-size:12px;color:#b0b0b0;">
                Este email ha sido enviado automáticamente por ${brand.name}. Si tienes dudas, accede a tu pasaporte digital en la app.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ── 1 MES ANTES ─────────────────────────────────────────────────────────────
export function templateUnMesAntes({
  petName,
  vaccineName,
  nextDate,
  species = "dog",
}: {
  petName: string;
  vaccineName: string;
  nextDate: string;
  species?: string;
}): string {
  const content = `
    <div style="background:#fff8e1;border-left:4px solid #f59e0b;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#b45309;text-transform:uppercase;letter-spacing:0.05em;">📅 Recordatorio — 1 mes</p>
    </div>

    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1c1c1e;">La vacuna de ${petName} vence en 1 mes</h1>
    <p style="margin:0 0 24px;font-size:16px;color:#555;line-height:1.6;">
      La vacuna <strong>${vaccineName}</strong> de <strong>${petName}</strong> tiene fecha de próxima dosis el <strong>${nextDate}</strong>. Tienes tiempo suficiente para pedir cita con tu veterinario.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f7;border-radius:12px;padding:20px;margin-bottom:24px;">
      <tr>
        <td>
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#8a8a8a;text-transform:uppercase;">Mascota</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#1c1c1e;">${petName}</p>
        </td>
      </tr>
      <tr><td style="padding:10px 0;"><hr style="border:none;border-top:1px solid #e8e8e4;margin:0;"/></td></tr>
      <tr>
        <td>
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#8a8a8a;text-transform:uppercase;">Vacuna</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#1c1c1e;">${vaccineName}</p>
        </td>
      </tr>
      <tr><td style="padding:10px 0;"><hr style="border:none;border-top:1px solid #e8e8e4;margin:0;"/></td></tr>
      <tr>
        <td>
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#8a8a8a;text-transform:uppercase;">Fecha límite</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#f59e0b;">${nextDate}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">
      Recuerda que tras poner la vacuna debes <strong>registrarla en el pasaporte digital</strong> con el nombre, fecha, lote y número de colegiado del veterinario. Un pasaporte actualizado protege a tu mascota y facilita cualquier gestión médica o de viaje.
    </p>
  `;
  return baseTemplate(content, species);
}

// ── 1 SEMANA ANTES ──────────────────────────────────────────────────────────
export function templateUnaSemanAntes({
  petName,
  vaccineName,
  nextDate,
  species = "dog",
}: {
  petName: string;
  vaccineName: string;
  nextDate: string;
  species?: string;
}): string {
  const content = `
    <div style="background:#fff3cd;border-left:4px solid #ef8c00;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#b45309;text-transform:uppercase;letter-spacing:0.05em;">⚠️ Urgente — 1 semana</p>
    </div>

    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1c1c1e;">¡Queda 1 semana para la vacuna de ${petName}!</h1>
    <p style="margin:0 0 24px;font-size:16px;color:#555;line-height:1.6;">
      La vacuna <strong>${vaccineName}</strong> vence el <strong>${nextDate}</strong>. Si aún no has pedido cita, hazlo hoy para no perder la protección de tu mascota.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f7;border-radius:12px;padding:20px;margin-bottom:24px;">
      <tr>
        <td>
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#8a8a8a;text-transform:uppercase;">Mascota</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#1c1c1e;">${petName}</p>
        </td>
      </tr>
      <tr><td style="padding:10px 0;"><hr style="border:none;border-top:1px solid #e8e8e4;margin:0;"/></td></tr>
      <tr>
        <td>
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#8a8a8a;text-transform:uppercase;">Vacuna</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#1c1c1e;">${vaccineName}</p>
        </td>
      </tr>
      <tr><td style="padding:10px 0;"><hr style="border:none;border-top:1px solid #e8e8e4;margin:0;"/></td></tr>
      <tr>
        <td>
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#8a8a8a;text-transform:uppercase;">Fecha límite</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#ef8c00;">${nextDate}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">
      No olvides que después de vacunar a ${petName} debes <strong>actualizar inmediatamente el pasaporte digital</strong>: nombre de la vacuna, fecha, lote y nº de colegiado. Mantener el registro al día es esencial para su salud y para cualquier trámite veterinario o de viaje.
    </p>
  `;
  return baseTemplate(content, species);
}

// ── CADUCADA ─────────────────────────────────────────────────────────────────
export function templateCaducada({
  petName,
  vaccineName,
  nextDate,
  species = "dog",
}: {
  petName: string;
  vaccineName: string;
  nextDate: string;
  species?: string;
}): string {
  const content = `
    <div style="background:#fee2e2;border-left:4px solid #dc2626;border-radius:8px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.05em;">🚨 Vacuna caducada</p>
    </div>

    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1c1c1e;">La vacuna de ${petName} ha caducado</h1>
    <p style="margin:0 0 24px;font-size:16px;color:#555;line-height:1.6;">
      La vacuna <strong>${vaccineName}</strong> venció el <strong>${nextDate}</strong> y aún no aparece registrada la nueva dosis en el pasaporte digital. Es importante actuar cuanto antes para mantener a ${petName} protegido/a.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff5f5;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #fecaca;">
      <tr>
        <td>
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#8a8a8a;text-transform:uppercase;">Mascota</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#1c1c1e;">${petName}</p>
        </td>
      </tr>
      <tr><td style="padding:10px 0;"><hr style="border:none;border-top:1px solid #fecaca;margin:0;"/></td></tr>
      <tr>
        <td>
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#8a8a8a;text-transform:uppercase;">Vacuna</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#1c1c1e;">${vaccineName}</p>
        </td>
      </tr>
      <tr><td style="padding:10px 0;"><hr style="border:none;border-top:1px solid #fecaca;margin:0;"/></td></tr>
      <tr>
        <td>
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#8a8a8a;text-transform:uppercase;">Venció el</p>
          <p style="margin:0;font-size:16px;font-weight:700;color:#dc2626;">${nextDate}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.7;">
      Si ya has puesto la vacuna, <strong>regístrala ahora en el pasaporte digital</strong> para que quede constancia y el sistema deje de enviar este aviso. Si aún no la has puesto, contacta hoy con tu veterinario.
    </p>

    <p style="margin:0;font-size:14px;color:#555;line-height:1.7;">
      Recuerda: registrar cada vacuna, desparasitación y cambio médico en el pasaporte digital no es solo un trámite, es la mejor forma de garantizar la salud y seguridad de ${petName} en cualquier situación.
    </p>
  `;
  return baseTemplate(content, species);
}