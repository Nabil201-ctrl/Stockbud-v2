import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { AuthUser } from '../../../../types';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { message: 'No token provided' },
        { status: 400 }
      );
    }

    await connectDB();

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    if (!payload) {
      return NextResponse.json(
        { message: 'Invalid token payload' },
        { status: 400 }
      );
    }

    const { name, email, sub } = payload;

    if (!email) {
      return NextResponse.json(
        { message: 'Email not provided by Google' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    
    let isAdmin = false;
    if (process.env.ADMIN_EMAIL) {
      const adminEmail = process.env.ADMIN_EMAIL.toLowerCase().trim();
      isAdmin = normalizedEmail === adminEmail;
    } else {
      const adminEmails = ['abubakar.nabil.210@gmail.com'];
      isAdmin = adminEmails.some(adminEmail => 
        adminEmail.toLowerCase().trim() === normalizedEmail
      );
    }
    
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = new User({ 
        name: name || 'Unknown', 
        email: normalizedEmail, 
        googleId: sub, 
        isAdmin 
      });
      await user.save();
    } else {
      if (user.isAdmin !== isAdmin) {
        user.isAdmin = isAdmin;
      }
      user.name = name || user.name;
      user.googleId = sub;
      await user.save();
    }

    const jwtToken = jwt.sign(
      { 
        id: user._id.toString(), 
        email: user.email, 
        isAdmin: user.isAdmin 
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    const authUser: AuthUser = {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin
    };

    return NextResponse.json({
      data: {
        user: authUser,
        token: jwtToken
      }
    });
    
  } catch (error: any) {
    console.error('Google auth error:', error);
    
    if (error.message.includes('Token used too late')) {
      return NextResponse.json(
        { message: 'Token has expired. Please try again.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Authentication failed: ' + error.message },
      { status: 500 }
    );
  }
}