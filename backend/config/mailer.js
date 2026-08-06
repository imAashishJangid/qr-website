import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOtpEmail = async (to, otp) => {
  await transporter.sendMail({
    from: `"Smart QR Food" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Your password reset code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 420px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #EF4444; margin-bottom: 4px;">Smart QR Food</h2>
        <p style="color: #374151;">Use the code below to reset your vendor account password. It expires in 10 minutes.</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; background: #FEF2F2; color: #DC2626; padding: 16px; border-radius: 12px; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #9CA3AF; font-size: 13px;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};

const CONTACT_RECIPIENTS = ['kumawath649@gmail.com', 'ashishjangid006@gmail.com'];

export const sendContactEnquiryEmail = async ({ name, email, phone, message }) => {
  await transporter.sendMail({
    from: `"Smart QR Food Website" <${process.env.EMAIL_USER}>`,
    to: CONTACT_RECIPIENTS,
    replyTo: email,
    subject: `New enquiry from ${name} — Smart QR Food`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #EF4444; margin-bottom: 4px;">New Website Enquiry</h2>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
          <tr><td style="padding: 8px 0; color: #6B7280; width: 90px;">Name</td><td style="padding: 8px 0; color: #111827; font-weight: 600;">${name}</td></tr>
          <tr><td style="padding: 8px 0; color: #6B7280;">Email</td><td style="padding: 8px 0; color: #111827;">${email}</td></tr>
          <tr><td style="padding: 8px 0; color: #6B7280;">Phone</td><td style="padding: 8px 0; color: #111827;">${phone}</td></tr>
        </table>
        <p style="color: #6B7280; margin-top: 16px; margin-bottom: 4px;">Message</p>
        <div style="background: #FEF2F2; color: #374151; padding: 16px; border-radius: 12px; white-space: pre-wrap;">${message}</div>
      </div>
    `,
  });
};

export default transporter;
