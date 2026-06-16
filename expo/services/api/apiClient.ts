export interface ApiRequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  signal?: AbortSignal;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  ok: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface IApiClient {
  get<T>(path: string, config?: ApiRequestConfig): Promise<ApiResponse<T>>;
  post<T>(path: string, body?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>>;
  put<T>(path: string, body?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>>;
  patch<T>(path: string, body?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>>;
  delete<T>(path: string, config?: ApiRequestConfig): Promise<ApiResponse<T>>;
  setAuthToken(token: string | null): void;
  getAuthToken(): string | null;
}

class HttpApiClient implements IApiClient {
  private baseUrl: string;
  private authToken: string | null = null;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string, defaultHeaders?: Record<string, string>) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
    console.log('[ApiClient] Initialized with baseUrl:', baseUrl);
  }

  setAuthToken(token: string | null): void {
    this.authToken = token;
    console.log('[ApiClient] Auth token', token ? 'set' : 'cleared');
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  private buildHeaders(config?: ApiRequestConfig): Record<string, string> {
    const headers: Record<string, string> = { ...this.defaultHeaders };
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    if (config?.headers) {
      Object.assign(headers, config.headers);
    }
    return headers;
  }

  private buildUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(path, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }
    return url.toString();
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    config?: ApiRequestConfig,
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path, config?.params);
    const headers = this.buildHeaders(config);

    console.log(`[ApiClient] ${method} ${url}`);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: config?.signal,
      });

      const data = await response.json() as T;

      if (!response.ok) {
        const error: ApiError = {
          message: `Request failed with status ${response.status}`,
          status: response.status,
        };
        console.log('[ApiClient] Error:', error);
        throw error;
      }

      console.log(`[ApiClient] ${method} ${path} -> ${response.status}`);
      return { data, status: response.status, ok: true };
    } catch (error) {
      console.log(`[ApiClient] ${method} ${path} failed:`, error);
      throw error;
    }
  }

  async get<T>(path: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('GET', path, undefined, config);
  }

  async post<T>(path: string, body?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('POST', path, body, config);
  }

  async put<T>(path: string, body?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', path, body, config);
  }

  async patch<T>(path: string, body?: unknown, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', path, body, config);
  }

  async delete<T>(path: string, config?: ApiRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', path, undefined, config);
  }
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.placeholder.local';

export const apiClient: IApiClient = new HttpApiClient(API_BASE_URL);
