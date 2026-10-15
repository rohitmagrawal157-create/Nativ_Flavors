import { API_BASE_URL } from '@/lib/env'
import axios from 'axios';
import type { AxiosError, AxiosInstance } from 'axios';

import { ApiError } from './http';

const baseURL = String(API_BASE_URL ?? '');
if (!baseURL) {
  // Helpful warning for developers — if unset requests will go to app origin
  // which may not be the intended API server (compare with Postman URL).
  // Set NEXT_PUBLIC_API_BASE_URL in your .env to the API root (e.g.
  // https://example.com/Shopping-Cart/public).
  // eslint-disable-next-line no-console
  console.warn('NEXT_PUBLIC_API_BASE_URL is not set — apiClient will use relative URLs. If your backend is remote, set NEXT_PUBLIC_API_BASE_URL to the API origin.');
}

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token automatically (if present).
apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('access_token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Attach known session id headers automatically for servers that expect
// different header names (`session-id`, `session_id`, `x-session-id`). This
// avoids forgetting to pass the header from callers and improves backend
// compatibility when integrating with varied APIs.
apiClient.interceptors.request.use((config) => {
  try {
    config.headers = config.headers ?? {};
    const sid = window.localStorage.getItem('session_id') || window.localStorage.getItem('session-id');
    if (sid) {
      // Do not overwrite if already provided by the call-site
      if (!config.headers['session-id'] && !config.headers['Session-Id']) config.headers['session-id'] = sid;
      if (!config.headers['session_id']) config.headers['session_id'] = sid;
      if (!config.headers['x-session-id']) config.headers['x-session-id'] = sid;
    }
    // Debug: log cart-related requests so it's easier to compare with Postman
    try {
      const method = (config.method || 'get').toUpperCase();
      const url = config.baseURL ? config.baseURL.replace(/\/$/, '') + config.url : String(config.url);
      if (String(url).includes('/api/cart') || String(url).includes('/api/checkout')) {
        let headersOut: any = config.headers;
        try {
          // Axios may use AxiosHeaders which exposes toJSON()
          if (typeof (config.headers as any)?.toJSON === 'function') headersOut = (config.headers as any).toJSON();
        } catch {}
        // eslint-disable-next-line no-console
        console.info('[apiClient] request:', method, url, { headers: headersOut, data: config.data });
      }
    } catch (e) { /* ignore logging errors */ }
  } catch (e) {
    // ignore
  }
  return config;
});

// Global response handling.
apiClient.interceptors.response.use(
  (response) => {
    try {
      const url = String(response.config?.url ?? '');
      if (url.includes('/api/cart') || url.includes('/api/checkout')) {
        // eslint-disable-next-line no-console
        console.info('[apiClient] response:', response.status, String(response.config?.baseURL ?? '') + String(response.config?.url ?? ''), response.data);
      }
    } catch (e) { /* ignore */ }
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;
    const data = error.response?.data;

    try {
      const url = String(error.config?.url ?? '');
      if (url.includes('/api/cart') || url.includes('/api/checkout')) {
        // eslint-disable-next-line no-console
        console.error('[apiClient] response error:', url, status, data, error.message);
      }
    } catch (e) { /* ignore */ }

    if (status === 401) {
      // Basic auto-logout behavior.
      window.localStorage.removeItem('access_token');
      window.location.assign('/login');
    }

    const message =
      typeof (data as any)?.message === 'string'
        ? (data as any).message
        : error.message || 'Request failed';

    return Promise.reject(new ApiError(message, status, data));
  },
);

