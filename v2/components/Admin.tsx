'use client';

import { useState } from 'react';
import { Users, Mail, Menu, X } from 'lucide-react';
import UsersComponent from './Users';
import SendEmailComponent from './SendEmail';
import { useAuth } from './AuthProvider';
import { useRouter } from 'next/navigation';

interface Tab {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState<string>('users');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const { user, logout } = useAuth();
  const router = useRouter();

  const tabs: Tab[] = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'send-email', label: 'Send Email', icon: Mail }
  ];

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="flex">
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <div className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white/90 backdrop-blur-xl shadow-2xl transform ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } transition-transform duration-300 ease-in-out border-r border-gray-200/50`}>
          
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Admin Panel
            </h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {user && (
            <div className="p-6 border-b border-gray-200/50 text-center">
              <p className="font-semibold text-gray-800">{user.name}</p>
              <p className="text-sm text-gray-600">{user.email}</p>
              <div className="mt-4 flex items-center justify-center space-x-2">
                <a
                  href={`/api/auth/google/authorize?token=${encodeURIComponent((user.email && (typeof window !== 'undefined') ? '' : '') )}`}
                  onClick={(e) => {
                    // If we have a token in localStorage, use it by setting location.href instead of relying on the raw href
                    e.preventDefault();
                    const token = localStorage.getItem('adminToken');
                    const url = token
                      ? `/api/auth/google/authorize?token=${encodeURIComponent(token)}`
                      : '/api/auth/google/authorize';
                    window.location.href = url;
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Connect Gmail
                </a>

                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          )}

          <nav className="p-6">
            <ul className="space-y-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <li key={tab.id}>
                    <button
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105'
                          : 'text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-600'
                      }`}
                    >
                      <Icon className={`w-5 h-5 transition-transform duration-300 ${
                        isActive ? 'scale-110' : 'group-hover:scale-110'
                      }`} />
                      <span className="font-medium">{tab.label}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="flex-1 flex flex-col min-h-screen">
          <header className="lg:hidden bg-white/90 backdrop-blur-xl border-b border-gray-200/50 p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Admin
              </h1>
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </header>

          <main className="flex-1 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-8 min-h-[calc(100vh-12rem)]">
                <div className="animate-fade-in">
                  {activeTab === 'users' && <UsersComponent />}
                  {activeTab === 'send-email' && <SendEmailComponent />}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}