import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { query } from "../config/db.js";
import { authRequired } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "12h" }
  );
}

router.post("/login", async (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ message: "用户名和密码必填" });
  }

  const rows = await query("SELECT id, name, password, role FROM users WHERE name = ?", [name]);
  if (!rows.length) return res.status(401).json({ message: "账号或密码错误" });

  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: "账号或密码错误" });

  const token = signToken(user);
  return res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});

router.post("/register", authRequired, requireRole("admin"), async (req, res) => {
  const { name, password, role = "student" } = req.body;
  if (!name || !password) {
    return res.status(400).json({ message: "用户名和密码必填" });
  }
  if (!["admin", "student"].includes(role)) {
    return res.status(400).json({ message: "角色不合法" });
  }

  const exists = await query("SELECT id FROM users WHERE name = ?", [name]);
  if (exists.length) return res.status(409).json({ message: "用户名已存在" });

  const hash = await bcrypt.hash(password, 10);
  await query("INSERT INTO users(name, password, role) VALUES(?,?,?)", [name, hash, role]);
  return res.status(201).json({ message: "创建成功" });
});

router.get("/me", authRequired, async (req, res) => {
  return res.json({ user: req.user });
});

export default router;
