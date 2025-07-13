// API Connection Test Utility

export const testApiConnection = async (): Promise<{
  success: boolean;
  message: string;
  details?: unknown;
}> => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  try {
    console.log('Testing API connection to:', API_BASE_URL);
    
    // Test basic connectivity
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      message: 'API connection successful',
      details: {
        status: response.status,
        url: API_BASE_URL,
        health: data,
      },
    };
  } catch (error) {
    console.error('API connection test failed:', error);
    
    return {
      success: false,
      message: `API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        url: API_BASE_URL,
        error: error instanceof Error ? error.message : error,
      },
    };
  }
};

export const testAuthEndpoint = async (): Promise<{
  success: boolean;
  message: string;
  details?: unknown;
}> => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  try {
    console.log('Testing auth endpoint:', `${API_BASE_URL}/auth/login`);
    
    // Test auth endpoint with invalid credentials (should return 401)
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailOrUsername: 'test@test.com',
        password: 'invalid',
      }),
    });

    // We expect 401 for invalid credentials, which means endpoint is working
    if (response.status === 401) {
      return {
        success: true,
        message: 'Auth endpoint is working (returned 401 for invalid credentials)',
        details: {
          status: response.status,
          url: `${API_BASE_URL}/auth/login`,
        },
      };
    }

    // If we get other status, check the response
    const data = await response.json().catch(() => null);
    
    return {
      success: response.ok,
      message: `Auth endpoint responded with status ${response.status}`,
      details: {
        status: response.status,
        url: `${API_BASE_URL}/auth/login`,
        response: data,
      },
    };
  } catch (error) {
    console.error('Auth endpoint test failed:', error);
    
    return {
      success: false,
      message: `Auth endpoint test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: {
        url: `${API_BASE_URL}/auth/login`,
        error: error instanceof Error ? error.message : error,
      },
    };
  }
};

export const runApiTests = async (): Promise<void> => {
  console.log('🔍 Running API connection tests...');
  
  // Test 1: Basic connectivity
  const healthTest = await testApiConnection();
  console.log('Health Check:', healthTest);
  
  // Test 2: Auth endpoint
  const authTest = await testAuthEndpoint();
  console.log('Auth Endpoint:', authTest);
  
  // Summary
  const allPassed = healthTest.success && authTest.success;
  console.log(`\n📊 Test Summary: ${allPassed ? '✅ All tests passed' : '❌ Some tests failed'}`);
  
  if (!allPassed) {
    console.log('💡 Troubleshooting tips:');
    console.log('1. Make sure NestJS backend is running on port 3000');
    console.log('2. Check if backend has CORS enabled for frontend origin');
    console.log('3. Verify backend health endpoint is accessible');
    console.log('4. Check Docker network configuration if using containers');
  }
};

// Auto-run tests in development mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run tests after a short delay to avoid blocking initial render
  setTimeout(() => {
    if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
      runApiTests();
    }
  }, 2000);
}
