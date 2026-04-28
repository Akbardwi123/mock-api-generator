import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticateAndSync } from "../middleware/auth";

const router = Router();

// ═══════════════════════════════════════════════════════
// GET /api/endpoints/:workspaceId — Ambil semua endpoint di workspace
// ═══════════════════════════════════════════════════════
router.get("/:workspaceId", authenticateAndSync, async (req: Request, res: Response) => {
  try {
    const user = (req as any).dbUser;
    const { workspaceId } = req.params;

    // Verifikasi bahwa workspace ini milik user
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: user.id },
    });

    if (!workspace) {
      res.status(404).json({ error: "Workspace tidak ditemukan" });
      return;
    }

    const endpoints = await prisma.endpoint.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });

    res.json(endpoints);
  } catch (error) {
    console.error("Get endpoints error:", error);
    res.status(500).json({ error: "Gagal mengambil data endpoint" });
  }
});

// ═══════════════════════════════════════════════════════
// POST /api/endpoints/:workspaceId — Buat endpoint baru
// ═══════════════════════════════════════════════════════
router.post("/:workspaceId", authenticateAndSync, async (req: Request, res: Response) => {
  try {
    const user = (req as any).dbUser;
    const { workspaceId } = req.params;
    const { method, path, statusCode, responseBody, delay } = req.body;

    // Verifikasi workspace milik user
    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, userId: user.id },
    });

    if (!workspace) {
      res.status(404).json({ error: "Workspace tidak ditemukan" });
      return;
    }

    // Cek batas endpoint untuk tier FREE (maksimal 3)
    if (user.tier === "FREE") {
      const endpointCount = await prisma.endpoint.count({
        where: { workspaceId },
      });
      if (endpointCount >= 3) {
        res.status(403).json({
          error: "Batas endpoint tercapai (3 endpoint untuk tier Free). Upgrade ke Pro untuk unlimited.",
        });
        return;
      }
    }

    // Validasi input
    const validMethods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
    if (!method || !validMethods.includes(method.toUpperCase())) {
      res.status(400).json({ error: `Method harus salah satu dari: ${validMethods.join(", ")}` });
      return;
    }

    if (!path || typeof path !== "string") {
      res.status(400).json({ error: "Path URL wajib diisi" });
      return;
    }

    // Pastikan path diawali dengan /
    const cleanPath = path.startsWith("/") ? path : `/${path}`;

    // Validasi responseBody sebagai JSON yang valid
    if (responseBody) {
      try {
        JSON.parse(responseBody);
      } catch {
        res.status(400).json({ error: "Response body harus berupa JSON yang valid" });
        return;
      }
    }

    const endpoint = await prisma.endpoint.create({
      data: {
        workspaceId,
        method: method.toUpperCase(),
        path: cleanPath,
        statusCode: statusCode || 200,
        responseBody: responseBody || "{}",
        delay: delay || 0,
      },
    });

    res.status(201).json(endpoint);
  } catch (error: any) {
    // Handle unique constraint violation (duplicate method + path)
    if (error.code === "P2002") {
      res.status(409).json({
        error: "Kombinasi method dan path ini sudah ada di workspace Anda",
      });
      return;
    }
    console.error("Create endpoint error:", error);
    res.status(500).json({ error: "Gagal membuat endpoint" });
  }
});

// ═══════════════════════════════════════════════════════
// PUT /api/endpoints/update/:id — Update endpoint
// ═══════════════════════════════════════════════════════
router.put("/update/:id", authenticateAndSync, async (req: Request, res: Response) => {
  try {
    const user = (req as any).dbUser;
    const { id } = req.params;
    const { method, path, statusCode, responseBody, delay } = req.body;

    // Verifikasi endpoint milik user
    const existing = await prisma.endpoint.findFirst({
      where: { id },
      include: { workspace: true },
    });

    if (!existing || existing.workspace.userId !== user.id) {
      res.status(404).json({ error: "Endpoint tidak ditemukan" });
      return;
    }

    // Validasi responseBody jika dikirim
    if (responseBody) {
      try {
        JSON.parse(responseBody);
      } catch {
        res.status(400).json({ error: "Response body harus berupa JSON yang valid" });
        return;
      }
    }

    const cleanPath = path ? (path.startsWith("/") ? path : `/${path}`) : undefined;

    const updated = await prisma.endpoint.update({
      where: { id },
      data: {
        ...(method && { method: method.toUpperCase() }),
        ...(cleanPath && { path: cleanPath }),
        ...(statusCode !== undefined && { statusCode }),
        ...(responseBody !== undefined && { responseBody }),
        ...(delay !== undefined && { delay }),
      },
    });

    res.json(updated);
  } catch (error: any) {
    if (error.code === "P2002") {
      res.status(409).json({
        error: "Kombinasi method dan path ini sudah ada di workspace Anda",
      });
      return;
    }
    console.error("Update endpoint error:", error);
    res.status(500).json({ error: "Gagal mengupdate endpoint" });
  }
});

// ═══════════════════════════════════════════════════════
// DELETE /api/endpoints/delete/:id — Hapus endpoint
// ═══════════════════════════════════════════════════════
router.delete("/delete/:id", authenticateAndSync, async (req: Request, res: Response) => {
  try {
    const user = (req as any).dbUser;
    const { id } = req.params;

    const existing = await prisma.endpoint.findFirst({
      where: { id },
      include: { workspace: true },
    });

    if (!existing || existing.workspace.userId !== user.id) {
      res.status(404).json({ error: "Endpoint tidak ditemukan" });
      return;
    }

    // Hapus log terlebih dahulu, lalu endpoint
    await prisma.requestLog.deleteMany({ where: { endpointId: id } });
    await prisma.endpoint.delete({ where: { id } });

    res.json({ message: "Endpoint berhasil dihapus" });
  } catch (error) {
    console.error("Delete endpoint error:", error);
    res.status(500).json({ error: "Gagal menghapus endpoint" });
  }
});

export default router;
