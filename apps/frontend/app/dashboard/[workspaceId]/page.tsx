"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@clerk/nextjs";
import { endpointAPI } from "@/lib/api";
import Link from "next/link";

interface Endpoint {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  responseBody: string;
  delay: number;
  createdAt: string;
}

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  POST: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  PUT: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  PATCH: "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
};

export default function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = use(params);
  const { getToken } = useAuth();
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [method, setMethod] = useState("GET");
  const [path, setPath] = useState("");
  const [statusCode, setStatusCode] = useState(200);
  const [responseBody, setResponseBody] = useState('{\n  "message": "Hello from MockNest!"\n}');
  const [delay, setDelay] = useState(0);

  useEffect(() => {
    loadEndpoints();
  }, []);

  async function loadEndpoints() {
    try {
      const token = await getToken();
      const data = await endpointAPI.getAll(workspaceId, token!);
      setEndpoints(data);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);

    try {
      const token = await getToken();
      await endpointAPI.create(
        workspaceId,
        { method, path, statusCode, responseBody, delay },
        token!
      );
      // Reset form
      setPath("");
      setStatusCode(200);
      setResponseBody('{\n  "message": "Hello from MockNest!"\n}');
      setDelay(0);
      setShowForm(false);
      await loadEndpoints();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus endpoint ini?")) return;

    try {
      const token = await getToken();
      await endpointAPI.delete(id, token!);
      await loadEndpoints();
    } catch (err: any) {
      alert(err.message);
    }
  }

  function getMockUrl(ep: Endpoint) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    return `${baseUrl}/mock/${workspaceId}${ep.path}`;
  }

  function copyUrl(ep: Endpoint) {
    navigator.clipboard.writeText(getMockUrl(ep));
    setCopiedId(ep.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mb-6">
        <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
          Workspaces
        </Link>
        <span>/</span>
        <span className="text-zinc-900 dark:text-zinc-50 font-medium">Detail</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Endpoints
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Buat dan kelola mock endpoint di workspace ini.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Endpoint
        </button>
      </div>

      {/* Form Buat Endpoint */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm space-y-5"
        >
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Buat Endpoint Baru
          </h3>

          {/* Method + Path */}
          <div className="flex gap-3">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-32 px-3 py-2.5 text-sm font-medium border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/api/users"
              className="flex-1 px-4 py-2.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          {/* Status Code + Delay */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                Status Code
              </label>
              <input
                type="number"
                value={statusCode}
                onChange={(e) => setStatusCode(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                Delay (ms)
              </label>
              <input
                type="number"
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
                min={0}
                max={10000}
                className="w-full px-4 py-2.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Response Body */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
              Response Body (JSON)
            </label>
            <textarea
              value={responseBody}
              onChange={(e) => setResponseBody(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 text-sm font-mono border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder='{ "key": "value" }'
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={creating || !path.trim()}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? "Menyimpan..." : "Simpan Endpoint"}
            </button>
          </div>
        </form>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && endpoints.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl">
          <svg className="w-16 h-16 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            Belum ada endpoint
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">
            Buat endpoint pertama Anda dan dapatkan URL mock instan.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Buat Endpoint Pertama
          </button>
        </div>
      )}

      {/* Endpoint List */}
      {!loading && endpoints.length > 0 && (
        <div className="space-y-3">
          {endpoints.map((ep) => (
            <div
              key={ep.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Method Badge */}
                  <span className={`px-3 py-1 text-xs font-bold rounded-md ${METHOD_COLORS[ep.method] || "bg-zinc-100 text-zinc-700"}`}>
                    {ep.method}
                  </span>
                  {/* Path */}
                  <code className="text-sm font-mono text-zinc-900 dark:text-zinc-50">
                    {ep.path}
                  </code>
                  {/* Status Code */}
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    → {ep.statusCode}
                  </span>
                  {/* Delay indicator */}
                  {ep.delay > 0 && (
                    <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {ep.delay}ms
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyUrl(ep)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Copy URL"
                  >
                    {copiedId === ep.id ? (
                      <>
                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                        </svg>
                        Copy URL
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(ep.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Hapus endpoint"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Mock URL Preview */}
              <div className="mt-3 px-3 py-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <code className="text-xs text-zinc-500 dark:text-zinc-400 break-all">
                  {getMockUrl(ep)}
                </code>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
