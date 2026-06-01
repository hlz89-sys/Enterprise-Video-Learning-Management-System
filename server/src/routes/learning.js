import express from "express";
import { query } from "../config/db.js";
import { authRequired } from "../middleware/auth.js";
import { computeOverdue, computeStatus, STATUS } from "../utils/status.js";

const router = express.Router();

async function getOrCreateRecord(userId, courseId) {
  const [row] = await query(
    "SELECT * FROM learning_records WHERE user_id = ? AND course_id = ?",
    [userId, courseId]
  );
  if (row) return row;

  await query(
    `INSERT INTO learning_records
      (user_id, course_id, progress, watch_time, exam_score, status, is_overdue, last_position, last_heartbeat_at)
     VALUES(?,?,?,?,?,?,?,?,?)`,
    [userId, courseId, 0, 0, 0, STATUS.NOT_STARTED, false, 0, null]
  );

  const [newRow] = await query(
    "SELECT * FROM learning_records WHERE user_id = ? AND course_id = ?",
    [userId, courseId]
  );
  return newRow;
}

router.post("/:courseId/progress", authRequired, async (req, res) => {
  const courseId = Number(req.params.courseId);
  const { progress = 0, watchTime = 0, position = 0, duration = 0 } = req.body;

  const [course] = await query("SELECT id, deadline FROM courses WHERE id = ?", [courseId]);
  if (!course) return res.status(404).json({ message: "课程不存在" });

  const record = await getOrCreateRecord(req.user.id, courseId);
  const now = Date.now();
  const lastBeat = record.last_heartbeat_at ? new Date(record.last_heartbeat_at).getTime() : null;
  const elapsedSec = lastBeat ? Math.max(0, (now - lastBeat) / 1000) : null;

  let incomingProgress = Number(progress || 0);
  if (Number(duration) > 0) {
    incomingProgress = Math.max(incomingProgress, (Number(position) / Number(duration)) * 100);
  }
  incomingProgress = Math.min(100, Math.max(0, incomingProgress));

  if (elapsedSec !== null) {
    const deltaProgress = incomingProgress - Number(record.progress || 0);
    const maxProgressDelta = (elapsedSec * 1.5) / Math.max(Number(duration) || 300, 1) * 100 + 5;
    if (deltaProgress > maxProgressDelta) {
      return res.status(400).json({ message: "进度增长异常，疑似伪造" });
    }

    const deltaPosition = Number(position || 0) - Number(record.last_position || 0);
    const maxPositionDelta = elapsedSec * 1.5 + 10;
    if (deltaPosition > maxPositionDelta) {
      return res.status(400).json({ message: "播放位置跳跃异常，疑似拖拽或伪造" });
    }
  }

  const safeWatchTime = Math.max(Number(record.watch_time || 0), Number(watchTime || 0));
  const nextProgress = Math.max(Number(record.progress || 0), incomingProgress);
  const status = computeStatus(nextProgress, record.exam_score);
  const isOverdue = computeOverdue(course.deadline, status);

  await query(
    `UPDATE learning_records
     SET progress = ?, watch_time = ?, status = ?, is_overdue = ?, last_position = ?, last_heartbeat_at = NOW()
     WHERE user_id = ? AND course_id = ?`,
    [nextProgress, safeWatchTime, status, isOverdue, Number(position || 0), req.user.id, courseId]
  );

  return res.json({
    message: "进度已更新",
    progress: nextProgress,
    status,
    isOverdue
  });
});

router.get("/:courseId/status", authRequired, async (req, res) => {
  const courseId = Number(req.params.courseId);
  const record = await getOrCreateRecord(req.user.id, courseId);
  return res.json({ record });
});

export default router;
