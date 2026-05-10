import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@clerk/express";
import { prisma } from "../lib/prisma";

/**
 * Middleware: Memverifikasi JWT token dari Clerk,
 * lalu mencari atau membuat data User di database kita.
 * Hasilnya ditempelkan ke req.dbUser agar route handler bisa langsung pakai.
 */
export const authenticateAndSync = [
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ambil token dari Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Tidak terautentikasi - token tidak ditemukan" });
        return;
      }

      const token = authHeader.split(" ")[1];

      // Verifikasi token menggunakan Clerk
      let clerkId: string;
      try {
        const payload = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY!,
        });
        clerkId = payload.sub;
      } catch (verifyError: any) {
        console.error("Token verification failed:", verifyError.message || verifyError);
        res.status(401).json({ error: "Token tidak valid" });
        return;
      }

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
