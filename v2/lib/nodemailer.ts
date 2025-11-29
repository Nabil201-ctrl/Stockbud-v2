import nodemailer from 'nodemailer';

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: Error;
}

// Create a Nodemailer transporter.
// Prefer explicit Zoho vars, but fall back to generic SMTP_* variables for compatibility.
const host = process.env.ZOHO_SMTP_HOST || process.env.SMTP_HOST || 'smtp.zoho.com';
const port = parseInt(process.env.ZOHO_SMTP_PORT || process.env.SMTP_PORT || '465');
const secure = (process.env.ZOHO_SMTP_SECURE || process.env.SMTP_SECURE || 'true') === 'true';
const user = process.env.ZOHO_SMTP_USER || process.env.SMTP_USER;
const pass = process.env.ZOHO_SMTP_PASSWORD || process.env.SMTP_PASSWORD;
const fromEmail = process.env.ZOHO_SMTP_FROM_EMAIL || process.env.SMTP_FROM_EMAIL;

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: {
    user,
    pass,
  },
});

export const sendWelcomeEmail = async (email: string, name: string): Promise<EmailResult> => {
  try {
    const info = await transporter.sendMail({
  from: `StockBud <${fromEmail}>`,
      to: email,
      subject: `🎉 Welcome to StockBud, ${name}!`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f9fafb; padding: 40px 0; color: #1f2937;">
          <div style="max-width: 640px; margin: auto; background: #ffffff; border-radius: 12px; box-shadow: 0 2px 6px rgba(0,0,0,0.05); overflow: hidden;">
            <div style="background: #4F46E5; color: white; text-align: center; padding: 30px 20px;">
              <h1 style="margin: 0; font-size: 24px;">Welcome to <span style="color: #a5b4fc;">StockBud</span> 🎉</h1>
            </div>
            <div style="padding: 30px;">
              <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
              <p style="font-size: 15px; line-height: 1.7;">
                We're thrilled to have you on board! You've just joined a community of smart business owners who are taking control of their store management with ease.
              </p>
              <ul style="padding: 0; list-style: none; font-size: 15px; line-height: 1.6;">
                <li> <strong>Smart Inventory Management</strong> – never run out of stock unexpectedly.</li>
                <li> <strong>Customer Insights</strong> – understand what drives your sales.</li>
                <li> <strong>AI Marketing Assistant</strong> – grow faster with smart suggestions.</li>
                <li> <strong>Easy Reports</strong> – get clear summaries anytime.</li>
                <li> <strong>Works Online & Offline</strong> – manage your business anywhere.</li>
              </ul>
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 25px 0;">
                <p style="margin: 0; font-size: 15px;">
                  ✨ <strong>Next Steps:</strong><br>
                  You're on our exclusive waitlist — we'll notify you first when StockBud officially launches! Expect updates, insights, and early-bird offers.
                </p>
              </div>
              <p style="margin-top: 20px; font-size: 15px;">Warm regards,<br><strong>The StockBud Team</strong></p>
            </div>
          </div>
        </div>
      `,
    });
    console.log('Welcome email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Welcome email sending error:', error);
    return { success: false, error: error as Error };
  }
};

export const sendBulkEmail = async (
  emails: string[],
  message: string,
  subject: string = 'Important Update from StockBud'
): Promise<EmailResult> => {
  try {
    const info = await transporter.sendMail({
  from: `StockBud <${fromEmail}>`,
      to: emails.join(', '),
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #4F46E5; margin: 0;">StockBud Update</h2>
          </div>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #4F46E5;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #6b7280;">
            <p>This email was sent from StockBud Admin Panel</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      `,
    });
    console.log('Bulk email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Bulk email sending error:', error);
    return { success: false, error: error as Error };
  }
};

export const verifySmtpConnection = async () => {
  try {
    await transporter.verify();
    console.log('SMTP connection verified successfully.');
    return { success: true, message: 'SMTP connection verified successfully.' };
  } catch (error) {
    console.error('SMTP connection verification failed:', error);
    return { success: false, message: 'SMTP connection verification failed.', error };
  }
};
