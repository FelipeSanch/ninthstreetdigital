const RESEND_API_KEY = process.env.RESEND_API_KEY;
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "jose@ninthstreetdigital.com";

function generateEmailHTML(name: string, email: string, message: string) {
  const escapedMessage = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 32px 40px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: -0.5px;">
                New Inquiry
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.7); font-size: 14px;">
                Someone's interested in working together
              </p>
            </td>
          </tr>

          <!-- Contact Card -->
          <tr>
            <td style="padding: 32px 40px 24px 40px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; border-radius: 8px; padding: 20px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; font-weight: 600;">From</p>
                    <p style="margin: 0 0 16px 0; font-size: 18px; color: #1a1a1a; font-weight: 600;">${name}</p>
                    
                    <p style="margin: 0 0 4px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; font-weight: 600;">Email</p>
                    <p style="margin: 0; font-size: 16px;">
                      <a href="mailto:${email}" style="color: #C44D2A; text-decoration: none; font-weight: 500;">${email}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <p style="margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; font-weight: 600;">Message</p>
              <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #374151;">
                  ${escapedMessage}
                </p>
              </div>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <a href="mailto:${email}?subject=Re: Your inquiry to Ninth Street Digital" 
                 style="display: inline-block; background-color: #C44D2A; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                Reply to ${name.split(' ')[0]}
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 13px; color: #6b7280; text-align: center;">
                This inquiry was sent from the contact form on<br>
                <a href="https://ninthstreetdigital.com" style="color: #C44D2A; text-decoration: none; font-weight: 500;">ninthstreetdigital.com</a>
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

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return res.status(500).json({ error: "Email service not configured" });
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Ninth Street Digital <hello@mail.ninthstreetdigital.com>",
        to: NOTIFY_EMAIL,
        reply_to: email,
        subject: `New inquiry from ${name}`,
        html: generateEmailHTML(name, email, message),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Resend error:", error);
      return res.status(500).json({ error: "Failed to send message" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
}
