import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * ═══════════════════════════════════════════════════════
 * MOCK ENGINE — Jantung dari MockNest
 * ═══════════════════════════════════════════════════════
 * 
 * Route ini menangani semua HTTP method (GET, POST, PUT, DELETE, PATCH).
 * Ketika seseorang mengirim request ke:
 *   http://localhost:4000/mock/:workspaceId/api/users
 * 
 * Engine akan:
 * 1. Mencari endpoint yang cocok di database berdasarkan workspaceId, method, dan path.
 * 2. Jika ditemukan, simulasikan delay (jika ada).
 * 3. Catat request ke log (untuk user Pro/Team).
 * 4. Kembalikan response JSON sesuai konfigurasi user.
 */
router.use("/:workspaceId", async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.params;

    // req.path berisi sisa path setelah /:workspaceId
    // Contoh: request ke /mock/abc123/api/users → req.path = /api/users
    const mockPath = req.path === "" ? "/" : req.path;
    const method = req.method.toUpperCase();

    // Cari endpoint yang cocok di database
    const endpoint = await prisma.endpoint.findFirst({
      where: {
        workspaceId,
        method,
        path: mockPath,
      },
      include: {
        workspace: {
          include: { user: true },
        },
      },
    });

    if (!endpoint) {
      res.status(404).json({
        error: "Endpoint tidak ditemukan",
        hint: `Tidak ada endpoint ${method} ${mockPath} di workspace ini`,
      });
      return;
    }

    // ── Simulasi Delay ──
    if (endpoint.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, endpoint.delay));
    }

    // ── Catat Request Log (hanya untuk user Pro/Team) ──
    const userTier = endpoint.workspace.user.tier;
    if (userTier === "PRO" || userTier === "TEAM") {
      prisma.requestLog.create({
        data: {
          endpointId: endpoint.id,
          method,
          headers: JSON.stringify(req.headers),
          body: req.body ? JSON.stringify(req.body) : null,
          ipAddress: req.ip || req.socket.remoteAddress || null,
        },
      }).catch((err) => console.error("Gagal mencatat log:", err));
    }

    // ── Kirim Response ──
    let parsedBody: any;
    try {
      parsedBody = JSON.parse(endpoint.responseBody);
    } catch {
      parsedBody = endpoint.responseBody;
    }

    res.status(endpoint.statusCode).json(parsedBody);
  } catch (error) {
    console.error("Mock engine error:", error);
    res.status(500).json({ error: "Terjadi kesalahan pada mock engine" });
  }
});

export default router;
