import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticateAndSync } from "../middleware/auth";

const router = Router();

// ═══════════════════════════════════════════════════════
// GET /api/workspaces — Ambil semua workspace milik user
// ═══════════════════════════════════════════════════════
router.get("/", authenticateAndSync, async (req: Request, res: Response) => {
  try {
    const user = (req as any).dbUser;

    const workspaces = await prisma.workspace.findMany({
      where: { userId: user.id },
      include: { _count: { select: { endpoints: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json(workspaces);
  } catch (error) {
    console.error("Get workspaces error:", error);
    res.status(500).json({ error: "Gagal mengambil data workspace" });
  }
});

// ═══════════════════════════════════════════════════════
// POST /api/workspaces — Buat workspace baru
// ═══════════════════════════════════════════════════════
router.post("/", authenticateAndSync, async (req: Request, res: Response) => {
  try {
    const user = (req as any).dbUser;
    const { name } = req.body;

    if (!name || typeof name !== "string") {
      res.status(400).json({ error: "Nama workspace wajib diisi" });
      return;
    }

    const workspace = await prisma.workspace.create({
      data: { name, userId: user.id },
    });

    res.status(201).json(workspace);
  } catch (error) {
    console.error("Create workspace error:", error);
    res.status(500).json({ error: "Gagal membuat workspace" });
  }
});

// ═══════════════════════════════════════════════════════
// DELETE /api/workspaces/:id — Hapus workspace beserta isinya
// ═══════════════════════════════════════════════════════
router.delete("/:id", authenticateAndSync, async (req: Request, res: Response) => {
  try {
    const user = (req as any).dbUser;
    const { id } = req.params;

    // Pastikan workspace ini milik user yang sedang login
    const workspace = await prisma.workspace.findFirst({
      where: { id, userId: user.id },
    });

    if (!workspace) {
      res.status(404).json({ error: "Workspace tidak ditemukan" });
      return;
    }

    // Hapus semua log dan endpoint terlebih dahulu (cascade manual)
    await prisma.requestLog.deleteMany({
      where: { endpoint: { workspaceId: id } },
    });
    await prisma.endpoint.deleteMany({ where: { workspaceId: id } });
    await prisma.workspace.delete({ where: { id } });

    res.json({ message: "Workspace berhasil dihapus" });
  } catch (error) {
    console.error("Delete workspace error:", error);
    res.status(500).json({ error: "Gagal menghapus workspace" });
  }
});

export default router;
