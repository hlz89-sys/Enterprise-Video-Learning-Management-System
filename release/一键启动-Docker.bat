@echo off
chcp 65001 >nul
title 企业LMS - Docker一键启动

echo [1/3] 进入部署目录...
cd /d "%~dp0..\deploy"

echo [2/3] 构建并启动容器（首次会较慢）...
docker compose up -d --build
if errorlevel 1 (
  echo 启动失败，请确认 Docker Desktop 已启动，并重试。
  pause
  exit /b 1
)

echo [3/3] 启动成功
echo 前端地址: http://localhost:8080
echo 后端地址: http://localhost:4000/api
echo.
echo 如需初始化默认账号，请执行：
echo docker exec -it lms-server npm run seed
pause
