import { apiClient } from '@/lib/apiClient';
import { tokenStorage } from '@/lib/tokenStorage';
import { householdService } from '@/services/householdService';
import { router } from 'expo-router';
import {
  AuthResponse,
  AuthState,
  HouseholdMembership,
  LoginRequest,
  RegisterRequest,
  User
} from '@/types';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useReducer } from 'react';

// Storage keys
const ACTIVE_HOUSEHOLD_KEY = 'activeHouseholdId';

// Helper functions for active household persistence
const saveActiveHouseholdId = async (householdId: string | null) => {
  try {
    if (householdId) {
      await SecureStore.setItemAsync(ACTIVE_HOUSEHOLD_KEY, householdId);
    } else {
      await SecureStore.deleteItemAsync(ACTIVE_HOUSEHOLD_KEY);
    }
  } catch (error) {
    console.error('Error saving active household ID:', error);
  }
};

const getActiveHouseholdId = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(ACTIVE_HOUSEHOLD_KEY);
  } catch (error) {
    console.error('Error getting active household ID:', error);
    return null;
  }
};

// Helper function to get household name (simplified for actual API response)
const getHouseholdName = (householdMembership: HouseholdMembership): string => {
  return householdMembership.name || 'Unknown';
};

// Helper function to get household ID (simplified for actual API response)  
const getHouseholdId = (householdMembership: HouseholdMembership): string | null => {
  return householdMembership.id || null;
};

// Smart household selection: use stored preference or auto-select first
const selectActiveHousehold = async (households: HouseholdMembership[]): Promise<HouseholdMembership | null> => {
  if (!households || households.length === 0) {
    await saveActiveHouseholdId(null);
    return null;
  }

  // If only one household, auto-select it
  if (households.length === 1) {
    const household = households[0];
    const id = getHouseholdId(household);
    await saveActiveHouseholdId(id);
    return household;
  }

  // Multiple households: try to use stored preference
  const storedHouseholdId = await getActiveHouseholdId();

  if (storedHouseholdId) {
    const foundHousehold = households.find(h => getHouseholdId(h) === storedHouseholdId);
    if (foundHousehold) {
      return foundHousehold;
    }
  }

  // Fallback: select first household and save it
  const firstHousehold = households[0];
  const id = getHouseholdId(firstHousehold);
  await saveActiveHouseholdId(id);
  return firstHousehold;
};

