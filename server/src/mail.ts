import { env } from './env';

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult = {
  /** True when the message was accepted by the provider. */
  sent: boolean;
  /** True when no provider is configured (caller may fall back to console/dev code). */
  skipped: boolean;
  error?: string;
};

/**
 * Send a transactional email via Resend. When RESEND_API_KEY is not set we skip
 * silently (the caller can surface a dev code instead) so local dev works without
 * an email provider.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = env.resendApiKey();
  if (!apiKey) {
    return { sent: false, skipped: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.resendFrom(),
        to: [input.to],
        subject: input.subject,
        html: input.html,
        ...(input.text ? { text: input.text } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[mail] Resend rejected message (${res.status}): ${detail}`);
      return { sent: false, skipped: false, error: `Email provider error (${res.status}).` };
    }

    return { sent: true, skipped: false };
  } catch (err) {
    console.error('[mail] Failed to reach Resend:', err);
    return { sent: false, skipped: false, error: 'Could not reach the email provider.' };
  }
}

/** Branded email for the customer email-verification code. */
export function verificationEmailHtml(code: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#F1F5F9;padding:32px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="440" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px -12px rgba(2,132,199,0.25);">
            <tr>
              <td style="background:#0EA5E9;padding:24px 32px;">
                <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:0.5px;">HAMEL</span>
                <span style="color:#E0F2FE;font-size:13px;display:block;margin-top:2px;">The Cooling Experts</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 8px;font-size:20px;color:#0C4A6E;">Verify your email</h1>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#475569;">
                  Use the code below to finish setting up your Hamel account and start claiming exclusive vouchers.
                </p>
                <div style="text-align:center;background:#E0F2FE;border:1px dashed #7DD3FC;border-radius:12px;padding:20px;">
                  <span style="font-size:34px;font-weight:800;letter-spacing:10px;color:#0369A1;">${code}</span>
                </div>
                <p style="margin:24px 0 0;font-size:12.5px;line-height:1.6;color:#94A3B8;">
                  This code expires in 15 minutes. If you didn't request it, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
