import express from "express";
import { query } from "../config/db.js";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = express.Router();

router.get("/hr", authRequired, requireRole("admin"), async (_req, res) => {
  const rows = await query(
    `SELECT
      u.id AS user_id,
      u.name AS user_name,
      COUNT(c.id) AS total_courses,
      SUM(CASE WHEN lr.status = '已完成' THEN 1 ELSE 0 END) AS completed_courses,
      SUM(CASE WHEN lr.status IS NULL OR lr.status <> '已完成' THEN 1 ELSE 0 END) AS unfinished_courses,
      SUM(CASE WHEN lr.is_overdue = 1 THEN 1 ELSE 0 END) AS overdue_courses
     FROM users u
     CROSS JOIN courses c
     LEFT JOIN learning_records lr ON lr.user_id = u.id AND lr.course_id = c.id
     WHERE u.role = 'student'
     GROUP BY u.id, u.name
     ORDER BY overdue_courses DESC, unfinished_courses DESC`
  );

  const metrics = rows.map((r) => ({
    ...r,
    completion_rate: Number(((Number(r.completed_courses) / Number(r.total_courses || 1)) * 100).toFixed(2))
  }));
  return res.json({ metrics });
});

router.get("/leaderboard", authRequired, async (_req, res) => {
  const rows = await query(
    `SELECT
      u.id AS user_id,
      u.name AS user_name,
      ROUND((SUM(CASE WHEN lr.status = '已完成' THEN 1 ELSE 0 END) / COUNT(c.id)) * 100, 2) AS completion_rate
     FROM users u
     CROSS JOIN courses c
     LEFT JOIN learning_records lr ON lr.user_id = u.id AND lr.course_id = c.id
     WHERE u.role = 'student'
     GROUP BY u.id, u.name
     ORDER BY completion_rate DESC, u.id ASC`
  );
  return res.json({ leaderboard: rows });
});

export default router;
