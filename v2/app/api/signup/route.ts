import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import { sendWelcomeEmail } from '../../../lib/nodemailer';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { message: 'Name and email are required' },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 400 }
      );
    }

    const user = new User({ name, email });
    await user.save();
    // Send welcome email in background (don't fail the request if email fails)
    (async () => {
      try {
        await sendWelcomeEmail(email, name);
      } catch (err) {
        console.error('Background welcome email failed:', err);
      }
    })();

    return NextResponse.json(
      {
        message: 'User created successfully',
        note: 'Welcome email will be sent in background'
      },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error('Signup error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { message: 'User already exists with this email' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}