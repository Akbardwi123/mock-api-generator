const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Wrapper untuk fetch yang otomatis menyertakan token Clerk
 * dan menangani error secara konsisten.
 */
async function fetchAPI(path: string, options: RequestInit = {}, token?: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Terjadi kesalahan pada server");
  }

  return data;
}

// ── Workspace API ──
export const workspaceAPI = {
  getAll: (token: string) => fetchAPI("/api/workspaces", {}, token),

  create: (name: string, token: string) =>
    fetchAPI("/api/workspaces", {
      method: "POST",
      body: JSON.stringify({ name }),
    }, token),

  delete: (id: string, token: string) =>
    fetchAPI(`/api/workspaces/${id}`, { method: "DELETE" }, token),
};

// ── Endpoint API ──
export const endpointAPI = {
  getAll: (workspaceId: string, token: string) =>
    fetchAPI(`/api/endpoints/${workspaceId}`, {}, token),

  create: (
    workspaceId: string,
    data: {
      method: string;
      path: string;
      statusCode: number;
      responseBody: string;
      delay: number;
    },
    token: string
  ) =>
    fetchAPI(`/api/endpoints/${workspaceId}`, {
      method: "POST",
      body: JSON.stringify(data),
    }, token),

  update: (
    id: string,
    data: Partial<{
      method: string;
      path: string;
      statusCode: number;
      responseBody: string;
      delay: number;
    }>,
    token: string
  ) =>
    fetchAPI(`/api/endpoints/update/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }, token),

  delete: (id: string, token: string) =>
    fetchAPI(`/api/endpoints/delete/${id}`, { method: "DELETE" }, token),
};
