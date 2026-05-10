"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { workspaceAPI } from "@/lib/api";
import Link from "next/link";

interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  _count: { endpoints: number };
}

export default function DashboardPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Ambil data workspace saat Clerk session sudah ready
  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn) {
      loadWorkspaces();
    } else {
      // User belum sign in, stop loading
      console.log("Clerk: user not signed in, isLoaded:", isLoaded, "isSignedIn:", isSignedIn);
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  async function loadWorkspaces() {
    try {
      const token = await getToken();
      if (!token) {
        console.error("Token tidak tersedia");
        return;
      }
      const data = await workspaceAPI.getAll(token);
      setWorkspaces(data);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    try {
      const token = await getToken();
      if (!token) return;
      await workspaceAPI.create(newName.trim(), token);
      setNewName("");
      setShowForm(false);
      await loadWorkspaces();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus workspace ini? Semua endpoint di dalamnya juga akan ikut terhapus.")) return;

    try {
      const token = await getToken();
      if (!token) return;
      await workspaceAPI.delete(id, token);
      await loadWorkspaces();
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Workspaces
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            Kelola workspace dan endpoint mock API Anda.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Workspace
        </button>
      </div>

      {/* Form Buat Workspace */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm"
        >
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Nama Workspace
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="contoh: E-Commerce API, Blog Backend..."
              className="flex-1 px-4 py-2.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              autoFocus
            />
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? "Membuat..." : "Buat"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setNewName(""); }}
              className="px-4 py-2.5 text-sm text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && workspaces.length === 0 && (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl">
          <svg className="w-16 h-16 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
            Belum ada workspace
          </h3>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">
            Buat workspace pertama Anda untuk mulai membuat mock API.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Buat Workspace Pertama
          </button>
        </div>
      )}

      {/* Workspace Cards */}
      {!loading && workspaces.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-800 transition-all duration-200"
            >
              <Link href={`/dashboard/${ws.id}`} className="absolute inset-0 z-10" />
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
                  </svg>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(ws.id);
                  }}
                  className="relative z-20 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Hapus workspace"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {ws.name}
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {ws._count.endpoints} endpoint
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                {new Date(ws.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
