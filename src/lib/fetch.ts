/**
 * Safe fetch utility that properly handles HTTP errors and JSON parsing
 * Prevents "Unexpected token '<'" errors when parsing error responses
 */

export interface FetchResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class FetchError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'FetchError';
  }
}

export async function safeFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<FetchResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    });

    // Check if the response is OK
    if (!response.ok) {
      // Try to parse error message from JSON if possible
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        }
      } catch {
        // Ignore JSON parsing errors for error responses
      }

      throw new FetchError(errorMessage, response.status, response);
    }

    // Check content type before parsing JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON response, got ${contentType}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof FetchError) {
      throw error;
    }

    // Handle network errors or other issues
    throw new FetchError(
      error instanceof Error ? error.message : 'Unknown fetch error',
      0
    );
  }
}

/**
 * Simplified fetch wrapper for common success/error handling
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {},
  errorMessage = 'Request failed'
): Promise<T> {
  try {
    const result = await safeFetch<T>(url, options);
    
    if (!result.success) {
      throw new Error(result.error || errorMessage);
    }

    return result.data as T;
  } catch (error) {
    if (error instanceof FetchError) {
      console.error(`API Error [${error.status}]:`, error.message);
      throw new Error(error.message);
    }
    
    console.error('API Request Error:', error);
    throw new Error(error instanceof Error ? error.message : errorMessage);
  }
}