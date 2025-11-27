import { useState, useEffect, useContext } from 'react';
import { UserPlus, Activity } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { User } from '../../types';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchUsers = async (): Promise<void> => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch('/api/users', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: User[] = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [token]);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not Available';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg mb-6 w-32"></div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Users Management
        </h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <UserPlus className="w-4 h-4" />
          <span>{users.length} total users</span>
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 font-semibold text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100">
                  Name
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100">
                  Email
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100">
                  Joined Date
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: User, index: number) => (
                <tr 
                  key={user._id} 
                  className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-sm"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">{user.email}</td>
                  <td className="py-4 px-6 text-gray-600">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Activity className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}