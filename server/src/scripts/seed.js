import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { query, pool } from "../config/db.js";

dotenv.config();

async function upsertUser(name, password, role) {
  const hash = await bcrypt.hash(password, 10);
  await query(
    `INSERT INTO users(name, password, role)
     VALUES(?,?,?)
     ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role)`,
    [name, hash, role]
  );
}

async function seed() {
  await upsertUser("admin", "Admin@123", "admin");
  await upsertUser("student1", "Student@123", "student");
  await upsertUser("student2", "Student@123", "student");

  await query(
    `INSERT INTO courses(title, video_url, type, deadline)
     VALUES
     ('安全施工规范培训', 'https://www.youtube.com/embed/dQw4w9WgXcQ', 'external', DATE_ADD(CURDATE(), INTERVAL 7 DAY)),
     ('设备操作基础', 'https://v.qq.com', 'external', DATE_ADD(CURDATE(), INTERVAL 10 DAY))
     ON DUPLICATE KEY UPDATE title = VALUES(title)`
  );

  const courses = await query("SELECT id, title FROM courses");
  const byTitle = new Map(courses.map((c) => [c.title, c.id]));

  const q1 = byTitle.get("安全施工规范培训");
  const q2 = byTitle.get("设备操作基础");

  if (q1) {
    await query("DELETE FROM exams WHERE course_id = ?", [q1]);
    await query(
      `INSERT INTO exams(course_id, question, options, correct_answer, type)
       VALUES
       (?, '进入施工现场必须佩戴？', '["安全帽","拖鞋","耳机","墨镜"]', '["安全帽"]', 'single'),
       (?, '高空作业前应进行哪些检查？', '["安全带","作业平台稳定","天气风险","以上都要"]', '["以上都要"]', 'single')`,
      [q1, q1]
    );
  }

  if (q2) {
    await query("DELETE FROM exams WHERE course_id = ?", [q2]);
    await query(
      `INSERT INTO exams(course_id, question, options, correct_answer, type)
       VALUES
       (?, '设备开机前需确认？', '["电源连接","防护装置","周围环境安全","以上都要"]', '["以上都要"]', 'single'),
       (?, '下列属于正确停机步骤的是？', '["直接断电","按流程停机","记录设备状态","按流程停机","记录设备状态"]', '["按流程停机","记录设备状态"]', 'multi')`,
      [q2, q2]
    );
  }

  console.log("Seed 完成");
}

seed()
  .catch((e) => {
    console.error("Seed 失败:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
