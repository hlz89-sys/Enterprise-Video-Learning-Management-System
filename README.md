# 企业内部视频学习管理系统（LMS）

基于 `React + Node.js(Express) + MySQL + JWT` 的企业培训学习系统，支持本地视频与外链视频、学习行为强约束、考试评估、后台统计与绩效接口。

## 1. 项目结构

```text
.
├─ client/                  # React 前端
│  ├─ src/
│  │  ├─ pages/            # 学员端/管理员端页面
│  │  ├─ context/          # 登录态管理
│  │  ├─ components/
│  │  ├─ api.js
│  │  └─ styles.css
│  ├─ Dockerfile
│  └─ nginx/default.conf
├─ server/                  # Express 后端
│  ├─ src/
│  │  ├─ routes/           # auth/courses/learning/exams/admin/performance
│  │  ├─ middleware/
│  │  ├─ config/db.js
│  │  ├─ utils/status.js
│  │  ├─ scripts/seed.js
│  │  └─ app.js
│  ├─ uploads/             # 本地视频存储目录
│  └─ Dockerfile
├─ database/init.sql        # 数据库初始化脚本
└─ deploy/docker-compose.yml
```

## 2. 核心业务约束（已实现）

1. 不看完不能考试：
`progress < 90%` 时前端隐藏考试入口，后端 `/api/exams/:courseId/questions` 和 `/submit` 双重拦截。

2. 不考试不算完成：
课程完成条件由后端统一判定：`progress >= 90 && exam_score >= 60`。

3. 未完成计入绩效：
每次进度/考试更新时自动比对课程 `deadline`，未完成且超期则 `is_overdue = 1`。

4. 防伪造进度（基础版）：
后端校验进度增长速度和播放位置跳跃幅度，拦截异常上报；前端本地视频限制快进拖拽。

## 3. 本地部署（开发模式）

### 3.1 启动 MySQL 并初始化

```sql
-- 执行 database/init.sql
```

### 3.2 启动后端

```bash
cd server
cp .env.example .env
npm install
npm run seed
npm run dev
```

### 3.3 启动前端

```bash
cd client
npm install
npm run dev
```

访问地址：
- 前端: `http://localhost:5173`
- 后端: `http://localhost:4000`

默认账号（`npm run seed` 后）：
- 管理员: `admin / Admin@123`
- 学员: `student1 / Student@123`

## 4. Docker 部署（推荐）

```bash
cd deploy
docker compose up -d --build
```

访问地址：
- 前端: `http://localhost:8080`
- 后端 API: `http://localhost:4000/api`

容器首次启动会自动执行 `database/init.sql`。
如果需要初始化账号与样例题库，可进入 `server` 容器执行 `npm run seed`。

## 5. 关键接口

- 登录：`POST /api/auth/login`
- 课程列表：`GET /api/courses`
- 上传本地视频（管理员）：`POST /api/courses/upload`
- 进度上报：`POST /api/learning/:courseId/progress`
- 获取试题（需进度≥90）：`GET /api/exams/:courseId/questions`
- 提交考试：`POST /api/exams/:courseId/submit`
- 管理看板：`GET /api/admin/dashboard`
- 导出报表：`GET /api/admin/export`
- 绩效接口（HR）：`GET /api/performance/hr`

## 6. 已覆盖的增强功能

- 学习提醒能力基础：可直接扩展为定时任务（当前预留后端结构）
- 排行榜接口：`GET /api/performance/leaderboard`
- 视频防拖拽：本地视频页面已限制快进
- 管理员备注字段：`learning_records.admin_remark`
