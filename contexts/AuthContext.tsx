import { apiClient } from '@/lib/apiClient';
import { tokenStorage } from '@/lib/tokenStorage';
import {
  AuthResponse,
  AuthState,
  HouseholdMember,
  LoginRequest,
  RegisterRequest,
  User
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
        households: action.payload.households || [],
        activeHousehold: (action.payload.households && action.payload.households[0]) || null,
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
        households: action.payload || [],
        activeHousehold: state.activeHousehold || (action.payload && action.payload[0]) || null,
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
        console.log('Found existing token, verifying...');
        // Verify token and get user data
        try {
          const userData: any = await apiClient.get('/me');
          console.log('Auth initialization - user data received:', JSON.stringify(userData, null, 2));
          
          const adaptedData = {
            user: userData?.user || userData,
            households: userData?.households || []
          };
          
          if (adaptedData.user) {
            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user: adaptedData.user,
                token,
                households: Array.isArray(adaptedData.households) ? adaptedData.households : [],
              },
            });
          } else {
            throw new Error('Invalid user data received from /me endpoint');
          }
          console.log('Auth initialization successful');
        } catch (meError) {
          console.error('Auth initialization - /me failed:', meError);
          // Clear invalid token
          await tokenStorage.removeToken();
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        console.log('No existing token found');
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
      console.log('Starting login with credentials:', { email: credentials.email });
      dispatch({ type: 'SET_LOADING', payload: true });

      console.log('Calling login API...');
      const authResponse: AuthResponse = await apiClient.post('/auth/login', credentials);
      console.log('Login API response received:', authResponse);
      
      await tokenStorage.setToken(authResponse.token);
      console.log('Token stored successfully');

      // Get full user data with households
      console.log('Fetching user data...');
      try {
        const userData: any = await apiClient.get('/me'); // Use any temporarily to see the actual structure
        console.log('User data received (raw):', JSON.stringify(userData, null, 2));
        
        // Try to adapt the data to our expected format
        const adaptedData = {
          user: userData?.user || userData,
          households: userData?.households || []
        };
        console.log('Adapted user data:', adaptedData);

        if (adaptedData.user) {
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: adaptedData.user,
              token: authResponse.token,
              households: Array.isArray(adaptedData.households) ? adaptedData.households : [],
            },
          });
        } else {
          throw new Error('Invalid user data received from /me endpoint');
        }
        console.log('Login successful!');
      } catch (meError) {
        console.error('Error fetching /me data:', meError);
        // If /me fails, we can still log the user in with just the login data
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: authResponse.user,
            token: authResponse.token,
            households: [],
          },
        });
        console.log('Login successful (without /me data)');
      }
    } catch (error) {
      console.error('Login failed in AuthContext:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      console.log('Starting registration...');
      dispatch({ type: 'SET_LOADING', payload: true });

      console.log('Calling register API...');
      const authResponse: AuthResponse = await apiClient.post('/auth/register', userData);
      console.log('Register API response received:', authResponse);
      
      await tokenStorage.setToken(authResponse.token);
      console.log('Token stored successfully');

      // Get full user data with households (will be empty for new users)
      console.log('Fetching user data after registration...');
      try {
        const userWithHouseholds: any = await apiClient.get('/me');
        console.log('User data received (raw):', JSON.stringify(userWithHouseholds, null, 2));
        
        // Try to adapt the data to our expected format
        const adaptedData = {
          user: userWithHouseholds?.user || userWithHouseholds,
          households: userWithHouseholds?.households || []
        };
        console.log('Adapted user data:', adaptedData);

        if (adaptedData.user) {
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: adaptedData.user,
              token: authResponse.token,
              households: Array.isArray(adaptedData.households) ? adaptedData.households : [],
            },
          });
        } else {
          throw new Error('Invalid user data received from /me endpoint');
        }
        console.log('Registration successful!');
      } catch (meError) {
        console.error('Error fetching /me data during registration:', meError);
        // If /me fails, we can still log the user in with just the registration data
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user: authResponse.user,
            token: authResponse.token,
            households: [],
          },
        });
        console.log('Registration successful (without /me data)');
      }
    } catch (error) {
      console.error('Registration failed in AuthContext:', error);
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
      console.log('Refreshing user data...');
      const userData: any = await apiClient.get('/me');
      console.log('Refresh user data received:', JSON.stringify(userData, null, 2));
      
      const adaptedData = {
        user: userData?.user || userData,
        households: userData?.households || []
      };
      
      if (adaptedData.user) {
        dispatch({ type: 'UPDATE_USER', payload: adaptedData.user });
      }
      dispatch({ type: 'SET_HOUSEHOLDS', payload: Array.isArray(adaptedData.households) ? adaptedData.households : [] });
      console.log('User data refreshed successfully');
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
