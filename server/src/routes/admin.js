import express from "express";
import { query } from "../config/db.js";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = express.Router();

function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const content = [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))];
  return content.join("\n");
}

router.get("/dashboard", authRequired, requireRole("admin"), async (req, res) => {
  const userId = req.query.userId ? Number(req.query.userId) : null;
  const courseId = req.query.courseId ? Number(req.query.courseId) : null;

  const rows = await query(
    `SELECT
      u.id AS user_id,
      u.name AS user_name,
      c.id AS course_id,
      c.title AS course_title,
      c.deadline,
      COALESCE(lr.progress, 0) AS progress,
      COALESCE(lr.watch_time, 0) AS watch_time,
      COALESCE(lr.exam_score, 0) AS exam_score,
      COALESCE(lr.status, '未开始') AS status,
      COALESCE(lr.is_overdue, 0) AS is_overdue,
      COALESCE(lr.admin_remark, '') AS admin_remark
    FROM users u
    CROSS JOIN courses c
    LEFT JOIN learning_records lr ON lr.user_id = u.id AND lr.course_id = c.id
    WHERE u.role = 'student'
      AND (? IS NULL OR u.id = ?)
      AND (? IS NULL OR c.id = ?)
    ORDER BY u.id, c.id`,
    [userId, userId, courseId, courseId]
  );

  const total = rows.length || 1;
  const completed = rows.filter((r) => r.status === "已完成").length;
  const overdue = rows.filter((r) => Number(r.is_overdue) === 1).length;
  return res.json({
    summary: {
      total,
      completed,
      completionRate: Number(((completed / total) * 100).toFixed(2)),
      overdue
    },
    rows
  });
});

router.get("/unfinished", authRequired, requireRole("admin"), async (_req, res) => {
  const rows = await query(
    `SELECT u.id AS user_id, u.name AS user_name, c.id AS course_id, c.title AS course_title,
      COALESCE(lr.progress, 0) AS progress, COALESCE(lr.exam_score, 0) AS exam_score, c.deadline
     FROM users u
     CROSS JOIN courses c
     LEFT JOIN learning_records lr ON lr.user_id = u.id AND lr.course_id = c.id
     WHERE u.role = 'student'
      AND (lr.status IS NULL OR lr.status <> '已完成')
     ORDER BY c.deadline ASC`
  );
  return res.json({ rows });
});

router.get("/export", authRequired, requireRole("admin"), async (_req, res) => {
  const rows = await query(
    `SELECT
      u.name AS user_name,
      c.title AS course_title,
      COALESCE(lr.progress, 0) AS progress,
      COALESCE(lr.exam_score, 0) AS exam_score,
      COALESCE(lr.status, '未开始') AS status,
      COALESCE(lr.is_overdue, 0) AS is_overdue,
      c.deadline
     FROM users u
     CROSS JOIN courses c
     LEFT JOIN learning_records lr ON lr.user_id = u.id AND lr.course_id = c.id
     WHERE u.role = 'student'
     ORDER BY u.id, c.id`
  );

  const csv = toCsv(rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=lms-report.csv");
  return res.send(`\uFEFF${csv}`);
});

router.post("/remark", authRequired, requireRole("admin"), async (req, res) => {
  const { userId, courseId, remark = "" } = req.body;
  if (!userId || !courseId) {
    return res.status(400).json({ message: "userId 和 courseId 必填" });
  }
  await query(
    `UPDATE learning_records
     SET admin_remark = ?
     WHERE user_id = ? AND course_id = ?`,
    [remark, userId, courseId]
  );
  return res.json({ message: "备注更新成功" });
});

export default router;
