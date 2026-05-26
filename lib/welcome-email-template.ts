// lib/welcome-email-template.ts

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
  <title>${brand.name} - Bienvenido</title>
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
              <p style="margin:0;font-size:12px;color:#b0b0b0;line-height:1.6;">
                Este email ha sido enviado automáticamente por ${brand.name} al registrar una mascota.<br/>
                Si no realizaste este registro, contáctanos respondiendo a este correo.
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

export function templateBienvenida({
  petName,
  ownerName,
  email,
  qrCode,
  species = "dog",
}: {
  petName: string;
  ownerName: string;
  email: string;
  qrCode: string;
  species?: string;
}): string {
  const animalEmoji = species === "cat" ? "🐱" : "🐶";
  const displayName = ownerName && ownerName !== "Propietario" ? ownerName : "dueño/a";

  const content = `
    <!-- Greeting -->
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1c1c1e;">
      ¡${petName} ya está protegido/a! ${animalEmoji}
    </h1>
    <p style="margin:0 0 24px;font-size:16px;color:#555;line-height:1.6;">
      Hola <strong>${displayName}</strong>, gracias por registrar a <strong>${petName}</strong> en ${species === "cat" ? "Cat ID" : "Dog ID"}.
      Tu placa QR ha quedado activada y vinculada a tu correo electrónico.
    </p>

    <!-- QR Info box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f7;border-radius:12px;padding:20px;margin-bottom:28px;">
      <tr>
        <td>
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#8a8a8a;text-transform:uppercase;">QR asociado a tu cuenta</p>
          <p style="margin:0;font-size:17px;font-weight:800;color:#1c1c1e;font-family:monospace;letter-spacing:1px;">${qrCode}</p>
        </td>
      </tr>
      <tr><td style="padding:10px 0;"><hr style="border:none;border-top:1px solid #e8e8e4;margin:0;"/></td></tr>
      <tr>
        <td>
          <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#8a8a8a;text-transform:uppercase;">Vinculado a</p>
          <p style="margin:0;font-size:15px;font-weight:700;color:#1c1c1e;">${email}</p>
        </td>
      </tr>
    </table>

    <!-- Benefits title -->
    <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#8a8a8a;text-transform:uppercase;letter-spacing:0.05em;">
      ✅ Qué incluye tu placa QR
    </p>

    <!-- Benefit 1 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
      <tr>
        <td style="width:36px;vertical-align:top;">
          <div style="width:30px;height:30px;background:#f0fdf4;border-radius:8px;text-align:center;line-height:30px;font-size:15px;">📱</div>
        </td>
        <td style="padding-left:12px;vertical-align:top;">
          <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#1c1c1e;">Perfil público instantáneo</p>
          <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">
            Cualquier persona que encuentre a ${petName} puede escanear la placa y ver tu información de contacto al instante, sin instalar ninguna app.
          </p>
        </td>
      </tr>
    </table>

    <!-- Benefit 2 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
      <tr>
        <td style="width:36px;vertical-align:top;">
          <div style="width:30px;height:30px;background:#eff6ff;border-radius:8px;text-align:center;line-height:30px;font-size:15px;">✏️</div>
        </td>
        <td style="padding-left:12px;vertical-align:top;">
          <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#1c1c1e;">Datos siempre actualizados</p>
          <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">
            Actualiza el teléfono, dirección o foto de ${petName} cuando quieras desde tu dashboard. El QR siempre mostrará la información más reciente.
          </p>
        </td>
      </tr>
    </table>

    <!-- Benefit 3 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
      <tr>
        <td style="width:36px;vertical-align:top;">
          <div style="width:30px;height:30px;background:#fefce8;border-radius:8px;text-align:center;line-height:30px;font-size:15px;">🔒</div>
        </td>
        <td style="padding-left:12px;vertical-align:top;">
          <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#1c1c1e;">Control total de privacidad</p>
          <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">
            Decides qué se muestra públicamente: teléfono, dirección y nombre de propietarios se pueden ocultar con un toque.
          </p>
        </td>
      </tr>
    </table>

    <!-- Benefit 4 -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="width:36px;vertical-align:top;">
          <div style="width:30px;height:30px;background:#fdf4ff;border-radius:8px;text-align:center;line-height:30px;font-size:15px;">🐾</div>
        </td>
        <td style="padding-left:12px;vertical-align:top;">
          <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#1c1c1e;">Varias mascotas, una cuenta</p>
          <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">
            Registra todos tus animales bajo el mismo correo. Cada placa QR queda vinculada individualmente.
          </p>
        </td>
      </tr>
    </table>

    <!-- Lost tag highlight -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#1c1c1e;border-radius:12px;padding:22px 24px;">
          <p style="margin:0 0 8px;font-size:15px;">🔄</p>
          <p style="margin:0 0 8px;font-size:15px;font-weight:800;color:#ffffff;">¿Pierdes la chapa? No pierdes nada más.</p>
          <p style="margin:0;font-size:13px;color:#d1d1d1;line-height:1.7;">
            Tu QR está vinculado permanentemente a <strong style="color:#ffffff;">${email}</strong>.
            Si la placa se pierde o daña, puedes solicitar una nueva y quedará asociada a
            <strong style="color:#ffffff;">${petName}</strong> con todos sus datos intactos.
            <strong style="color:#f59e0b;">No pierdes ningún historial ni información.</strong>
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.6;text-align:center;">
      Accede a tu dashboard para editar el perfil de ${petName}, añadir más mascotas o gestionar tu cuenta.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <a href="https://dogid.es/dashboard"
             style="display:inline-block;background:#1c1c1e;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.3px;">
            Ir a mi dashboard →
          </a>
        </td>
      </tr>
    </table>
  `;

  return baseTemplate(content, species);
}