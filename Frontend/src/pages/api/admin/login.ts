import React, { useContext } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../../src/context/AuthContext';
import { useRouter } from 'next/router';
import { GoogleCredentialResponse } from '../../types';

export default function AdminLogin() {
  const { login } = useContext(AuthContext);
  const router = useRouter();

  const handleSuccess = async (credentialResponse: GoogleCredentialResponse) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.data.user.isAdmin) {
          login(data.data.token, data.data.user);
          router.push('/admin/dashboard');
        } else {
          alert('You are not authorized as an admin. Please use an admin account.');
        }
      } else {
        alert(`Authentication failed: ${data.message}`);
      }
    } catch (error) {
      alert('An error occurred during login. Please try again.');
    }
  };

  const handleError = () => {
    alert('Google login failed. Please try again.');
  };

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-8 max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-red-600">Configuration Error</h1>
          <p className="text-gray-600 mt-2">Google Client ID is not configured.</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-8 max-w-md w-full text-center space-y-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Admin Login
          </h1>
          <p className="text-gray-600">Sign in with your Google Admin account.</p>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={handleError}
              useOneTap
            />
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}