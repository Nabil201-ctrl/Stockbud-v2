'use client';

import { useState, useEffect } from 'react';
import { Send, Users, Mail, Check, X } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { User } from '../types';

export default function SendEmail() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        setStatus('Failed to load users');
      }
    };

    if (token) {
      fetchUsers();
    }
  }, [token]);

  useEffect(() => {
    if (users.length > 0) {
      setSelectAll(selectedUsers.length === users.length);
    }
  }, [selectedUsers, users.length]);

  const handleUserSelection = (email: string) => {
    setSelectedUsers(prevSelected => {
      if (prevSelected.includes(email)) {
        return prevSelected.filter(e => e !== email);
      } else {
        return [...prevSelected, email];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      const allEmails = users.map(user => user.email);
      setSelectedUsers(allEmails);
    }
    setSelectAll(!selectAll);
  };

  const clearSelection = () => {
    setSelectedUsers([]);
    setSelectAll(false);
  };

  const sendEmail = async (sendToAll = false) => {
    setIsLoading(true);
    setStatus("Sending...");
    
    if (!token) {
      setStatus("Authentication required to send email.");
      setIsLoading(false);
      return;
    }

    if (!sendToAll && selectedUsers.length === 0) {
      setStatus("Please select at least one user to send the email to.");
      setIsLoading(false);
      return;
    }

    if (!message.trim()) {
      setStatus("Please enter a message to send.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: message.trim(), 
          emails: sendToAll ? [] : selectedUsers,
          sendToAll 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      setStatus(`✅ ${data.message}`);
      if (!sendToAll) {
        setMessage("");
        setSelectedUsers([]);
        setSelectAll(false);
      }
    } catch (err: any) {
      setStatus(`❌ ${err.message || 'Please try again later.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendEmail(false);
  };

  const handleSendToAll = async () => {
    await sendEmail(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Email Campaign
        </h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span>{users.length} total users</span>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Select Recipients</h2>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              {selectedUsers.length} of {users.length} selected
            </span>
            {selectedUsers.length > 0 && (
              <button
                onClick={clearSelection}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <button
            onClick={handleSelectAll}
            className={`flex items-center space-x-2 px-4 py-2 rounded border ${
              selectAll 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Check className={`w-4 h-4 ${selectAll ? 'text-indigo-600' : 'text-gray-400'}`} />
            <span>{selectAll ? 'All Selected' : 'Select All Users'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-3 border border-gray-200 rounded bg-gray-50">
          {users.map(user => (
            <div 
              key={user._id} 
              className={`flex items-center space-x-3 p-3 rounded border cursor-pointer ${
                selectedUsers.includes(user.email)
                  ? 'bg-indigo-50 border-indigo-200'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => handleUserSelection(user.email)}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                selectedUsers.includes(user.email)
                  ? 'bg-indigo-600 border-indigo-600 text-white'
                  : 'border-gray-300'
              }`}>
                {selectedUsers.includes(user.email) && <Check className="w-3 h-3" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label htmlFor="message" className="block text-lg font-semibold text-gray-800">
              Compose Your Message
            </label>
            <div className="relative">
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={10}
                placeholder="Write your email message here..."
                className="w-full px-4 py-4 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-700 placeholder-gray-400 resize-none"
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400 bg-white px-2 py-1 rounded">
                {message.length} characters
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              type="submit"
              disabled={isLoading || !message.trim() || selectedUsers.length === 0}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded shadow hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center space-x-2">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending to {selectedUsers.length} users...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send to Selected ({selectedUsers.length})</span>
                  </>
                )}
              </div>
            </button>

            <button 
              type="button"
              onClick={handleSendToAll}
              disabled={isLoading || !message.trim() || users.length === 0}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded shadow hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center space-x-2">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Sending to all...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>Send to All ({users.length})</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </form>
        
        {status && (
          <div className={`mt-6 p-4 rounded border ${
            status.includes('✅') 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : status.includes('Sending') || status.includes('sending')
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              {status.includes('✅') && <Check className="w-5 h-5" />}
              <span className="font-medium">{status}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}