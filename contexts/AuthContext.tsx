import { apiClient } from '@/lib/apiClient';
import { tokenStorage } from '@/lib/tokenStorage';
import {
  AuthResponse,
  AuthState,
  HouseholdMember,
  LoginRequest,
  RegisterRequest,
  User,
  UserWithHouseholds
} from '@/types';
import React, { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';

// Auth actions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string; households: HouseholdMember[] } }
  | { type: 'LOGOUT' }
  | { type: 'SET_HOUSEHOLDS'; payload: HouseholdMember[] }
  | { type: 'SET_ACTIVE_HOUSEHOLD'; payload: HouseholdMember | null }
  | { type: 'UPDATE_USER'; payload: User };

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  households: [],
  activeHousehold: null,
  isLoading: true,
};

// Auth reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        households: action.payload.households,
        activeHousehold: action.payload.households[0] || null,
        isLoading: false,
      };

    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };

    case 'SET_HOUSEHOLDS':
      return {
        ...state,
        households: action.payload,
        activeHousehold: state.activeHousehold || action.payload[0] || null,
      };

    case 'SET_ACTIVE_HOUSEHOLD':
      return { ...state, activeHousehold: action.payload };

    case 'UPDATE_USER':
      return { ...state, user: action.payload };

    default:
      return state;
  }
}

// Context type
interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  setActiveHousehold: (household: HouseholdMember) => void;
  refreshUserData: () => Promise<void>;
  isParent: boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = await tokenStorage.getToken();
      if (token) {
        // Verify token and get user data
        const userData: UserWithHouseholds = await apiClient.get('/me');
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: userData.user,
            token,
            households: userData.households.data,
          },
        });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      // Clear invalid token
      await tokenStorage.removeToken();
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const authResponse: AuthResponse = await apiClient.post('/auth/login', credentials);
      await tokenStorage.setToken(authResponse.token);

      // Get full user data with households
      const userData: UserWithHouseholds = await apiClient.get('/me');

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: userData.user,
          token: authResponse.token,
          households: userData.households.data,
        },
      });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const authResponse: AuthResponse = await apiClient.post('/auth/register', userData);
      await tokenStorage.setToken(authResponse.token);

      // Get full user data with households (will be empty for new users)
      const userWithHouseholds: UserWithHouseholds = await apiClient.get('/me');

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: userWithHouseholds.user,
          token: authResponse.token,
          households: userWithHouseholds.households.data,
        },
      });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      await tokenStorage.removeToken();
      dispatch({ type: 'LOGOUT' });
    }
  };

  const setActiveHousehold = (household: HouseholdMember) => {
    dispatch({ type: 'SET_ACTIVE_HOUSEHOLD', payload: household });
  };

  const refreshUserData = async () => {
    try {
      const userData: UserWithHouseholds = await apiClient.get('/me');
      dispatch({ type: 'UPDATE_USER', payload: userData.user });
      dispatch({ type: 'SET_HOUSEHOLDS', payload: userData.households.data });
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      throw error;
    }
  };

  // Computed property for checking if user is a parent in active household
  const isParent = state.activeHousehold?.role === 'parent';

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    setActiveHousehold,
    refreshUserData,
    isParent,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
