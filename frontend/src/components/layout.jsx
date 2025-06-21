import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../services/socket';
import {
  LayoutDashboard,
  Download,
  FolderOpen,
  Users,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  Settings,
  Bell,
  Wifi,
  WifiOff
} from 'lucide-react';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuthStore();

  useEffect(() => {
    // Initialize socket connection
    socketService.connect();
    
    // Monitor connection status
    const checkConnection = () => {
      setIsConnected(socketService.isConnected());
    };
    
    const interval = setInterval(checkConnection, 5000);
    checkConnection();
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    socketService.disconnect();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/downloads', name: 'Downloads', icon: Download },
    { path: '/categories', name: 'Categories', icon: FolderOpen },
    { path: '/profile', name: 'Profile', icon: User },
  ];

  const adminItems = [
    { path: '/admin/users', name: 'Users', icon: Users },
    { path: '/admin/stats', name: 'Statistics', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b">
            <h2 className="text-xl font-bold text-primary-600">RD Manager</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg lg:hidden hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `nav-link ${isActive ? 'active' : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}

            {isAdmin() && (
              <>
                <div className="pt-4 mt-4 border-t">
                  <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Admin
                  </p>
                </div>
                {adminItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'active' : ''}`
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </NavLink>
                ))}
              </>
            )}
          </nav>

          {/* User section */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.username}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" title="Connected" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" title="Disconnected" />
                )}
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full nav-link text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg lg:hidden hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4 ml-auto">
              {/* Notifications */}
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              {/* Settings */}
              <button
                onClick={() => navigate('/profile')}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}