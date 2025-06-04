import React, { useEffect, useState } from 'react';
import AnalyticsChart from '../components/admin/AnalyticsChart';
import Button from '../components/common/Button';

interface MessageStats {
  name: string;
  messages: number;
}

interface UserStats {
  name: string;
  online: number;
}

const AdminDashboardPage: React.FC = () => {
  const [messageStats, setMessageStats] = useState<MessageStats[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/stats'); // Adjust endpoint as needed
        const data = await response.json();
        
        setMessageStats(data.messageStats);
        setUserStats(data.userStats);
      } catch (err) {
        setError('Failed to load analytics data');
        console.error('Error loading analytics:', err);
        // Use fallback data during development
        setMessageStats([
          { name: '3 Days Ago', messages: 45 },
          { name: '2 Days Ago', messages: 52 },
          { name: 'Yesterday', messages: 78 },
          { name: 'Today', messages: 63 },
        ]);
        setUserStats([
          { name: 'Mon', online: 24 },
          { name: 'Tue', online: 28 },
          { name: 'Wed', online: 32 },
          { name: 'Thu', online: 37 },
          { name: 'Fri', online: 42 },
          { name: 'Sat', online: 38 },
          { name: 'Sun', online: 35 },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-700">Online Users</h3>
          <p className="mt-1 text-3xl font-semibold text-primary-600">{userStats.filter(u => u.online > 0).length}</p>
        </div>
        <div className="bg-white p-6 shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-700">Total Users</h3>
          <p className="mt-1 text-3xl font-semibold text-primary-600">{userStats.length}</p>
        </div>
        <div className="bg-white p-6 shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-700">Total Messages</h3>
          <p className="mt-1 text-3xl font-semibold text-primary-600">{messageStats.reduce((acc, stat) => acc + stat.messages, 0)}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Message Volume (Last 4 Days)</h3>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <AnalyticsChart data={messageStats} dataKeyX="name" dataKeyBar="messages" barName="Messages Sent" fillColor="#3b82f6" />
          )}
        </div>
        <div className="bg-white p-6 shadow rounded-lg">
          <h3 className="text-lg font-medium text-gray-700 mb-4">User Activity (Online This Week)</h3>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <AnalyticsChart data={userStats} dataKeyX="name" dataKeyBar="online" barName="Online Users" fillColor="#10b981" />
          )}
        </div>
      </div>
      
      {/* Placeholder for User Management Table */}
      <div className="bg-white p-6 shadow rounded-lg">
        <h3 className="text-lg font-medium text-gray-700 mb-4">User Management (Placeholder)</h3>
        <p className="text-gray-500">A table listing all users with options to manage them (edit role, ban, etc.) would go here.</p>
        {/* Example: Could list first few users */}
        <ul className="mt-4 space-y-2">
        {userStats.slice(0,5).map(user => (
            <li key={user.name} className="flex justify-between items-center p-2 border rounded-md">
                <span>{user.name} - Online: {user.online}</span>
                <Button size="sm" variant="secondary">Manage</Button>
            </li>
        ))}
        </ul>
      </div>

    </div>
  );
};

export default AdminDashboardPage;