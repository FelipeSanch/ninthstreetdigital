import type { VercelRequest, VercelResponse } from "@vercel/node";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

async function sendTelegram(text: string) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("Telegram not configured");
    return;
  }
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: "HTML",
    }),
  });
}

async function getEmailContent(emailId: string) {
  const res = await fetch(`https://api.resend.com/emails/${emailId}`, {
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const event = req.body;

    if (event.type === "email.received") {
      const { email_id, from, to, subject } = event.data;

      // Get full email content
      const email = await getEmailContent(email_id);
      const body = email?.text || email?.html || "(no body)";
      const preview = body.slice(0, 500);

      const msg =
        `📨 <b>NSD Email Reply!</b>\n\n` +
        `<b>From:</b> ${from}\n` +
        `<b>To:</b> ${(to || []).join(", ")}\n` +
        `<b>Subject:</b> ${subject || "(no subject)"}\n\n` +
        `${preview}`;

      await sendTelegram(msg);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(200).json({ ok: true });
  }
}
