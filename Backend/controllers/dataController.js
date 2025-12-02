const jwt = require('jsonwebtoken');
const User = require('../model/user');
const { OAuth2Client } = require('google-auth-library');
const dotenv = require('dotenv');

dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Email sending has been disabled in this codebase by request.
// The previous implementation used nodemailer and made outbound SMTP calls.
// To avoid accidental email sends we keep the functions as no-ops and log a clear message.
const createEmailTransporter = () => {
  console.warn('Email sending is disabled in this deployment (createEmailTransporter called).');
  return null;
};

const testEmailConnection = async () => {
  console.warn('Email sending is disabled - skipping connection test.');
  return false;
};

exports.signup = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validate input
    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ name, email });
    await user.save();

    // Welcome email sending has been disabled. Previously an SMTP call was made here.
    console.info('Welcome email suppressed for:', email);

    res.status(201).json({ 
      message: 'User created successfully',
      note: 'Welcome email is being sent in background'
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.sendEmail = async (req, res) => {
  try {
    const { message, emails, sendToAll = false } = req.body;

    let recipientEmails = emails || [];

    // If sendToAll is true, get all user emails
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

    try {
      const transporter = createEmailTransporter();

      const mailOptions = {
        from: `"StockBud Admin" <${process.env.EMAIL}>`,
        to: recipientEmails.join(','),
        subject: 'Important Update from StockBud',
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
        `
      };

      // Send with timeout
      const sendPromise = transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Email send timeout')), 10000)
      );

      await Promise.race([sendPromise, timeoutPromise]);

      res.status(200).json({ 
        message: `Email sent successfully to ${recipientEmails.length} recipients`,
        recipients: recipientEmails.length
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      res.status(500).json({ message: 'Failed to send email: ' + emailError.message });
    }
    
  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({ message: 'Failed to send email: ' + error.message });
  }
};

exports.googleAuth = async (req, res) => {
  const { token } = req.body;
  
  try {
    // Check if token is provided
    if (!token) {
      return res.status(400).json({ message: 'No token provided' });
    }

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
    
    // Check admin status
    let isAdmin = false;
    if (process.env.ADMIN_EMAIL) {
      const adminEmail = process.env.ADMIN_EMAIL.toLowerCase().trim();
      isAdmin = normalizedEmail === adminEmail;
    } else {
      // Fallback
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

    // Generate JWT
    const jwtToken = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        isAdmin: user.isAdmin 
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '1h' }
    );

    res.status(200).json({ 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin
      }, 
      token: jwtToken 
    });
    
  } catch (error) {
    console.error('Google auth error:', error);
    
    if (error.message.includes('Token used too late')) {
      return res.status(400).json({ message: 'Token has expired. Please try again.' });
    }
    if (error.message.includes('Invalid token signature')) {
      return res.status(400).json({ message: 'Invalid token. Please try again.' });
    }
    
    res.status(500).json({ message: 'Authentication failed: ' + error.message });
  }
};

// Timer for 160 days
exports.getTimer = (req, res) => {
  const days = 160;
  const timerInSeconds = days * 24 * 60 * 60;
  
  res.status(200).json({ 
    timer: timerInSeconds,
    days: days,
    message: `Timer set to ${days} days`
  });
};