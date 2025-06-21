import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

// Event handlers storage
const eventHandlers = new Map();

// Socket service
export const socketService = {
  connect: () => {
    const token = useAuthStore.getState().token;
    const user = useAuthStore.getState().user;
    
    if (!token || !user || socket?.connected) {
      return socket;
    }
    
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    
    // Connection events
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      reconnectAttempts = 0;
      
      // Join user room
      socket.emit('join-user-room', user.id);
      
      // Restore event handlers
      eventHandlers.forEach((handler, event) => {
        socket.on(event, handler);
      });
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, attempt to reconnect
        socket.connect();
      }
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      reconnectAttempts++;
      
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        toast.error('Unable to connect to server. Please refresh the page.');
      }
    });
    
    // Download events
    socket.on('download-added', (download) => {
      console.log('Download added:', download);
    });
    
    socket.on('download-update', (update) => {
      console.log('Download update:', update);
    });
    
    socket.on('download-completed', (download) => {
      toast.success(`Download completed: ${download.name}`);
    });
    
    socket.on('download-error', ({ id, error }) => {
      toast.error(`Download error: ${error.message}`);
    });
    
    // System notifications
    socket.on('notification', (notification) => {
      switch (notification.type) {
        case 'info':
          toast(notification.message);
          break;
        case 'success':
          toast.success(notification.message);
          break;
        case 'error':
          toast.error(notification.message);
          break;
        case 'warning':
          toast(notification.message, { icon: '⚠️' });
          break;
        default:
          toast(notification.message);
      }
    });
    
    return socket;
  },
  
  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      eventHandlers.clear();
    }
  },
  
  emit: (event, data) => {
    if (!socket?.connected) {
      console.warn('Socket not connected. Cannot emit event:', event);
      return;
    }
    
    socket.emit(event, data);
  },
  
  on: (event, handler) => {
    if (!socket) {
      console.warn('Socket not initialized. Storing handler for:', event);
      eventHandlers.set(event, handler);
      return;
    }
    
    eventHandlers.set(event, handler);
    socket.on(event, handler);
  },
  
  off: (event, handler) => {
    if (socket) {
      socket.off(event, handler);
    }
    
    if (handler) {
      eventHandlers.delete(event);
    } else {
      // Remove all handlers for this event
      for (const [key, value] of eventHandlers) {
        if (key === event) {
          eventHandlers.delete(key);
        }
      }
    }
  },
  
  once: (event, handler) => {
    if (!socket) {
      console.warn('Socket not initialized');
      return;
    }
    
    socket.once(event, handler);
  },
  
  isConnected: () => {
    return socket?.connected || false;
  },
  
  getSocket: () => {
    return socket;
  },
};

// React hook for using socket in components
import { useEffect, useCallback } from 'react';

export const useSocket = (event, handler) => {
  const memoizedHandler = useCallback(handler, []);
  
  useEffect(() => {
    socketService.on(event, memoizedHandler);
    
    return () => {
      socketService.off(event, memoizedHandler);
    };
  }, [event, memoizedHandler]);
};

// Auto-connect when auth changes
let authUnsubscribe = null;

export const initializeSocket = () => {
  // Subscribe to auth changes
  authUnsubscribe = useAuthStore.subscribe(
    (state) => state.isAuthenticated,
    (isAuthenticated) => {
      if (isAuthenticated) {
        socketService.connect();
      } else {
        socketService.disconnect();
      }
    }
  );
  
  // Initial connection if already authenticated
  if (useAuthStore.getState().isAuthenticated) {
    socketService.connect();
  }
};

export const cleanupSocket = () => {
  if (authUnsubscribe) {
    authUnsubscribe();
  }
  socketService.disconnect();
};

export default socketService;