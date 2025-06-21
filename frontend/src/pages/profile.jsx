import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { useForm } from 'react-hook-form';
import { 
  User, 
  Mail, 
  Key, 
  Shield, 
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Calendar,
  Download,
  AlertCircle
} from 'lucide-react';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // Fetch latest profile data
  const { data: profile, refetch } = useQuery('profile', authAPI.getProfile, {
    onSuccess: (data) => {
      updateUser(data.data);
    }
  });
  
  const profileData = profile?.data || user;
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
      
      {/* Account Information */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Account Information</h2>
        </div>
        <div className="card-body space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Username</label>
              <div className="mt-1 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{profileData?.username}</span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <div className="mt-1 flex items-center gap-2">
                <Mail className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">{profileData?.email}</span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Role</label>
              <div className="mt-1 flex items-center gap-2">
                <Shield className="w-5 h-5 text-gray-400" />
                <span className="capitalize badge badge-queued">
                  {profileData?.role}
                </span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Member Since</label>
              <div className="mt-1 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900">
                  {profileData?.createdAt && format(new Date(profileData.createdAt), 'MMMM d, yyyy')}
                </span>
              </div>
            </div>
          </div>
          
          {/* Download Quota */}
          {profileData?.downloadQuota && (
            <div className="pt-4 border-t">
              <h3 className="text-lg font-medium mb-3">Download Quota</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Daily Limit</span>
                  <span className="font-medium">
                    {profileData.downloadQuota.used} / {profileData.downloadQuota.daily}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min((profileData.downloadQuota.used / profileData.downloadQuota.daily) * 100, 100)}%` 
                    }}
                  />
                </div>
                {profileData.downloadQuota.resetAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Resets {format(new Date(profileData.downloadQuota.resetAt), 'MMM d, yyyy \'at\' h:mm a')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Real-Debrid API Key */}
      {profileData?.role !== 'admin' && (
        <ApiKeySection 
          apiKey={profileData?.realDebridApiKey}
          showApiKey={showApiKey}
          setShowApiKey={setShowApiKey}
          onUpdate={refetch}
        />
      )}
      
      {/* Update Email */}
      <UpdateEmailSection onUpdate={refetch} />
      
      {/* Change Password */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold">Security</h2>
        </div>
        <div className="card-body">
          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="btn btn-secondary"
            >
              <Key className="w-4 h-4 mr-2" />
              Change Password
            </button>
          ) : (
            <ChangePasswordForm 
              onCancel={() => setShowPasswordForm(false)}
              onSuccess={() => {
                setShowPasswordForm(false);
                toast.success('Password changed successfully');
              }}
            />
          )}
        </div>
      </div>
      
      {/* Settings */}
      <SettingsSection settings={profileData?.settings} onUpdate={refetch} />
    </div>
  );
}

// API Key Section Component
function ApiKeySection({ apiKey, showApiKey, setShowApiKey, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  
  const updateMutation = useMutation(
    (data) => authAPI.updateProfile(data),
    {
      onSuccess: () => {
        toast.success('API key updated successfully');
        setIsEditing(false);
        onUpdate();
      }
    }
  );
  
  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };
  
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold">Real-Debrid API Key</h2>
      </div>
      <div className="card-body">
        {!isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-500">API Key</label>
                <div className="mt-1 flex items-center gap-2">
                  <Key className="w-5 h-5 text-gray-400" />
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {showApiKey && apiKey ? apiKey : '••••••••••••••••••••••••'}
                  </code>
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Update API Key
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="realDebridApiKey" className="form-label">
                New API Key
              </label>
              <input
                {...register('realDebridApiKey', {
                  required: 'API key is required'
                })}
                type="text"
                className="form-input font-mono text-sm"
                placeholder="Enter your Real-Debrid API key"
              />
              {errors.realDebridApiKey && (
                <p className="form-error">{errors.realDebridApiKey.message}</p>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={updateMutation.isLoading}
                className="btn btn-primary"
              >
                {updateMutation.isLoading ? 'Updating...' : 'Update'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  reset();
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Update Email Section
function UpdateEmailSection({ onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  
  const updateMutation = useMutation(
    (data) => authAPI.updateProfile(data),
    {
      onSuccess: () => {
        toast.success('Email updated successfully');
        setIsEditing(false);
        reset();
        onUpdate();
      }
    }
  );
  
  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };
  
  if (!isEditing) {
    return null;
  }
  
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold">Update Email</h2>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="form-label">
              New Email Address
            </label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              type="email"
              className="form-input"
              placeholder="Enter new email address"
            />
            {errors.email && (
              <p className="form-error">{errors.email.message}</p>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={updateMutation.isLoading}
              className="btn btn-primary"
            >
              {updateMutation.isLoading ? 'Updating...' : 'Update Email'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                reset();
              }}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Change Password Form
function ChangePasswordForm({ onCancel, onSuccess }) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  
  const changePasswordMutation = useMutation(
    (data) => authAPI.changePassword(data),
    {
      onSuccess: () => {
        onSuccess();
      }
    }
  );
  
  const onSubmit = (data) => {
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword
    });
  };
  
  const newPassword = watch('newPassword');
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="currentPassword" className="form-label">
          Current Password
        </label>
        <div className="relative">
          <input
            {...register('currentPassword', {
              required: 'Current password is required'
            })}
            type={showCurrentPassword ? 'text' : 'password'}
            className="form-input pr-10"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showCurrentPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
        {errors.currentPassword && (
          <p className="form-error">{errors.currentPassword.message}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="newPassword" className="form-label">
          New Password
        </label>
        <div className="relative">
          <input
            {...register('newPassword', {
              required: 'New password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters'
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Password must contain uppercase, lowercase, and number'
              }
            })}
            type={showNewPassword ? 'text' : 'password'}
            className="form-input pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showNewPassword ? (
              <EyeOff className="h-5 w-5 text-gray-400" />
            ) : (
              <Eye className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
        {errors.newPassword && (
          <p className="form-error">{errors.newPassword.message}</p>
        )}
      </div>
      
      <div>
        <label htmlFor="confirmPassword" className="form-label">
          Confirm New Password
        </label>
        <input
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: value => value === newPassword || 'Passwords do not match'
          })}
          type="password"
          className="form-input"
        />
        {errors.confirmPassword && (
          <p className="form-error">{errors.confirmPassword.message}</p>
        )}
      </div>
      
      {changePasswordMutation.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-800">
              {changePasswordMutation.error.response?.data?.error || 'Failed to change password'}
            </p>
          </div>
        </div>
      )}
      
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={changePasswordMutation.isLoading}
          className="btn btn-primary"
        >
          {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Settings Section
function SettingsSection({ settings, onUpdate }) {
  const { register, handleSubmit, formState: { isDirty } } = useForm({
    defaultValues: {
      autoCategory: settings?.autoCategory ?? true,
      notifications: {
        email: settings?.notifications?.email ?? false,
        downloadComplete: settings?.notifications?.downloadComplete ?? true,
        downloadError: settings?.notifications?.downloadError ?? true
      }
    }
  });
  
  const updateMutation = useMutation(
    (data) => authAPI.updateProfile({ settings: data }),
    {
      onSuccess: () => {
        toast.success('Settings updated successfully');
        onUpdate();
      }
    }
  );
  
  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };
  
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold">Preferences</h2>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input
                {...register('autoCategory')}
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Auto-detect download categories
              </span>
            </label>
            
            <div className="pl-7 space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Notifications</h4>
              
              <label className="flex items-center gap-3">
                <input
                  {...register('notifications.email')}
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">
                  Email notifications
                </span>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  {...register('notifications.downloadComplete')}
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">
                  Notify when download completes
                </span>
              </label>
              
              <label className="flex items-center gap-3">
                <input
                  {...register('notifications.downloadError')}
                  type="checkbox"
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-600">
                  Notify on download errors
                </span>
              </label>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!isDirty || updateMutation.isLoading}
            className="btn btn-primary"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}