                  max: { value: 1000, message: 'Maximum 1000 downloads' }
                })}
                type="number"
                className="form-input"
              />
              {errors.downloadQuota?.daily && <p className="form-error">{errors.downloadQuota.daily.message}</p>}
            </div>
          </>
        )}
        
        <div>
          <label className="flex items-center gap-3">
            <input
              {...register('isActive')}
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Account Active</span>
          </label>
        </div>
        
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={updateMutation.isLoading} className="btn btn-primary">
            {updateMutation.isLoading ? 'Updating...' : 'Update User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}          <label htmlFor="realDebridApiKey" className="form-label">Real-Debrid API Key</label>
          <input
            {...register('realDebridApiKey', {
              required: 'API key is required'
            })}
            type="text"
            className="form-input font-mono text-sm"
            placeholder="Enter user's Real-Debrid API key"
          />
          {errors.realDebridApiKey && <p className="form-error">{errors.realDebridApiKey.message}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="role" className="form-label">Role</label>
            <select {...register('role')} className="form-input">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="downloadQuota.daily" className="form-label">Daily Download Quota</label>
            <input
              {...register('downloadQuota.daily', {
                valueAsNumber: true,
                min: { value: 1, message: 'Minimum 1 download' },
                max: { value: 1000, message: 'Maximum 1000 downloads' }
              })}
              type="number"
              className="form-input"
              defaultValue={50}
            />
            {errors.downloadQuota?.daily && <p className="form-error">{errors.downloadQuota.daily.message}</p>}
          </div>
        </div>
        
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={createMutation.isLoading} className="btn btn-primary">
            {createMutation.isLoading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Edit User Modal
function EditUserModal({ user, isOpen, onClose }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: user.email,
      isActive: user.isActive,
      downloadQuota: { daily: user.downloadQuota?.daily || 50 }
    }
  });
  
  const updateMutation = useMutation(
    (data) => adminAPI.updateUser(user._id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-users');
        toast.success('User updated successfully');
        onClose();
      }
    }
  );
  
  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit User: ${user.username}`} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label htmlFor="email" className="form-label">Email</label>
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+$/, message: 'Invalid email address' }
            })}
            type="email"
            className="form-input"
          />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>
        
        {user.role !== 'admin' && (
          <>
            <div>
              <label htmlFor="realDebridApiKey" className="form-label">
                Real-Debrid API Key (leave empty to keep current)
              </label>
              <input
                {...register('realDebridApiKey')}
                type="text"
                className="form-input font-mono text-sm"
                placeholder="Enter new API key or leave empty"
              />
            </div>
            
            <div>
              <label htmlFor="downloadQuota.daily" className="form-label">Daily Download Quota</label>
              <input
                {...register('downloadQuota.daily', {
                  valueAsNumber: true,
                  min: { value: 1, message: 'Minimum 1 download' },
                  max: {      </td>
    </tr>
  );
}

// Create User Modal
function CreateUserModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  
  const createMutation = useMutation(adminAPI.createUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('admin-users');
      toast.success('User created successfully');
      reset();
      onClose();
    }
  });
  
  const onSubmit = (data) => {
    createMutation.mutate(data);
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New User" size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="username" className="form-label">Username</label>
            <input
              {...register('username', {
                required: 'Username is required',
                minLength: { value: 3, message: 'Minimum 3 characters' },
                pattern: { value: /^[a-zA-Z0-9_-]+$/, message: 'Only letters, numbers, underscores, and hyphens' }
              })}
              type="text"
              className="form-input"
            />
            {errors.username && <p className="form-error">{errors.username.message}</p>}
          </div>
          
          <div>
            <label htmlFor="email" className="form-label">Email</label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/, message: 'Invalid email address' }
              })}
              type="email"
              className="form-input"
            />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>
        </div>
        
        <div>
          <label htmlFor="password" className="form-label">Password</label>
          <input
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Minimum 6 characters' }
            })}
            type="password"
            className="form-input"
          />
          {errors.password && <p className="form-error">{errors.password.message}</p>}
        </div>
        
        <div>
          <label htmlFor="realDebridApiKey" className="form-label">            <MoreVertical className="w-5 h-5 text-gray-500" />
          </Menu.Button>
          
          <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={onEdit}
                  className={clsx(
                    'flex items-center gap-3 w-full px-4 py-2 text-sm',
                    active ? 'bg-gray-100' : ''
                  )}
                >
                  <Edit className="w-4 h-4" />
                  Edit User
                </button>
              )}
            </Menu.Item>
            
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleDelete}
                  className={clsx(
                    'flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600',
                    active ? 'bg-red-50' : ''
                  )}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete User
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Menu>
      </td>
    </trimport React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  Users as UsersIcon,
  Plus,
  Search,
  Mail,
  Shield,
  Calendar,
  Download,
  HardDrive,
  MoreVertical,
  Edit,
  Trash2,
  Key,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { adminAPI } from '../../services/api';
import Modal from '../../components/Modal';
import { formatSize } from '../../utils/helpers';
import { format } from 'date-fns';
import { Menu } from '@headlessui/react';
import clsx from 'clsx';

export default function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Get params
  const currentPage = parseInt(searchParams.get('page') || '1');
  const roleFilter = searchParams.get('role') || '';
  const activeFilter = searchParams.get('active') || '';
  
  // Fetch users
  const { data, isLoading } = useQuery(
    ['admin-users', { page: currentPage, search, role: roleFilter, isActive: activeFilter }],
    () => adminAPI.getUsers({
      page: currentPage,
      search,
      role: roleFilter,
      isActive: activeFilter,
      limit: 20
    }),
    {
      keepPreviousData: true
    }
  );
  
  // Update URL params
  const updateParams = (newParams) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    updateParams({ search, page: '1' });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create User
        </button>
      </div>
      
      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <form onSubmit={handleSearch} className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="form-input pl-10"
                />
              </div>
            </form>
            
            <select
              value={roleFilter}
              onChange={(e) => updateParams({ role: e.target.value, page: '1' })}
              className="form-input"
            >
              <option value="">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>
            
            <select
              value={activeFilter}
              onChange={(e) => updateParams({ active: e.target.value, page: '1' })}
              className="form-input"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Downloads
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-2 text-gray-500">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : data?.users?.length > 0 ? (
                data.users.map((user) => (
                  <UserRow 
                    key={user._id} 
                    user={user} 
                    onEdit={() => setEditingUser(user)}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {data && data.pagination.pages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <button
              onClick={() => updateParams({ page: (currentPage - 1).toString() })}
              disabled={currentPage === 1}
              className="btn btn-secondary"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </button>
            
            <span className="text-sm text-gray-700">
              Page {currentPage} of {data.pagination.pages}
            </span>
            
            <button
              onClick={() => updateParams({ page: (currentPage + 1).toString() })}
              disabled={currentPage === data.pagination.pages}
              className="btn btn-secondary"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}
      </div>
      
      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      
      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </div>
  );
}

// User Row Component
function UserRow({ user, onEdit }) {
  const queryClient = useQueryClient();
  
  const deleteMutation = useMutation(
    () => adminAPI.deleteUser(user._id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-users');
        toast.success('User deleted successfully');
      }
    }
  );
  
  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${user.username}? This will also delete all their downloads.`)) {
      deleteMutation.mutate();
    }
  };
  
  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-600 font-medium">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{user.username}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={clsx(
          'badge',
          user.role === 'admin' ? 'badge-completed' : 'badge-queued'
        )}>
          <Shield className="w-3 h-3 mr-1" />
          {user.role}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {user.isActive ? (
          <span className="flex items-center text-green-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            Active
          </span>
        ) : (
          <span className="flex items-center text-red-600">
            <XCircle className="w-4 h-4 mr-1" />
            Inactive
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-gray-400" />
            <span>{user.stats?.totalDownloads || 0} total</span>
          </div>
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-gray-400" />
            <span>{formatSize(user.stats?.totalSize || 0)}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {format(new Date(user.createdAt), 'MMM d, yyyy')}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <Menu as="div" className="relative inline-block text-left">
          <Menu.Button className="p-2 rounded-lg hover:bg-gray-100">
            <MoreVertical className="w-5 h-5 text-grayimport React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  Users as UsersIcon,
  Plus,
  Search,
  Mail,
  Shield,
  Calendar,
  Download,
  HardDrive,
  MoreVertical,
  Edit,
  Trash2,
  Key,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { adminAPI } from '../services/api';
import Modal from '../../components/Modal';
import { formatSize } from '../../utils/helpers';
import { format } from 'date-fns';
import { Menu } from '@hea