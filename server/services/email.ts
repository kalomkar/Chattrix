import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter: any = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn('[EMAIL_SERVICE] Missing EMAIL_USER or EMAIL_PASS. Emails will be logged to console instead of being sent.');
    return null;
  }

  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: { user, pass },
  });

  return transporter;
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const url = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  const t = getTransporter();

  if (!t) {
    console.log('--- VERIFICATION EMAIL ---');
    console.log(`To: ${email}`);
    console.log(`Verification URL: ${url}`);
    console.log('--------------------------');
    return;
  }
  
  await t.sendMail({
    from: '"Chattrix" <no-reply@chattrix.com>',
    to: email,
    subject: 'Verify your email',
    html: `<h1>Welcome to Chattrix</h1><p>Click <a href="${url}">here</a> to verify your email.</p>`,
  });
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const url = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  const t = getTransporter();

  if (!t) {
    console.log('--- PASSWORD RESET EMAIL ---');
    console.log(`To: ${email}`);
    console.log(`Reset URL: ${url}`);
    console.log('-----------------------------');
    return;
  }
  
  await t.sendMail({
    from: '"Chattrix" <no-reply@chattrix.com>',
    to: email,
    subject: 'Reset your password',
    html: `<h1>Reset Password</h1><p>Click <a href="${url}">here</a> to reset your password. This link expires in 15 minutes.</p>`,
  });
};
