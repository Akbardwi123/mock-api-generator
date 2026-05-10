import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import routes
import workspaceRoutes from "./routes/workspace";
import endpointRoutes from "./routes/endpoint";
import mockRoutes from "./routes/mock";
import { clerkMiddleware } from "@clerk/express";

const app = express();
const PORT = process.env.PORT || 4000;

// ── Global Middleware ──
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(clerkMiddleware());

// ── Health Check ──
app.get("/", (req, res) => {
  res.json({ 
    status: "ok",
    message: "MockNest Backend Engine is running!",
    version: "1.0.0"
  });
});

// ── API Routes (dilindungi oleh Clerk) ──
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/endpoints", endpointRoutes);

// ── Mock Engine (TIDAK dilindungi — ini URL publik untuk konsumen API) ──
app.use("/mock", mockRoutes);

// ── Start Server ──
app.listen(PORT, () => {
  console.log(`══════════════════════════════════════════`);
  console.log(`  MockNest Backend v1.0.0`);
  console.log(`  Server  : http://localhost:${PORT}`);
  console.log(`  Mock URL: http://localhost:${PORT}/mock/:workspaceId/...`);
  console.log(`══════════════════════════════════════════`);
});
