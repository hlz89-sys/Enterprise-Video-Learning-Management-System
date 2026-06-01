import express from "express";
import { query } from "../config/db.js";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.get("/", authRequired, async (req, res) => {
  const courses = await query(
    `SELECT c.id, c.title, c.video_url, c.type, c.deadline,
      lr.progress, lr.watch_time, lr.exam_score, lr.status, lr.is_overdue, lr.admin_remark
     FROM courses c
     LEFT JOIN learning_records lr ON lr.course_id = c.id AND lr.user_id = ?
     ORDER BY c.id DESC`,
    [req.user.id]
  );
  return res.json({ courses });
});

router.get("/:id", authRequired, async (req, res) => {
  const [course] = await query("SELECT * FROM courses WHERE id = ?", [req.params.id]);
  if (!course) return res.status(404).json({ message: "课程不存在" });

  const [record] = await query(
    "SELECT * FROM learning_records WHERE user_id = ? AND course_id = ?",
    [req.user.id, req.params.id]
  );
  return res.json({ course, record: record || null });
});

router.post("/", authRequired, requireRole("admin"), async (req, res) => {
  const { title, videoUrl, type, deadline } = req.body;
  if (!title || !videoUrl || !type) {
    return res.status(400).json({ message: "title/videoUrl/type 必填" });
  }
  if (!["local", "external"].includes(type)) {
    return res.status(400).json({ message: "type 必须为 local 或 external" });
  }

  await query(
    "INSERT INTO courses(title, video_url, type, deadline) VALUES(?,?,?,?)",
    [title, videoUrl, type, deadline || null]
  );
  return res.status(201).json({ message: "课程创建成功" });
});

router.post(
  "/upload",
  authRequired,
  requireRole("admin"),
  upload.single("video"),
  async (req, res) => {
    const { title, deadline } = req.body;
    if (!req.file) return res.status(400).json({ message: "请上传视频文件" });
    if (!title) return res.status(400).json({ message: "title 必填" });

    const videoPath = `/uploads/${req.file.filename}`;
    await query(
      "INSERT INTO courses(title, video_url, type, deadline) VALUES(?,?,?,?)",
      [title, videoPath, "local", deadline || null]
    );
    return res.status(201).json({ message: "本地课程上传成功", videoPath });
  }
);

export default router;
