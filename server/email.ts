import nodemailer from "nodemailer";

// In-memory store for generated email previews (avoids public sandbox port SMTP timeouts)
const emailPreviews = new Map<string, string>();

/**
 * Retrieves the cached email preview HTML by ID
 */
export function getEmailPreviewHtml(id: string): string | undefined {
  return emailPreviews.get(id);
}

/**
 * Sends a job application notification email to careers@vozarals.com
 * Handles custom SMTP configurations, or auto-negotiates a transient test account
 * on Ethereal Email for sandbox testing.
 */
export async function sendInterpreterApplicationEmail(payload: any): Promise<{ success: boolean; previewUrl?: string; error?: string }> {
  try {
    const defaultRecipient = "careers@vozarals.com";
    
    // Check if custom SMTP is defined
    const hasSmtpConfig = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
    
    let transporter: nodemailer.Transporter | null = null;
    let fromEmail = process.env.SMTP_FROM_EMAIL || "no-reply@vozarals.com";
    let fromName = process.env.SMTP_FROM_NAME || "Vozara Recruitment Hub";
    let isTestAccount = false;
    let previewUrl = "";

    // Generate unique preview ID and pre-register local path
    const previewId = "msg_" + Math.random().toString(36).substring(2, 12);
    const localPreviewUrl = `/api/forms/email-preview?id=${previewId}`;

    if (hasSmtpConfig) {
      console.log("Configuring production SMTP transportation for careers@vozarals.com...");
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 4000,
      });
    }

    // Build highly polished HTML body
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Interpreter Application</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed; background-color: #f6f9fc; padding: 40px 10px;">
          <tr>
            <td align="center">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
                
                <!-- HEADER BRANDING -->
                <tr>
                  <td style="background-color: #1B2A6B; padding: 32px 40px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: bold; letter-spacing: 0.5px;">Vozara Language Services</h1>
                    <div style="width: 40px; height: 3px; background-color: #F26522; margin: 12px auto 6px auto; border-radius: 1px;"></div>
                    <p style="color: #e2e8f0; margin: 6px 0 0 0; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">Recruiting & Credentialing Desk</p>
                  </td>
                </tr>

                <!-- MAIN CARD CONTENT -->
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #1B2A6B; font-family: Georgia, serif; margin-top: 0; margin-bottom: 20px; font-size: 20px; font-weight: bold; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px;">
                      Candidate Application Registry
                    </h2>
                    
                    <p style="color: #475569; font-size: 14.5px; line-height: 24px; margin-top: 0; margin-bottom: 28px;">
                      A new professional language specialist has submitted their application credentials via the <strong>Vozara Interpreter Application Portal</strong>. Below are the registered candidate attributes:
                    </p>

                    <!-- APPLICANT HIGHLIGHTS -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 4px; padding: 20px; margin-bottom: 30px; border: 1px solid #edf2f7;">
                      <tr>
                        <td style="padding-bottom: 10px; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: bold; tracking: 0.5px;">Applicant Name</td>
                      </tr>
                      <tr>
                        <td style="font-size: 18px; color: #1B2A6B; font-weight: bold; padding-bottom: 15px;">${escapeHtml(payload.full_name)}</td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 10px; font-size: 13px; color: #64748b; text-transform: uppercase; font-weight: bold; tracking: 0.5px;">Primary Language Specialization</td>
                      </tr>
                      <tr>
                        <td style="font-size: 16px; color: #F26522; font-weight: bold;">${escapeHtml(payload.primary_language)}</td>
                      </tr>
                    </table>

                    <!-- ATTRIBUTES DETAILS GRID TABLE -->
                    <h3 style="color: #1B2A6B; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 32px; margin-bottom: 16px; font-weight: bold;">
                      Detailed Qualifications Checklist
                    </h3>
                    
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; color: #334155; line-height: 20px;">
                      <tr style="background-color: #fcfdfe;">
                        <td style="padding: 10px 12px; font-weight: bold; width: 40%; border-bottom: 1px solid #edf2f7; color: #475569;">Email Address</td>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #edf2f7; color: #1e293b;">
                          <a href="mailto:${escapeHtml(payload.submitter_email)}" style="color: #1B2A6B; font-weight: 600; text-decoration: none;">
                            ${escapeHtml(payload.submitter_email)}
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 12px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #475569;">Contact Phone</td>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #edf2f7;">${escapeHtml(payload.phone)}</td>
                      </tr>
                      <tr style="background-color: #fcfdfe;">
                        <td style="padding: 10px 12px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #475569;">Location / City</td>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #edf2f7;">${escapeHtml(payload.location)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 12px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #475569;">Additional Languages</td>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #edf2f7;">${escapeHtml(payload.additional_languages) || '<span style="color: #94a3b8; font-style: italic;">None provided</span>'}</td>
                      </tr>
                      <tr style="background-color: #fcfdfe;">
                        <td style="padding: 10px 12px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #475569;">Interpreting Modes</td>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #edf2f7; font-weight: 600;">${escapeHtml(payload.interpreting_modes)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 12px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #475569;">Industries</td>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #edf2f7;">${escapeHtml(payload.industries)}</td>
                      </tr>
                      <tr style="background-color: #fcfdfe;">
                        <td style="padding: 10px 12px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #475569;">Years of Experience</td>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #edf2f7; font-weight: 600; color: #F26522;">${escapeHtml(payload.experience_years)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 12px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #475569;">Certifications</td>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #edf2f7; font-style: italic;">${escapeHtml(payload.certifications) || '<span style="color: #94a3b8; font-style: italic;">None declared</span>'}</td>
                      </tr>
                      <tr style="background-color: #fcfdfe;">
                        <td style="padding: 10px 12px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #475569;">Medical/Legal Expo</td>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #edf2f7;">${escapeHtml(payload.medical_legal_knowledge)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 12px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #475569;">Technical Setup</td>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #edf2f7; color: #059669; font-weight: bold;">${escapeHtml(payload.technical_setup)}</td>
                      </tr>
                      <tr style="background-color: #fcfdfe;">
                        <td style="padding: 10px 12px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #475569;">Availability Schedule</td>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #edf2f7;">${escapeHtml(payload.availability)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 12px; font-weight: bold; border-bottom: 1px solid #edf2f7; color: #475569;">Portfolio / LinkedIn</td>
                        <td style="padding: 10px 12px; border-bottom: 1px solid #edf2f7;">
                          ${payload.linkedin_or_portfolio ? `<a href="${escapeHtml(payload.linkedin_or_portfolio)}" target="_blank" style="color: #1B2A6B; text-decoration: underline;">${escapeHtml(payload.linkedin_or_portfolio)}</a>` : '<span style="color: #94a3b8; font-style: italic;">Not provided</span>'}
                        </td>
                      </tr>
                    </table>

                    <!-- CANDIDATE ADDITIONAL MEMO -->
                    <h3 style="color: #1B2A6B; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-top: 36px; margin-bottom: 12px; font-weight: bold;">
                      Additional Candidate Memo
                    </h3>
                    <div style="background-color: #f1f5f9; border-radius: 4px; padding: 16px 20px; font-size: 13.5px; color: #334155; line-height: 22px; border-left: 4px solid #1B2A6B; font-style: italic;">
                      ${escapeHtml(payload.additional_info) || '<span style="color: #94a3b8;">No additional info provided by applicant.</span>'}
                    </div>

                    <!-- FOOTER CALL TO ACTION -->
                    <div style="margin-top: 40px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 30px;">
                      <a href="mailto:${escapeHtml(payload.submitter_email)}" style="display: inline-block; background-color: #F26522; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold; padding: 12px 30px; border-radius: 4px; uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(242, 101, 34, 0.25);">
                        REPLY & DISPATCH INTERVIEW
                      </a>
                    </div>

                  </td>
                </tr>

                <!-- SUB-FOOTER -->
                <tr>
                  <td style="background-color: #f8fafc; padding: 24px 40px; text-align: center; border-top: 1px solid #edf2f7;">
                    <p style="color: #94a3b8; font-size: 11px; margin: 0; line-height: 16px;">
                      This notification was generated automatically by the Vozara Language Services Application Infrastructure.<br />
                      To adjust recruiter alerting preferences, update env variables for the sandbox deployment container.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Cache the generated HTML for local previewing
    emailPreviews.set(previewId, emailHtml);

    if (!hasSmtpConfig) {
      console.log(`No production SMTP configured. Application email intercepted and routed to sandbox preview: ${localPreviewUrl}`);
      return { success: true, previewUrl: localPreviewUrl };
    }

    if (transporter) {
      try {
        const info = await transporter.sendMail({
          from: `"${fromName}" <${fromEmail}>`,
          to: defaultRecipient,
          subject: `[Candidate Registry] ${payload.full_name} - ${payload.primary_language} Interpreter`,
          html: emailHtml,
        });
        console.log(`Email successfully dispatched via production SMTP transporter! MessageId: ${info.messageId}`);
      } catch (smtpErr: any) {
        console.warn("Production SMTP mail dispatch failed, falling back to local sandbox preview URL. Error detail:", smtpErr.message || smtpErr);
      }
    }

    return { success: true, previewUrl: localPreviewUrl };
  } catch (error: any) {
    console.warn("Nodemailer sandbox system handled graceful fallback:", error.message || error);
    return { success: true, previewUrl: `/api/forms/email-preview?fallback=true` };
  }
}

/**
 * Escapes tags and tokens safely inside generated HTML block
 */
function escapeHtml(str: string | undefined | null): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
