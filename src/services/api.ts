const BASE_URL = 'https://dsg-b.onrender.com';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...rest } = options;

  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const token = localStorage.getItem('auth_token');
  const validToken = token && token !== 'undefined' && token !== 'null' ? token : null;

  // Add timeout - Render free tier can take up to 60s to wake up
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(validToken ? { Authorization: `Bearer ${validToken}` } : {}),
        ...headers,
      },
    });
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('O servidor demorou para responder. O backend pode estar iniciando — tente novamente em alguns segundos.');
    }
    throw new Error('Erro de conexão. Verifique sua internet ou tente novamente.');
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `Erro ${response.status}`);
  }

  if (response.status === 204) return {} as T;
  return response.json();
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string>) =>
    request<T>(endpoint, { method: 'GET', params }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'DELETE' }),

  upload: <T>(endpoint: string, formData: FormData) => {
    const token = localStorage.getItem('auth_token');
    const validToken = token && token !== 'undefined' && token !== 'null' ? token : null;
    if (!validToken) {
      return Promise.reject(new Error('Sessão expirada. Faça login novamente.'));
    }
    return fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${validToken}` },
      body: formData,
    }).then(async res => {
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message || `Erro ${res.status}`);
      }
      return res.json() as Promise<T>;
    });
  },
};

export default api;
