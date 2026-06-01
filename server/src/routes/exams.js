import express from "express";
import { query } from "../config/db.js";
import { authRequired } from "../middleware/auth.js";
import { computeOverdue, computeStatus } from "../utils/status.js";

const router = express.Router();

async function getRecord(userId, courseId) {
  const [row] = await query(
    "SELECT * FROM learning_records WHERE user_id = ? AND course_id = ?",
    [userId, courseId]
  );
  return row || null;
}

router.get("/:courseId/questions", authRequired, async (req, res) => {
  const courseId = Number(req.params.courseId);
  const record = await getRecord(req.user.id, courseId);
  if (!record || Number(record.progress) < 90) {
    return res.status(403).json({ message: "视频进度未达到 90%，禁止考试" });
  }

  const questions = await query(
    "SELECT id, course_id, question, options, type FROM exams WHERE course_id = ? ORDER BY id ASC",
    [courseId]
  );

  const cleaned = questions.map((q) => ({
    ...q,
    options: JSON.parse(q.options)
  }));
  return res.json({ questions: cleaned });
});

router.post("/:courseId/submit", authRequired, async (req, res) => {
  const courseId = Number(req.params.courseId);
  const answers = Array.isArray(req.body.answers) ? req.body.answers : [];

  const [course] = await query("SELECT id, deadline FROM courses WHERE id = ?", [courseId]);
  if (!course) return res.status(404).json({ message: "课程不存在" });

  const record = await getRecord(req.user.id, courseId);
  if (!record || Number(record.progress) < 90) {
    return res.status(403).json({ message: "视频进度未达到 90%，禁止考试" });
  }

  const questions = await query(
    "SELECT id, correct_answer, type FROM exams WHERE course_id = ?",
    [courseId]
  );
  if (!questions.length) return res.status(400).json({ message: "当前课程未配置考试题" });

  const answerMap = new Map(answers.map((a) => [Number(a.questionId), a.answer]));
  let correctCount = 0;

  for (const q of questions) {
    const std = JSON.parse(q.correct_answer);
    const userAns = answerMap.get(Number(q.id));
    const stdNorm = [...std].sort().join("|");
    const userNorm = Array.isArray(userAns) ? [...userAns].sort().join("|") : "";
    if (stdNorm === userNorm) correctCount += 1;
  }

  const score = Math.round((correctCount / questions.length) * 100);
  const bestScore = Math.max(Number(record.exam_score || 0), score);
  const status = computeStatus(record.progress, bestScore);
  const isOverdue = computeOverdue(course.deadline, status);

  await query(
    `INSERT INTO exam_attempts(user_id, course_id, score, submitted_at)
     VALUES(?,?,?,NOW())`,
    [req.user.id, courseId, score]
  );

  await query(
    `UPDATE learning_records
     SET exam_score = ?, status = ?, is_overdue = ?
     WHERE user_id = ? AND course_id = ?`,
    [bestScore, status, isOverdue, req.user.id, courseId]
  );

  return res.json({
    score,
    bestScore,
    status,
    isOverdue,
    passed: score >= 60
  });
});

router.get("/:courseId/history", authRequired, async (req, res) => {
  const courseId = Number(req.params.courseId);
  const attempts = await query(
    `SELECT id, score, submitted_at
     FROM exam_attempts
     WHERE user_id = ? AND course_id = ?
     ORDER BY submitted_at DESC`,
    [req.user.id, courseId]
  );
  return res.json({ attempts });
});

export default router;
