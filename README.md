# GLCM 纹理分析工具

灰度共生矩阵（GLCM）+ Haralick 纹理特征提取工具。三端：网页 / PWA / Windows 桌面 exe。

## 目录
- `frontend/` — React + TS + Vite（单图前端 + PWA）
- `backend/` — FastAPI（批量分析）
- `desktop/` — Electron 壳

## 本地开发
前端：`cd frontend && npm install && npm run dev`

后端（需 Python ≥ 3.13）：
`cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8000`

本地前端批量分析指向本地后端时，在 `frontend/.env` 里设 `VITE_API_BASE=http://127.0.0.1:8000`。

## 测试
前端：`cd frontend && npm test`
后端：`cd backend && python -m pytest -q`

## 部署
### 前端 → Vercel
1. 把本仓库推到 GitHub。
2. Vercel 导入仓库，Framework Preset 选 Vite，Root Directory 填 `frontend`。
3. 环境变量 `VITE_API_BASE` 填后端地址（如 `https://glcm-backend.onrender.com`）。
4. Deploy，得到 `https://xxx.vercel.app`。

### 后端 → Render
两种方式任选：
- **Blueprint 一键部署**：连接同一 GitHub 仓库后选 Blueprint，会自动读取仓库根的 `render.yaml`（已配 `rootDir: backend`）。
- **手动 Web Service**：Render 新建 Web Service，连接同一仓库，Root Directory 填 `backend`，Runtime 选 Docker（自动识别 `backend/Dockerfile`），Plan 选 Free。

Deploy 后得到 `https://glcm-backend.onrender.com`（免费层首次唤醒约几十秒）。

### 桌面 exe
`cd desktop && npm install && npm run dist`（`dist` 会自动先构建前端 `frontend/dist`），产物在 `desktop/dist/`，发布到 GitHub Releases。

## 参数说明
灰度级 8/16/32/64；距离 1–10；方向 0/45/90/135；对称开关。
14 项 Haralick 特征见 `docs/superpowers/specs/2026-09-28-glcm-tool-design.md`。
