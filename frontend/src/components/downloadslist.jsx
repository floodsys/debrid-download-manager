import React, { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  Download, 
  Trash2, 
  MoreVertical, 
  Pause, 
  Play, 
  RotateCw,
  FileText,
  ExternalLink,
  Clock,
  HardDrive,
  Users,
  AlertCircle
} from 'lucide-react';
import { Menu } from '@headlessui/react';
import { downloadsAPI } from '../services/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function DownloadsList({ downloads = [], showUser = false }) {
  const queryClient = useQueryClient();
  const [selectedDownloads, setSelectedDownloads] = useState(new Set());

  // Mutations
  const deleteMutation = useMutation(downloadsAPI.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('downloads');
      toast.success('Download deleted');
    },
  });

  const pauseMutation = useMutation(downloadsAPI.pause, {
    onSuccess: () => {
      queryClient.invalidateQueries('downloads');
      toast.success('Download paused');
    },
  });

  const resumeMutation = useMutation(downloadsAPI.resume, {
    onSuccess: () => {
      queryClient.invalidateQueries('downloads');
      toast.success('Download resumed');
    },
  });

  const retryMutation = useMutation(downloadsAPI.retry, {
    onSuccess: () => {
      queryClient.invalidateQueries('downloads');
      toast.success('Download restarted');
    },
  });

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this download?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatSpeed = (bytesPerSecond) => {
    if (!bytesPerSecond || bytesPerSecond === 0) return '';
    return `${formatSize(bytesPerSecond)}/s`;
  };

  const formatETA = (seconds) => {
    if (!seconds || seconds === 0) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'downloading':
        return <Clock className="w-4 h-4" />;
      case 'completed':
        return <Download className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (downloads.length === 0) {
    return (
      <div className="text-center py-12">
        <Download className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No downloads</h3>
        <p className="mt-1 text-sm text-gray-500">
          Add a magnet link to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {downloads.map((download) => (
        <div
          key={download._id}
          className={clsx(
            'bg-white rounded-lg shadow-sm border transition-all duration-200',
            selectedDownloads.has(download._id) ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:shadow-md'
          )}
        >
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {download.name}
                  </h3>
                </div>
                
                {/* Metadata */}
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  {download.category && (
                    <span className="inline-flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: download.category.color }} />
                      {download.category.name}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <HardDrive className="w-4 h-4" />
                    {formatSize(download.size)}
                  </span>
                  {showUser && download.user && (
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {download.user.username}
                    </span>
                  )}
                  <span>
                    Added {formatDistanceToNow(new Date(download.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
              
              {/* Actions */}
              <Menu as="div" className="relative ml-4">
                <Menu.Button className="p-2 rounded-lg hover:bg-gray-100">
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </Menu.Button>
                
                <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  {download.status === 'downloading' && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => pauseMutation.mutate(download._id)}
                          className={clsx(
                            'flex items-center gap-3 w-full px-4 py-2 text-sm',
                            active ? 'bg-gray-100' : ''
                          )}
                        >
                          <Pause className="w-4 h-4" />
                          Pause
                        </button>
                      )}
                    </Menu.Item>
                  )}
                  
                  {download.status === 'paused' && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => resumeMutation.mutate(download._id)}
                          className={clsx(
                            'flex items-center gap-3 w-full px-4 py-2 text-sm',
                            active ? 'bg-gray-100' : ''
                          )}
                        >
                          <Play className="w-4 h-4" />
                          Resume
                        </button>
                      )}
                    </Menu.Item>
                  )}
                  
                  {['error', 'cancelled'].includes(download.status) && (
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => retryMutation.mutate(download._id)}
                          className={clsx(
                            'flex items-center gap-3 w-full px-4 py-2 text-sm',
                            active ? 'bg-gray-100' : ''
                          )}
                        >
                          <RotateCw className="w-4 h-4" />
                          Retry
                        </button>
                      )}
                    </Menu.Item>
                  )}
                  
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => handleDelete(download._id)}
                        className={clsx(
                          'flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600',
                          active ? 'bg-red-50' : ''
                        )}
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Menu>
            </div>
            
            {/* Progress bar for downloading */}
            {download.status === 'downloading' && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">
                    {download.progress}% complete
                  </span>
                  <div className="flex items-center gap-4 text-gray-500">
                    {download.downloadSpeed > 0 && (
                      <span>{formatSpeed(download.downloadSpeed)}</span>
                    )}
                    {download.eta > 0 && (
                      <span>ETA: {formatETA(download.eta)}</span>
                    )}
                    {download.seeders > 0 && (
                      <span>{download.seeders} seeders</span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${download.progress}%` }}
                  />
                </div>
              </div>
            )}
            
            {/* Status and actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`badge badge-${download.status}`}>
                  {getStatusIcon(download.status)}
                  <span className="ml-1.5 capitalize">{download.status}</span>
                </span>
                
                {download.error && (
                  <span className="text-sm text-red-600">
                    Error: {download.error.message}
                  </span>
                )}
              </div>
              
              {/* Download links */}
              {download.status === 'completed' && download.realDebridData?.unrestrictedLinks && (
                <div className="flex items-center gap-2">
                  {download.realDebridData.unrestrictedLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.download}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                      title={link.filename}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download {download.realDebridData.unrestrictedLinks.length > 1 ? `(${index + 1})` : ''}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}