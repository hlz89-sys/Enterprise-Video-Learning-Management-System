@echo off
chcp 65001 >nul
title 企业LMS - 本地一键启动

echo [1/5] 准备后端环境...
cd /d "%~dp0..\server"
if not exist .env copy .env.example .env >nul
call npm install
if errorlevel 1 (
  echo 后端依赖安装失败
  pause
  exit /b 1
)

echo [2/5] 初始化默认账号与样例数据...
call npm run seed

echo [3/5] 启动后端服务...
start "LMS-Server" cmd /k "cd /d %~dp0..\server && npm run dev"

echo [4/5] 准备前端环境...
cd /d "%~dp0..\client"
if not exist .env copy .env.example .env >nul
call npm install
if errorlevel 1 (
  echo 前端依赖安装失败
  pause
  exit /b 1
)

echo [5/5] 启动前端服务...
start "LMS-Client" cmd /k "cd /d %~dp0..\client && npm run dev"

echo 启动完成：
echo 前端: http://localhost:5173
echo 后端: http://localhost:4000/api
pause
