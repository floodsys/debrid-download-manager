import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AdminRoute() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === 'admin';
  
  if (!isAdmin) {
    // Redirect non-admin users to dashboard
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Outlet />;
}