import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { 
  Plus, 
  Download, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  HardDrive,
  Activity,
  Link2,
  FolderOpen
} from 'lucide-react';
import { downloadsAPI, categoriesAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useSocket } from '../services/socket';
import Modal from '../components/Modal';
import DownloadsList from '../components/DownloadsList';
import toast from 'react-hot-toast';

// Stats Card Component
function StatsCard({ title, value, icon: Icon, color = 'blue', trend }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {trend && (
              <p className="text-sm text-gray-500 mt-1">
                <TrendingUp className="inline w-4 h-4 mr-1" />
                {trend}
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

// Add Download Modal Component
function AddDownloadModal({ isOpen, onClose, categories }) {
  const queryClient = useQueryClient();
  const { canDownload, getRemainingDownloads } = useAuthStore();
  
  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors, isSubmitting } 
  } = useForm();

  const addMutation = useMutation(downloadsAPI.add, {
    onSuccess: () => {
      queryClient.invalidateQueries(['downloads']);
      queryClient.invalidateQueries(['download-stats']);
      toast.success('Download added successfully');
      reset();
      onClose();
    },
  });

  const onSubmit = (data) => {
    if (!canDownload()) {
      toast.error('Download quota exceeded for today');
      return;
    }
    
    addMutation.mutate(data);
  };

  const remainingDownloads = getRemainingDownloads();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Download"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {remainingDownloads !== null && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              You have <span className="font-semibold">{remainingDownloads}</span> downloads remaining today
            </p>
          </div>
        )}
        
        <div>
          <label htmlFor="magnetLink" className="form-label">
            Magnet Link
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Link2 className="h-5 w-5 text-gray-400" />
            </div>
            <textarea
              {...register('magnetLink', {
                required: 'Magnet link is required',
                pattern: {
                  value: /^magnet:\?xt=urn:btih:[a-fA-F0-9]{40}/,
                  message: 'Invalid magnet link format'
                }
              })}
              className="form-input pl-10 font-mono text-sm"
              rows="3"
              placeholder="magnet:?xt=urn:btih:..."
            />
          </div>
          {errors.magnetLink && (
            <p className="form-error">{errors.magnetLink.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="categoryId" className="form-label">
            Category (Optional)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FolderOpen className="h-5 w-5 text-gray-400" />
            </div>
            <select
              {...register('categoryId')}
              className="form-input pl-10"
            >
              <option value="">Auto-detect category</option>
              {categories?.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="btn btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !canDownload()}
            className="btn btn-primary"
          >
            {isSubmitting ? 'Adding...' : 'Add Download'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Main Dashboard Component
export default function Dashboard() {
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Queries
  const { data: stats } = useQuery(
    'download-stats',
    downloadsAPI.getStats,
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const { data: recentDownloads } = useQuery(
    ['downloads', { limit: 5 }],
    () => downloadsAPI.getAll({ limit: 5 }),
    {
      refetchInterval: 10000, // Refresh every 10 seconds
    }
  );

  const { data: categories } = useQuery('categories', categoriesAPI.getAll);

  // Socket event handlers
  useSocket('download-added', (download) => {
    queryClient.invalidateQueries(['downloads']);
    queryClient.invalidateQueries('download-stats');
  });

  useSocket('download-update', (update) => {
    queryClient.setQueryData(['downloads', { limit: 5 }], (old) => {
      if (!old) return old;
      return {
        ...old,
        downloads: old.downloads.map(d => 
          d._id === update.id ? { ...d, ...update } : d
        )
      };
    });
  });

  // Calculate stats
  const downloadStats = {
    total: stats?.total || 0,
    completed: stats?.byStatus?.completed || 0,
    downloading: stats?.byStatus?.downloading || 0,
    queued: stats?.byStatus?.queued || 0,
    error: stats?.byStatus?.error || 0,
    totalSize: stats?.totalSize || 0,
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.username}!
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Download
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Downloads"
          value={downloadStats.total}
          icon={Download}
          color="blue"
        />
        <StatsCard
          title="Completed"
          value={downloadStats.completed}
          icon={CheckCircle}
          color="green"
          trend={`${downloadStats.total > 0 ? Math.round((downloadStats.completed / downloadStats.total) * 100) : 0}% success rate`}
        />
        <StatsCard
          title="Active"
          value={downloadStats.downloading + downloadStats.queued}
          icon={Activity}
          color="yellow"
        />
        <StatsCard
          title="Total Size"
          value={formatSize(downloadStats.totalSize)}
          icon={HardDrive}
          color="purple"
        />
      </div>

      {/* Quick Stats */}
      {user?.downloadQuota && (
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Quota</h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Downloads used today</span>
              <span className="text-sm font-medium">
                {user.downloadQuota.used} / {user.downloadQuota.daily}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min((user.downloadQuota.used / user.downloadQuota.daily) * 100, 100)}%` 
                }}
              />
            </div>
            {user.downloadQuota.resetAt && (
              <p className="text-xs text-gray-500 mt-2">
                Resets in {formatDistanceToNow(new Date(user.downloadQuota.resetAt))}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recent Downloads */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Recent Downloads</h2>
            <button
              onClick={() => navigate('/downloads')}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all
            </button>
          </div>
        </div>
        <div className="card-body">
          {recentDownloads?.downloads && recentDownloads.downloads.length > 0 ? (
            <DownloadsList downloads={recentDownloads.downloads} />
          ) : (
            <div className="text-center py-8">
              <Download className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No downloads yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add your first download to get started
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 btn btn-primary btn-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Download
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Download Modal */}
      <AddDownloadModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        categories={categories}
      />
    </div>
  );
}