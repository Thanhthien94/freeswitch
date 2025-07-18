// Modern NextJS 15 API Client - Using native fetch instead of axios

// API Client Configuration
// For Docker: Frontend runs on :3002, Backend on :3000
// Hardcode for now since env vars not working in production build
const API_BASE_URL = 'http://localhost:3000/api/v1';

// Request configuration type
interface RequestConfig {
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
}

// Create fetch wrapper with auth
async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // Get token from localStorage (client-side only)
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  // Add auth token if available
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Make request
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for session-based auth
  });

  // Handle 401 unauthorized
  if (response.status === 401) {
    // Clear token and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }

  return response;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Modern API Methods using native fetch
export const api = {
  // GET request
  get: async <T = unknown>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> => {
    const response = await fetchWithAuth(url, {
      method: 'GET',
      ...config,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // Backend returns direct data, wrap it in ApiResponse format
    return { success: true, data };
  },

  // POST request
  post: async <T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> => {
    const response = await fetchWithAuth(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    // Backend returns direct data, wrap it in ApiResponse format
    return { success: true, data: responseData };
  },

  // PUT request
  put: async <T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> => {
    const response = await fetchWithAuth(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // DELETE request
  delete: async <T = unknown>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> => {
    const response = await fetchWithAuth(url, {
      method: 'DELETE',
      ...config,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // PATCH request
  patch: async <T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>> => {
    const response = await fetchWithAuth(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Download file
  download: async (url: string, filename?: string): Promise<void> => {
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Create download link
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};
