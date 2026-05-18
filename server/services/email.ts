import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email: string, token: string) => {
  const url = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  await transporter.sendMail({
    from: '"Chattrix" <no-reply@chattrix.com>',
    to: email,
    subject: 'Verify your email',
    html: `<h1>Welcome to Chattrix</h1><p>Click <a href="${url}">here</a> to verify your email.</p>`,
  });
};

export const sendResetPasswordEmail = async (email: string, token: string) => {
  const url = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  
  await transporter.sendMail({
    from: '"Chattrix" <no-reply@chattrix.com>',
    to: email,
    subject: 'Reset your password',
    html: `<h1>Reset Password</h1><p>Click <a href="${url}">here</a> to reset your password. This link expires in 15 minutes.</p>`,
  });
};
