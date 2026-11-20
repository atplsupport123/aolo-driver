import axios, { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { useLang } from '../lib/i18n';
import { config } from './config';

export const TOKEN_KEY = 'aolo.token';

export const http = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 20_000,
  headers: { Accept: 'application/json' },
});

let cachedToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export async function setToken(token: string | null) {
  cachedToken = token;
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function loadToken() {
  cachedToken = await SecureStore.getItemAsync(TOKEN_KEY);
  return cachedToken;
}

export function getToken() {
  return cachedToken;
}

export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

http.interceptors.request.use((req) => {
  if (cachedToken) req.headers.Authorization = `Bearer ${cachedToken}`;
  req.headers['Accept-Language'] = useLang.getState().lang;
  return req;
});

/** Normalised error. Laravel returns { message, errors: { field: [msg] } } on 422. */
export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;
  code?: string;
  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}, code?: string) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
    this.code = code;
  }
}

http.interceptors.response.use(
  (res) => res,
  (err: AxiosError<any>) => {
    const status = err.response?.status ?? 0;
    const body = err.response?.data ?? {};
    if (status === 401 && onUnauthorized) onUnauthorized();
    const fieldErrors: Record<string, string> = {};
    if (body.errors && typeof body.errors === 'object') {
      for (const [k, v] of Object.entries(body.errors)) {
        fieldErrors[k] = Array.isArray(v) ? String(v[0]) : String(v);
      }
    }
    const message =
      body.message ?? (status === 0 ? 'No internet connection. Please try again.' : 'Something went wrong.');
    return Promise.reject(new ApiError(message, status, fieldErrors, body.code));
  },
);

/**
 * Unwraps Laravel API Resources, which wrap single payloads in { data: ... }.
 * Paginated collections ({ data, meta, links }) are returned as-is.
 */
export function unwrap<T>(payload: any): T {
  if (payload && typeof payload === 'object' && 'data' in payload && !('meta' in payload)) {
    return payload.data as T;
  }
  return payload as T;
}
