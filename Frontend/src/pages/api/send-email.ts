import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import { sendBulkEmail } from '../../../lib/resend';
import { ApiResponse, AuthUser, SendEmailRequest } from '../../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthUser;
    
    if (!decoded.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    await connectDB();

    const { message, emails, sendToAll = false }: SendEmailRequest = req.body;

    let recipientEmails = emails || [];

    if (sendToAll) {
      const allUsers = await User.find({}, 'email');
      recipientEmails = allUsers.map(user => user.email);
    }

    if (!recipientEmails || recipientEmails.length === 0) {
      return res.status(400).json({ message: 'No recipients selected' });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const emailResult = await sendBulkEmail(recipientEmails, message);

    if (!emailResult.success) {
      return res.status(500).json({ message: 'Failed to send email: ' + emailResult.error?.message });
    }

    res.status(200).json({ 
      message: `Email sent successfully to ${recipientEmails.length} recipients`,
      recipients: recipientEmails.length
    });
    
  } catch (error: any) {
    console.error('Send email error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    res.status(500).json({ message: 'Failed to send email: ' + error.message });
  }
}