/**
 * Email helper
 * - SMTP_* set → real inbox
 * - else Ethereal test account (preview URL) — cached for process lifetime
 */
const nodemailer = require("nodemailer");

const sentLog = [];
let cachedEthereal = null;

async function getTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      transporter: nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || "false") === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }),
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      mode: "smtp",
    };
  }

  if (!cachedEthereal) {
    const testAccount = await nodemailer.createTestAccount();
    cachedEthereal = {
      user: testAccount.user,
      pass: testAccount.pass,
    };
    console.log(
      "\n✉ Ethereal test mailbox created (dev). Emails will NOT hit real inboxes."
    );
    console.log("   Set SMTP_HOST / SMTP_USER / SMTP_PASS in .env for real email.\n");
  }

  return {
    transporter: nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: cachedEthereal.user,
        pass: cachedEthereal.pass,
      },
    }),
    from: `"FlowDesk" <${cachedEthereal.user}>`,
    mode: "ethereal",
  };
}

async function sendEmail({ to, subject, html, text }) {
  try {
    const { transporter, from, mode } = await getTransporter();
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html:
        html ||
        `<div style="font-family:sans-serif;line-height:1.5">
          <p>${String(text || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/\n/g, "<br/>")}</p>
          <hr/>
          <p style="color:#64748b;font-size:12px">FlowDesk notification</p>
        </div>`,
      text,
    });

    const previewUrl =
      mode === "ethereal" ? nodemailer.getTestMessageUrl(info) : null;

    const entry = {
      id: info.messageId,
      to,
      subject,
      mode,
      previewUrl,
      at: new Date().toISOString(),
    };
    sentLog.unshift(entry);
    if (sentLog.length > 80) sentLog.pop();

    console.log("\n✉ EMAIL -----------------------");
    console.log("Mode:", mode);
    console.log("To:", to);
    console.log("Subject:", subject);
    if (previewUrl) console.log("Open email preview:", previewUrl);
    else console.log("Delivered via SMTP");
    console.log("--------------------------------\n");

    return entry;
  } catch (err) {
    console.error("Email send failed:", err.message);
    const entry = {
      id: `fail_${Date.now()}`,
      to,
      subject,
      mode: "failed",
      previewUrl: null,
      error: err.message,
      at: new Date().toISOString(),
    };
    sentLog.unshift(entry);
    return entry;
  }
}

function getRecentEmails() {
  return sentLog;
}

module.exports = { sendEmail, getRecentEmails };
