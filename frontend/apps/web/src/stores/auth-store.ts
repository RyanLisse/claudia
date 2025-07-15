import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AuthState, AuthActions, LoginCredentials, User, UserPreferences } from './types';

interface AuthStore extends AuthState, AuthActions {
  reset: () => void;
}

const initialState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  permissions: [],
};

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Authentication actions
        login: async (credentials: LoginCredentials) => {
          set((state) => ({
            ...state,
            isLoading: true,
          }));

          try {
            // TODO: Replace with actual API call
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(credentials),
            });

            if (!response.ok) {
              throw new Error('Login failed');
            }

            const { user, session, permissions } = await response.json();

            set((state) => ({
              ...state,
              user,
              session,
              isAuthenticated: true,
              permissions,
              isLoading: false,
            }));
          } catch (error) {
            set((state) => ({
              ...state,
              isLoading: false,
            }));
            throw error;
          }
        },

        logout: async () => {
          try {
            // TODO: Replace with actual API call
            await fetch('/api/auth/logout', { method: 'POST' });
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            set((state) => ({
              ...state,
              user: null,
              session: null,
              isAuthenticated: false,
              permissions: [],
              isLoading: false,
            }));
          }
        },

        refreshSession: async () => {
          const { session } = get();
          if (!session) return;

          try {
            // TODO: Replace with actual API call
            const response = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: session.refreshToken }),
            });

            if (!response.ok) {
              throw new Error('Session refresh failed');
            }

            const { session: newSession, user, permissions } = await response.json();

            set((state) => ({
              ...state,
              session: newSession,
              user,
              permissions,
            }));
          } catch (error) {
            console.error('Session refresh error:', error);
            get().logout();
          }
        },

        updateUser: async (updates: Partial<User>) => {
          const { user } = get();
          if (!user) return;

          try {
            // TODO: Replace with actual API call
            const response = await fetch(`/api/users/${user.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            });

            if (!response.ok) {
              throw new Error('User update failed');
            }

            const updatedUser = await response.json();

            set((state) => ({
              ...state,
              user: updatedUser,
            }));
          } catch (error) {
            console.error('User update error:', error);
            throw error;
          }
        },

        updatePreferences: async (preferences: Partial<UserPreferences>) => {
          const { user } = get();
          if (!user) return;

          try {
            // Optimistic update
            set((state) => ({
              ...state,
              user: state.user ? {
                ...state.user,
                preferences: { ...state.user.preferences, ...preferences }
              } : null,
            }));

            // TODO: Replace with actual API call
            const response = await fetch(`/api/users/${user.id}/preferences`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(preferences),
            });

            if (!response.ok) {
              // Revert optimistic update on error
              set((state) => ({
                ...state,
                user: state.user ? {
                  ...state.user,
                  preferences: user.preferences,
                } : null,
              }));
              throw new Error('Preferences update failed');
            }
          } catch (error) {
            console.error('Preferences update error:', error);
            throw error;
          }
        },

        // Reset to initial state
        reset: () => {
          set(initialState);
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          session: state.session,
          isAuthenticated: state.isAuthenticated,
          permissions: state.permissions,
        }),
      }
    ),
    { name: 'Auth Store' }
  )
);