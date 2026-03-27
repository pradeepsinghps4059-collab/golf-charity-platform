const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE) === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    console.log(`[email skipped] ${subject} -> ${to}`);
    return { skipped: true };
  }

  return activeTransporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
};

const sendSystemUpdateEmail = async ({ email, name, title, body }) => {
  return sendEmail({
    to: email,
    subject: title,
    text: `Hi ${name},\n\n${body}\n\nGolf Charity`,
    html: `<p>Hi ${name},</p><p>${body}</p><p>Golf Charity</p>`,
  });
};

const sendDrawResultsEmail = async ({ email, name, month }) => {
  return sendEmail({
    to: email,
    subject: `Draw results are live for ${month}`,
    text: `Hi ${name},\n\nDraw results for ${month} have been published. Sign in to review your results.\n\nGolf Charity`,
    html: `<p>Hi ${name},</p><p>Draw results for <strong>${month}</strong> have been published. Sign in to review your results.</p><p>Golf Charity</p>`,
  });
};

const sendWinnerAlertEmail = async ({ email, name, tier, amount, status }) => {
  return sendEmail({
    to: email,
    subject: `Winner update: ${tier} tier`,
    text: `Hi ${name},\n\nYour winner record has been updated.\nTier: ${tier}\nAmount: Rs ${amount}\nStatus: ${status}\n\nGolf Charity`,
    html: `<p>Hi ${name},</p><p>Your winner record has been updated.</p><ul><li>Tier: <strong>${tier}</strong></li><li>Amount: <strong>Rs ${amount}</strong></li><li>Status: <strong>${status}</strong></li></ul><p>Golf Charity</p>`,
  });
};

module.exports = {
  sendEmail,
  sendSystemUpdateEmail,
  sendDrawResultsEmail,
  sendWinnerAlertEmail,
};
