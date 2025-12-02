// Email sending disabled for v2
// The project no longer uses the internal email sender in v2. Expose no-op functions
// that preserve the original function signatures so callers don't break.

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: Error;
}

export const sendWelcomeEmail = async (_email: string, _name: string): Promise<EmailResult> => {
  console.warn('sendWelcomeEmail called but email sending is disabled in v2');
  return { success: false, error: new Error('Email sending disabled in v2') };
};

export const sendBulkEmail = async (
  _emails: string[],
  _message: string,
  _subject: string = 'Important Update from StockBud',
  _senderEmail?: string
): Promise<EmailResult> => {
  console.warn('sendBulkEmail called but email sending is disabled in v2');
  return { success: false, error: new Error('Email sending disabled in v2') };
};

export const verifySmtpConnection = async () => {
  console.warn('verifySmtpConnection called but email sending is disabled in v2');
  return { success: false, message: 'Email sending disabled in v2' };
};