// Auth actions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string; households: HouseholdMembership[] } }
  | { type: 'LOGOUT' }
  | { type: 'SET_HOUSEHOLDS'; payload: HouseholdMembership[] }
  | { type: 'SET_ACTIVE_HOUSEHOLD'; payload: HouseholdMembership | null }
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
        // Note: activeHousehold is managed separately via SET_ACTIVE_HOUSEHOLD action
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
  setActiveHousehold: (household: HouseholdMembership) => Promise<void>;
  refreshUserData: () => Promise<void>;
  leaveHousehold: (householdId: string) => Promise<void>;
  deleteHousehold: (householdId: string) => Promise<void>;

  getActiveHouseholdName: () => string;
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
        try {
          const userData: any = await apiClient.get('/me');

          const adaptedData = {
            user: userData?.user || userData,
            households: userData?.households || []
          };

          if (adaptedData.user) {
            const householdsArray = Array.isArray(adaptedData.households) ? adaptedData.households : [];
            const activeHousehold = await selectActiveHousehold(householdsArray);

            dispatch({
              type: 'LOGIN_SUCCESS',
              payload: {
                user: adaptedData.user,
                token,
                households: householdsArray,
              },
            });

            // Set the smart-selected active household
            dispatch({ type: 'SET_ACTIVE_HOUSEHOLD', payload: activeHousehold });
          } else {
            throw new Error('Invalid user data received from /me endpoint');
          }
        } catch (meError) {
          console.error('Auth initialization - /me failed:', meError);
          // Clear invalid token
          await tokenStorage.removeToken();
          dispatch({ type: 'SET_LOADING', payload: false });
        }
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
      try {
        const userData: any = await apiClient.get('/me');

        // Try to adapt the data to our expected format
        const adaptedData = {
          user: userData?.user || userData,
          households: userData?.households || []
        };

        if (adaptedData.user) {
          const householdsArray = Array.isArray(adaptedData.households) ? adaptedData.households : [];
          const activeHousehold = await selectActiveHousehold(householdsArray);

          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: adaptedData.user,
              token: authResponse.token,
              households: householdsArray,
            },
          });

          // Set the smart-selected active household
          dispatch({ type: 'SET_ACTIVE_HOUSEHOLD', payload: activeHousehold });
        } else {
          throw new Error('Invalid user data received from /me endpoint');
        }
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
      }

      // Ensure loading is set to false after successful login
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Login failed in AuthContext:', error);
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
      try {
        const userWithHouseholds: any = await apiClient.get('/me');

        // Try to adapt the data to our expected format
        const adaptedData = {
          user: userWithHouseholds?.user || userWithHouseholds,
          households: userWithHouseholds?.households || []
        };

        if (adaptedData.user) {
          const householdsArray = Array.isArray(adaptedData.households) ? adaptedData.households : [];
          const activeHousehold = await selectActiveHousehold(householdsArray);
          
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: adaptedData.user,
              token: authResponse.token,
              households: householdsArray,
            },
          });
          
          // Set the smart-selected active household
          dispatch({ type: 'SET_ACTIVE_HOUSEHOLD', payload: activeHousehold });
        } else {
          throw new Error('Invalid user data received from /me endpoint');
        }
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
      }
      
      // Ensure loading is set to false after successful registration
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error: any) {
      console.error('Registration failed in AuthContext:', error);
      dispatch({ type: 'SET_LOADING', payload: false });

      // Handle validation errors from backend (422 responses)
      let errorMessage = 'Registration failed';
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = [];

        if (errors.email) errorMessages.push(`Email: ${errors.email.join(', ')}`);
        if (errors.password) errorMessages.push(`Password: ${errors.password.join(', ')}`);
        if (errors.name) errorMessages.push(`Name: ${errors.name.join(', ')}`);

        if (errorMessages.length > 0) {
          errorMessage = errorMessages.join('\n');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
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
      // Navigate to login screen after logout
      router.replace('/(auth)/login');
    }
  };

  const setActiveHousehold = async (household: HouseholdMembership) => {
    dispatch({ type: 'SET_ACTIVE_HOUSEHOLD', payload: household });
    await saveActiveHouseholdId(getHouseholdId(household));
  };

    const refreshUserData = async () => {
    try {
      const userData: any = await apiClient.get('/me');
      
      const adaptedData = {
        user: userData?.user || userData,
        households: userData?.households || []
      };
      
      if (adaptedData.user) {
        dispatch({ type: 'UPDATE_USER', payload: adaptedData.user });
      }

      const householdsArray = Array.isArray(adaptedData.households) ? adaptedData.households : [];
      
      // Smart-select active household BEFORE setting households to avoid race conditions
      const activeHousehold = await selectActiveHousehold(householdsArray);
      
      // Update state with both households and selected active household
      dispatch({ type: 'SET_HOUSEHOLDS', payload: householdsArray });
      dispatch({ type: 'SET_ACTIVE_HOUSEHOLD', payload: activeHousehold });
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      throw error;
    }
  };

    const leaveHousehold = async (householdId: string) => {
    try {
      if (!state.user?.id) {
        throw new Error('User ID not available');
      }
      
      // Call API to remove user from household
      await apiClient.delete(`/households/${householdId}/members/${state.user.id}`);
      
      // Refresh user data to get updated households list
      await refreshUserData();
    } catch (error) {
      console.error('Failed to leave household:', error);
      throw error;
    }
  };

    const deleteHousehold = async (householdId: string) => {
    try {
      // Call API to delete household (parent only)
      await householdService.deleteHousehold(householdId);
      
      // Refresh user data to get updated households list
      await refreshUserData();
    } catch (error) {
      console.error('Failed to delete household:', error);
      throw error;
    }
  };



  // Computed property for checking if user is a parent in active household
  const isParent = state.activeHousehold?.role === 'parent';

  // Helper function to get active household name (handles API data structure)
  const getActiveHouseholdName = (): string => {
    if (!state.activeHousehold) return 'None';
    return getHouseholdName(state.activeHousehold);
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    setActiveHousehold,
    refreshUserData,
    leaveHousehold,
    deleteHousehold,

    getActiveHouseholdName,
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
