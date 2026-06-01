import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/courses.js";
import learningRoutes from "./routes/learning.js";
import examRoutes from "./routes/exams.js";
import adminRoutes from "./routes/admin.js";
import performanceRoutes from "./routes/performance.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = process.env.UPLOAD_DIR || "uploads";

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173"],
    credentials: true
  })
);
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static(path.resolve(__dirname, "..", uploadDir)));

app.get("/api/health", (_req, res) => {
  res.json({ message: "LMS server ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/performance", performanceRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || "服务器异常" });
});

app.listen(port, () => {
  console.log(`LMS server running on http://localhost:${port}`);
});
