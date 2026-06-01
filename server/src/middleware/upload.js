import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = process.env.UPLOAD_DIR || "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});

function fileFilter(_req, file, cb) {
  if (!file.mimetype.startsWith("video/")) {
    return cb(new Error("仅支持视频文件上传"));
  }
  return cb(null, true);
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 1024 * 1024 * 1024 }
});
