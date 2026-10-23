import { authClient } from '@/lib/auth-client';

type FetchMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface FetchError {
  status: number;
  message: string;
  [key: string]: unknown;
}

const TIMEOUT_MS = 30_000;

export class ErroApi extends Error {
  status: number;
  errors: Array<{ path?: string; message: string }>;
  response: { status: number; data: unknown };

  constructor(status: number, dados: unknown) {
    const corpo = (dados ?? {}) as {
      message?: string;
      errors?: Array<{ path?: string; message: string }>;
    };
    super(corpo.message || 'Erro na requisição');
    this.name = 'ErroApi';
    this.status = status;
    this.errors = Array.isArray(corpo.errors) ? corpo.errors : [];
    this.response = { status, data: dados };
  }
}

let isRedirecting = false;

export async function fetchData<T>(
  url: string,
  method: FetchMethod = 'GET',
  body?: unknown,
): Promise<T> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL não está definido');

  const headers: HeadersInit = {
    ...(body ? { 'Content-Type': 'application/json' } : {}),
  };

  const options: RequestInit = {
    method,
    headers,
    credentials: 'include', // envia cookie de sessão Better Auth
    signal: AbortSignal.timeout(TIMEOUT_MS),
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  let response: Response;
  try {
    response = await fetch(`${API_URL}${url}`, options);
  } catch (err) {
    if ((err as Error)?.name === 'TimeoutError') {
      throw new Error('A API demorou demais para responder');
    }
    console.error('Erro de conexão com a API:', err);
    throw new Error('Erro de conexão com a API');
  }

  let data: T | FetchError;
  try {
    data = (await response.json()) as T;
  } catch {
    data = {
      status: response.status,
      message: 'Resposta da API não é JSON válido',
    };
  }

  if (!response.ok) {
    if (
      (response.status === 401 || response.status === 498) &&
      typeof window !== 'undefined'
    ) {
      if (!isRedirecting) {
        isRedirecting = true;
        await authClient.signOut().catch(() => {});
        window.location.href = '/login';
      }
      throw new Error('Sessão expirada');
    }
    throw new ErroApi(response.status, data);
  }

  return data as T;
}

export async function get<T>(url: string): Promise<T> {
  return fetchData<T>(url, 'GET');
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  return fetchData<T>(url, 'POST', body);
}

export async function put<T>(url: string, body?: unknown): Promise<T> {
  return fetchData<T>(url, 'PUT', body);
}

export async function del<T>(url: string): Promise<T> {
  return fetchData<T>(url, 'DELETE');
}

export async function patch<T>(url: string, body?: unknown): Promise<T> {
  return fetchData<T>(url, 'PATCH', body);
}
