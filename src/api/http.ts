import { API_BASE_URL as ENV_API_BASE_URL } from '@/lib/env'
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiError extends Error {
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

const API_BASE_URL = String(ENV_API_BASE_URL ?? '');

function joinUrl(baseUrl: string, path: string): string {
  if (!baseUrl) return path;
  if (!path) return baseUrl;
  const left = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const right = path.startsWith('/') ? path : `/${path}`;
  return `${left}${right}`;
}

async function requestJson<T>(path: string, method: HttpMethod, body?: unknown): Promise<T> {
  const url = joinUrl(API_BASE_URL, path);

  // If baseUrl isn't configured, fail loudly so we can notice during development.
  if (!API_BASE_URL) {
    throw new ApiError('NEXT_PUBLIC_API_BASE_URL is not set', 0);
  }

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    throw new ApiError(`Request failed: ${method} ${path}`, res.status, payload);
  }

  return payload as T;
}

export async function getJson<T>(path: string): Promise<T> {
  return requestJson<T>(path, 'GET');
}

export async function postJson<TResponse>(path: string, body?: unknown): Promise<TResponse> {
  return requestJson<TResponse>(path, 'POST', body);
}

export async function putJson<TResponse>(path: string, body?: unknown): Promise<TResponse> {
  return requestJson<TResponse>(path, 'PUT', body);
}

