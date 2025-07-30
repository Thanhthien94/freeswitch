// Modern NextJS 15 API Client - Using native fetch instead of axios

// API Client Configuration
// For Docker: Frontend runs on :3002, Backend on :3000
// Browser uses environment variable or fallback, Server uses container name
const API_BASE_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1')  // Browser: use env var
  : 'http://nestjs-api:3000/api/v1'; // Server-side: use container name

// Request configuration type
interface RequestConfig {
  headers?: Record<string, string>;
  credentials?: RequestCredentials;
  responseType?: 'json' | 'blob' | 'text';
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

// API Response Types - Updated to match Backend format
export interface ApiResponse<T = unknown> {
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

// Modern API Methods using native fetch
export const api = {
  // GET request
  get: async <T = unknown>(url: string, config?: RequestConfig): Promise<T> => {
    console.log('🔍 API Client: Making GET request to:', url);

    const response = await fetchWithAuth(url, {
      method: 'GET',
      ...config,
    });

    console.log('🔍 API Client: Response status:', response.status);

    if (!response.ok) {
      console.error('❌ API Client: HTTP error:', response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle different response types
    if (config?.responseType === 'blob') {
      const blob = await response.blob();
      return blob as T;
    } else if (config?.responseType === 'text') {
      const text = await response.text();
      return text as T;
    } else {
      const data = await response.json();
      console.log('✅ API Client: Response data:', data);
      // Backend returns direct format: { data: [...], pagination: {...} }
      return data;
    }
  },

  // POST request
  post: async <T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> => {
    const response = await fetchWithAuth(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    // For POST requests, Backend returns direct data (like login response)
    return responseData;
  },

  // PUT request
  put: async <T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> => {
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
  delete: async <T = unknown>(url: string, config?: RequestConfig): Promise<T> => {
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
  patch: async <T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> => {
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
