import { getSession, signOut } from "next-auth/react";

type FetchMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface FetchError {
  status: number;
  message: string;
  [key: string]: any;
}

let isRedirecting = false;

export async function fetchData<T>(
  url: string,
  method: FetchMethod = "GET",
  token?: string | null,
  body?: unknown,
  isRetry: boolean = false
): Promise<T> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL não está definido");

  // Se não receber token, tenta pegar da sessão NextAuth
  let authToken = token;
  if (!authToken && typeof window !== "undefined") {
    const session = await getSession();
    authToken = session?.user?.accessToken ?? null;
    
    // Verifica se a sessão tem erro de refresh
    if (session?.error === "RefreshAccessTokenError") {
      console.error("Sessão expirada, redirecionando para login...");
      if (!isRedirecting) {
        isRedirecting = true;
        await signOut({ callbackUrl: "/login", redirect: true }).catch(() => {
          window.location.href = "/login";
        });
      }
      throw new Error("Sessão expirada");
    }
  }

  const headers: HeadersInit = {
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(body ? { "Content-Type": "application/json" } : {}),
  };

  const options: RequestInit = {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  let response: Response;
  try {
    response = await fetch(`${API_URL}${url}`, options);
  } catch (err) {
    console.error("Erro de conexão com a API:", err);
    throw { 
      status: 0, 
      message: "Erro de conexão com a API", 
      error: err 
    } as FetchError;
  }

  let data: T | FetchError;
  try {
    data = (await response.json()) as T;
  } catch {
    data = { 
      status: response.status, 
      message: "Resposta da API não é JSON válido" 
    };
  }

  if (!response.ok) {
    // Token expirado ou inválido
    if (response.status === 401 || response.status === 498) {
      if (typeof window !== "undefined" && !isRedirecting && !isRetry) {
        console.log("Token expirado detectado, tentando renovar sessão...");

        await new Promise(resolve => setTimeout(resolve, 1000));

        let newSession = await getSession();

        if (newSession?.user?.accessToken === authToken) {
          console.log("Tentativa 2 de renovação...");
          await new Promise(resolve => setTimeout(resolve, 500));
          newSession = await getSession();
        }

        if (newSession && !newSession.error && newSession.user?.accessToken && 
            newSession.user.accessToken !== authToken) {
          console.log("Sessão renovada com sucesso, retentando requisição...");
          return fetchData<T>(url, method, newSession.user.accessToken, body, true);
        }

        console.error("Não foi possível renovar sessão, fazendo logout...");
        isRedirecting = true;

        await signOut({ callbackUrl: "/login", redirect: true }).catch(() => {
          window.location.href = "/login";
        });
        
        throw {
          status: response.status,
          message: "Sessão expirada. Redirecionando para login...",
        } as FetchError;
      }
    }
    
    throw {
      status: response.status,
      message: (data as any)?.message || "Erro na requisição",
      ...data,
    } as FetchError;
  }

  return data as T;
}

export async function get<T>(url: string, token?: string | null): Promise<T> {
  return fetchData<T>(url, "GET", token);
}

export async function post<T>(
  url: string,
  body?: unknown,
  token?: string | null
): Promise<T> {
  return fetchData<T>(url, "POST", token, body);
}

export async function put<T>(
  url: string,
  body?: unknown,
  token?: string | null
): Promise<T> {
  return fetchData<T>(url, "PUT", token, body);
}

export async function del<T>(url: string, token?: string | null): Promise<T> {
  return fetchData<T>(url, "DELETE", token);
}

export async function patch<T>(
  url: string,
  body?: unknown,
  token?: string | null
): Promise<T> {
  return fetchData<T>(url, "PATCH", token, body);
}
