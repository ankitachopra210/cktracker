const nodemailer = require('nodemailer');
const { SMTP } = require('./env');
const logger = require('../utils/logger');

let transporter = null;

if (SMTP.user && SMTP.pass && SMTP.user !== 'mock_user') {
  transporter = nodemailer.createTransport({
    host: SMTP.host,
    port: SMTP.port,
    auth: {
      user: SMTP.user,
      pass: SMTP.pass,
    },
  });
  logger.info('Nodemailer SMTP transporter initialized.');
} else {
  logger.info('Nodemailer running in development/simulation mode (emails logged to console).');
}

/**
 * Send an email notification
 * @param {{ to: string, subject: string, text?: string, html?: string, attachments?: any[] }} options
 */
const sendEmail = async ({ to, subject, text, html, attachments = [] }) => {
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: SMTP.from,
        to,
        subject,
        text,
        html,
        attachments,
      });
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      logger.error('Failed to send email:', err.message);
      return { success: false, error: err.message };
    }
  }

  // Fallback simulation in dev
  logger.info(`[EMAIL SIMULATION] To: ${to} | Subject: "${subject}"`);
  return { success: true, simulated: true };
};

module.exports = {
  sendEmail,
};
