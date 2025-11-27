import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { ApiResponse, AuthUser } from '../../../../types';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<{ user: AuthUser; token: string }>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token } = req.body;
  
  try {
    if (!token) {
      return res.status(400).json({ message: 'No token provided' });
    }

    await connectDB();

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    
    if (!payload) {
      return res.status(400).json({ message: 'Invalid token payload' });
    }

    const { name, email, sub } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Email not provided by Google' });
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

    res.status(200).json({ 
      data: {
        user: authUser,
        token: jwtToken
      }
    });
    
  } catch (error: any) {
    console.error('Google auth error:', error);
    
    if (error.message.includes('Token used too late')) {
      return res.status(400).json({ message: 'Token has expired. Please try again.' });
    }
    if (error.message.includes('Invalid token signature')) {
      return res.status(400).json({ message: 'Invalid token. Please try again.' });
    }
    
    res.status(500).json({ message: 'Authentication failed: ' + error.message });
  }
}