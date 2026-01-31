import index from "./index.html";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL = "jose@ninthstreetdigital.com";
const TELEGRAM_BOT_TOKEN = "8106260730:AAH00Qay0bgk50EI7tgLglFJQdEY2d38QAU";
const TELEGRAM_CHAT_ID = "7462396310";

async function sendTelegram(text: string) {
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

async function sendContactEmail(name: string, email: string, message: string) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set — skipping email, logging only");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Ninth Street Digital <hello@mail.ninthstreetdigital.com>`,
      to: NOTIFY_EMAIL,
      reply_to: email,
      subject: `New inquiry from ${name}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", err);
    throw new Error("Failed to send email");
  }
}

Bun.serve({
  hostname: "0.0.0.0",
  port: 3000,
  routes: {
    "/": index,
    "/api/webhook/email": {
      POST: async (req) => {
        try {
          const event = await req.json();

          if (event.type === "email.received") {
            const { email_id, from, to, subject } = event.data;

            // Get full email content
            const email = await getEmailContent(email_id);
            const body = email?.text || email?.html || "(no body)";
            const preview = body.slice(0, 500);

            const msg =
              `📨 <b>New Email</b>\n\n` +
              `<b>From:</b> ${from}\n` +
              `<b>To:</b> ${(to || []).join(", ")}\n` +
              `<b>Subject:</b> ${subject || "(no subject)"}\n\n` +
              `${preview}`;

            await sendTelegram(msg);
          }

          return new Response("OK", { status: 200 });
        } catch (err) {
          console.error("Webhook error:", err);
          return new Response("OK", { status: 200 });
        }
      },
    },
    "/api/contact": {
      POST: async (req) => {
        try {
          const body = await req.json();
          const { name, email, message } = body;

          if (!name || !email || !message) {
            return Response.json(
              { error: "All fields are required" },
              { status: 400 }
            );
          }

          console.log(`--- Contact: ${name} <${email}> ---`);

          await sendContactEmail(name, email, message);

          return Response.json({ success: true });
        } catch (err) {
          console.error("Contact form error:", err);
          return Response.json(
            { error: "Failed to send message" },
            { status: 500 }
          );
        }
      },
    },
  },
  development: {
    hmr: true,
    console: true,
  },
});

console.log("Ninth Street Digital — running on http://localhost:3000");
