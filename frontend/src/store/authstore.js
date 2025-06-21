import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      // Actions
      login: (user, token) => {
        set({ 
          user, 
          token, 
          isAuthenticated: true,
          isLoading: false
        });
      },
      
      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          isLoading: false
        });
        
        // Clear any other persisted data if needed
        localStorage.removeItem('auth-storage');
      },
      
      updateUser: (user) => {
        set({ user });
      },
      
      updateToken: (token) => {
        set({ token });
      },
      
      setLoading: (isLoading) => {
        set({ isLoading });
      },
      
      // Computed values
      isAdmin: () => {
        const state = get();
        return state.user?.role === 'admin';
      },
      
      canDownload: () => {
        const state = get();
        if (!state.user) return false;
        
        const quota = state.user.downloadQuota;
        if (!quota) return true; // No quota means unlimited
        
        return quota.used < quota.daily;
      },
      
      getRemainingDownloads: () => {
        const state = get();
        if (!state.user?.downloadQuota) return null;
        
        const quota = state.user.downloadQuota;
        return Math.max(0, quota.daily - quota.used);
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);

export { useAuthStore };