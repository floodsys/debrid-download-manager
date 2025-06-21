import React from 'react';
import { useQuery } from 'react-query';
import {
  Users,
  Download,
  HardDrive,
  TrendingUp,
  Activity,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { adminAPI } from '../../services/api';
import { formatSize } from '../../utils/helpers';

export default function AdminStats() {
  const { data: stats, isLoading } = useQuery('admin-stats', adminAPI.getStats, {
    refetchInterval: 60000 // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: 'Completed', value: stats?.downloads.byStatus.completed || 0, color: '#10b981' },
    { name: 'Downloading', value: stats?.downloads.byStatus.downloading || 0, color: '#3b82f6' },
    { name: 'Queued', value: stats?.downloads.byStatus.queued || 0, color: '#6b7280' },
    { name: 'Error', value: stats?.downloads.byStatus.error || 0, color: '#ef4444' },
    { name: 'Paused', value: stats?.downloads.byStatus.paused || 0, color: '#f59e0b' }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">System Statistics</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats?.users.total || 0}
          subValue={`${stats?.users.active || 0} active`}
          icon={Users}
          color="blue"
          trend={stats?.users.regular || 0}
          trendLabel="regular users"
        />
        <StatsCard
          title="Total Downloads"
          value={stats?.downloads.total || 0}
          subValue={`${stats?.downloads.active || 0} active`}
          icon={Download}
          color="green"
          trend={`${stats?.downloads.successRate || 0}%`}
          trendLabel="success rate"
        />
        <StatsCard
          title="Total Storage"
          value={formatSize(stats?.downloads.totalSize || 0)}
          subValue={`~${formatSize(stats?.downloads.averageSize || 0)} avg`}
          icon={HardDrive}
          color="purple"
        />
        <StatsCard
          title="System Status"
          value="Operational"
          subValue="All systems running"
          icon={Activity}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Download Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Download Status Distribution</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Over Time */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold">Download Activity (Last 7 Days)</h2>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats?.activity.last7Days || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8b5cf6" 
                  name="Downloads"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* User Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">User Breakdown</h3>
              <Users className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Admin Users</span>
                <span className="font-medium">{stats?.users.admins || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Regular Users</span>
                <span className="font-medium">{stats?.users.regular || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Locked Accounts</span>
                <span className="font-medium text-red-600">{stats?.users.locked || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Download Stats</h3>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Completed
                </span>
                <span className="font-medium">{stats?.downloads.byStatus.completed || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  In Progress
                </span>
                <span className="font-medium">{stats?.downloads.active || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  Failed
                </span>
                <span className="font-medium">{stats?.downloads.byStatus.error || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Categories</h3>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {stats?.categories?.slice(0, 5).map((category) => (
                <div key={category._id} className="flex justify-between items-center">
                  <span className="text-gray-600 truncate flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </span>
                  <span className="font-medium">{category.downloadCount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Stats Card Component
function StatsCard({ title, value, subValue, icon: Icon, color, trend, trendLabel }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subValue && (
              <p className="text-sm text-gray-500 mt-1">{subValue}</p>
            )}
            {trend && (
              <p className="text-xs text-gray-500 mt-2">
                <span className="font-medium">{trend}</span> {trendLabel}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}