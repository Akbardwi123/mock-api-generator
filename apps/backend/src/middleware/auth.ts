import { Request, Response, NextFunction } from "express";
import { requireAuth } from "@clerk/express";
import { prisma } from "../lib/prisma";

/**
 * Middleware: Memastikan user sudah login via Clerk,
 * lalu mencari atau membuat data User di database kita.
 * Hasilnya ditempelkan ke req.dbUser agar route handler bisa langsung pakai.
 */
export const authenticateAndSync = [
  requireAuth(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const clerkId = req.auth?.userId;

      if (!clerkId) {
        res.status(401).json({ error: "Tidak terautentikasi" });
        return;
      }

      // Cari user di database, jika belum ada maka buat baru (upsert)
      const user = await prisma.user.upsert({
        where: { clerkId },
        update: {}, // tidak perlu update apa-apa
        create: {
          clerkId,
          email: `${clerkId}@placeholder.com`, // akan di-update nanti dari Clerk webhook
        },
      });

      // Tempelkan data user ke request agar bisa diakses di route handler
      (req as any).dbUser = user;
      next();
    } catch (error) {
      console.error("Auth sync error:", error);
      res.status(500).json({ error: "Gagal melakukan sinkronisasi user" });
    }
  },
];
