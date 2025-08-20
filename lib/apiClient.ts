import { ApiError } from "@/types";
import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { tokenStorage } from "./tokenStorage";

// Configuration
// Note: For iOS simulator, you might need to use 127.0.0.1 instead of localhost
const API_BASE_URL = __DEV__
  ? "http://localhost:4000"
  : "https://your-production-api.com";
const API_VERSION = "v1";
const DEFAULT_TIMEOUT = 10000;
const MAX_RETRIES = 3;

class ApiClient {
  private client: AxiosInstance;
  private retryCount = 0;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
      timeout: DEFAULT_TIMEOUT,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await tokenStorage.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        this.retryCount = 0; // Reset retry count on successful response
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config;

        // Handle 401 - Unauthorized (token expired/invalid)
        if (error.response?.status === 401) {
          await tokenStorage.removeToken();
          // You might want to redirect to login here
          throw this.createApiError(error, "Authentication required");
        }

        // Handle network errors with retry logic
        if (
          !error.response &&
          this.retryCount < MAX_RETRIES &&
          originalRequest
        ) {
          this.retryCount++;

          // Exponential backoff
          const delay = Math.pow(2, this.retryCount) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));

          return this.client.request(originalRequest);
        }

        throw this.createApiError(error);
      }
    );
  }

  private createApiError(error: AxiosError, customMessage?: string): ApiError {
    if (error.response?.data) {
      const errorData = error.response.data as any;
      return {
        message: customMessage || errorData.message || "An error occurred",
        code: errorData.code || error.response.status.toString(),
        details: errorData.details || {},
      };
    }

    if (error.request) {
      return {
        message:
          customMessage || "Network error - please check your connection",
        code: "NETWORK_ERROR",
      };
    }

    return {
      message: customMessage || error.message || "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    };
  }

  // Generic request methods
  async get<T>(url: string, params?: Record<string, any>): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.get(url, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async post<T>(url: string, data?: any): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.post(url, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string }> {
    // Health check doesn't require auth
    const response = await axios.get(
      `${API_BASE_URL}/api/${API_VERSION}/healthz`
    );
    return response.data;
  }

  // Set base URL (useful for switching environments)
  setBaseURL(baseURL: string) {
    this.client.defaults.baseURL = `${baseURL}/api/${API_VERSION}`;
  }

  // Get current base URL
  getBaseURL(): string {
    return this.client.defaults.baseURL || "";
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export { ApiClient };
