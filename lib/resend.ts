// lib/resend.ts

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  petName: string;
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY no está definida en .env");

  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) throw new Error("RESEND_FROM_EMAIL no está definida en .env");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Dog ID - Pasaporte Digital <${fromEmail}>`,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend error ${response.status}: ${error}`);
  }

  return true;
}