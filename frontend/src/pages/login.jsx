import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { initializeSocket } from '../services/socket';
import toast from 'react-hot-toast';
import { LockKeyhole, User, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm({
    defaultValues: {
      username: '',
      password: ''
    }
  });

  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (data) => {
    try {
      const response = await authAPI.login(data);
      const { token, user } = response.data;
      
      // Store auth data
      login(user, token);
      
      // Initialize socket connection
      initializeSocket();
      
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled by axios interceptor
      // But we can add specific handling here if needed
      if (error.response?.status === 423) {
        toast.error('Account is locked. Please try again later.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
      
      {/* Login card */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <LockKeyhole className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Real-Debrid Manager</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Username field */}
          <div>
            <label htmlFor="username" className="form-label">
              Username or Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('username', { 
                  required: 'Username is required',
                  minLength: {
                    value: 3,
                    message: 'Username must be at least 3 characters'
                  }
                })}
                type="text"
                className="form-input pl-10"
                placeholder="Enter your username or email"
                autoComplete="username"
                autoFocus
              />
            </div>
            {errors.username && (
              <p className="form-error">{errors.username.message}</p>
            )}
          </div>

          {/* Password field */}
          <div>
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockKeyhole className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                type={showPassword ? 'text' : 'password'}
                className="form-input pl-10 pr-10"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="form-error">{errors.password.message}</p>
            )}
          </div>

          {/* Remember me */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}