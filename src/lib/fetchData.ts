import { authClient } from '@/lib/auth-client';

type FetchMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface FetchError {
  status: number;
  message: string;
  [key: string]: unknown;
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
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  let response: Response;
  try {
    response = await fetch(`${API_URL}${url}`, options);
  } catch (err) {
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
    throw new Error((data as FetchError)?.message || 'Erro na requisição');
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
