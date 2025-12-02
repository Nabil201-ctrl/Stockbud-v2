import { google } from 'googleapis';
import connectDB from './mongodb';
import User from '../models/User';

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: Error;
}

// Gmail API via OAuth2
// Required env vars:
// - GOOGLE_CLIENT_ID
// - GOOGLE_CLIENT_SECRET
// - GOOGLE_REFRESH_TOKEN (or provide per-request refresh token)
// - GMAIL_USER (the email address used as the sender)
// Optional:
// - GOOGLE_REDIRECT_URI

const GMAIL_USER = process.env.GMAIL_USER;

const getOAuth2Client = (refreshToken?: string) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob';

  if (!clientId || !clientSecret) {
    throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables');
  }

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const token = refreshToken || process.env.GOOGLE_REFRESH_TOKEN;
  if (!token) {
    throw new Error('Missing refresh token. Set GOOGLE_REFRESH_TOKEN or pass a refreshToken to the helper');
  }

  oAuth2Client.setCredentials({ refresh_token: token });
  return oAuth2Client;
};

const buildRawMessage = (from: string, to: string, subject: string, html: string) => {
  // Encode non-ASCII subject using RFC2047 "encoded-word" (base64) so subjects with
  // emojis and other unicode characters render correctly in all mail clients.
  const encodeHeader = (value: string) => {
    // If value is pure ASCII, return as-is to keep headers readable
    if (/^[\x00-\x7F]*$/.test(value)) return value;
    return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
  };

  const encodedSubject = encodeHeader(subject);

  const messageParts = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    html,
  ];
  const message = messageParts.join('\r\n');
  // base64url
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const sendRawViaGmail = async (
  to: string,
  subject: string,
  html: string,
  from?: string,
  refreshToken?: string
): Promise<{ messageId?: string }> => {
  const oAuth2Client = getOAuth2Client(refreshToken);
  const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

  const sender = from || GMAIL_USER;
  if (!sender) throw new Error('GMAIL_USER environment variable is required as the sender address');

  const raw = buildRawMessage(sender, to, subject, html);

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw,
    },
  });

  return { messageId: res.data.id };
};

const getRefreshTokenForSender = async (senderEmail?: string) => {
  // Prefer explicit provided refresh token via env or param in getOAuth2Client.
  // If not provided, try to look up a User record with a stored gmailRefreshToken.
  try {
    await connectDB();
    if (senderEmail) {
      const user = await User.findOne({ email: senderEmail });
      if (user && (user as any).gmailRefreshToken) return (user as any).gmailRefreshToken as string;
    }

    // Fallback: find any admin user with a stored refresh token
    const adminWithToken = await User.findOne({ isAdmin: true, gmailRefreshToken: { $exists: true, $ne: null } });
    if (adminWithToken) return (adminWithToken as any).gmailRefreshToken as string;

    // Final fallback to environment variable
    return process.env.GOOGLE_REFRESH_TOKEN;
  } catch (err) {
    console.error('Error fetching refresh token from DB:', err);
    return process.env.GOOGLE_REFRESH_TOKEN;
  }
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<EmailResult> => {
  try {
    const subject = `🎉 Welcome to StockBud, ${name}!`;
    const html = `
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
    `;

    // Resolve refresh token from DB (admin) or env
    const refreshToken = await getRefreshTokenForSender();
    const { messageId } = await sendRawViaGmail(email, subject, html, undefined, refreshToken);
    console.log('Welcome email sent: %s', messageId);
    return { success: true, messageId };
  } catch (error) {
    console.error('Welcome email sending error:', error);
    return { success: false, error: error as Error };
  }
};

export const sendBulkEmail = async (
  emails: string[],
  message: string,
  subject: string = 'Important Update from StockBud',
  senderEmail?: string
): Promise<EmailResult> => {
  try {
    // Send individually to avoid exposing recipients to each other
    let lastMessageId: string | undefined;
    const refreshToken = await getRefreshTokenForSender(senderEmail);
    for (const recipient of emails) {
      const html = `
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
      `;

      const { messageId } = await sendRawViaGmail(recipient, subject, html, undefined, refreshToken);
      lastMessageId = messageId;
      console.log('Bulk email sent to %s: %s', recipient, messageId);
    }

    return { success: true, messageId: lastMessageId };
  } catch (error) {
    console.error('Bulk email sending error:', error);
    return { success: false, error: error as Error };
  }
};

export const verifySmtpConnection = async () => {
  try {
    // Verify OAuth2 credentials by fetching the authenticated profile
    const oAuth2Client = getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });
    const profile = await gmail.users.getProfile({ userId: 'me' });
    console.log('Gmail profile fetched:', profile.data.emailAddress);
    return { success: true, message: 'Gmail API verified successfully.', profile: profile.data };
  } catch (error) {
    console.error('Gmail API verification failed:', error);
    return { success: false, message: 'Gmail API verification failed.', error };
  }
};
