import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import { sendBulkEmail } from '../../../lib/nodemailer';
import { AuthUser } from '../../../types';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthUser;
    
    if (!decoded.isAdmin) {
      return NextResponse.json(
        { message: 'Access denied. Admin only.' },
        { status: 403 }
      );
    }

    await connectDB();

    const { message, emails, subject, sendToAll = false } = await request.json();

    let recipientEmails = emails || [];

    if (sendToAll) {
      const allUsers = await User.find({}, 'email');
      recipientEmails = allUsers.map(user => user.email);
    }

    if (!recipientEmails || recipientEmails.length === 0) {
      return NextResponse.json(
        { message: 'No recipients selected' },
        { status: 400 }
      );
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { message: 'Message cannot be empty' },
        { status: 400 }
      );
    }

  const emailResult = await sendBulkEmail(recipientEmails, message, subject, decoded.email);

    if (!emailResult.success) {
      return NextResponse.json(
        { message: 'Failed to send email: ' + emailResult.error?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: `Email sent successfully to ${recipientEmails.length} recipients`,
      recipients: recipientEmails.length
    });
    
  } catch (error: any) {
    console.error('Send email error:', error);
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { message: 'Failed to send email: ' + error.message },
      { status: 500 }
    );
  }
}