# GLCM 纹理分析工具 — 设计文档

- 日期：2026-09-28
- 状态：待用户评审
- 目标：灰度共生矩阵（GLCM）纹理特征提取工具，三端交付（网页 + PWA + Windows 桌面 exe），云端部署，支持后端批量处理

---

## 1. 概述

提供一个「图像 → GLCM 矩阵 + Haralick 纹理特征提取 + 可视化」的工具：

- **单张图片**：在浏览器前端纯 JS 计算，实时出矩阵热力图与特征表，可导出。
- **批量处理**：多张图片（几百到上千张）走 Python 后端计算，导出合并特征表 CSV，供后续机器学习/分类使用。
- **三端形态**：响应式网页、PWA（可安装/离线）、Windows 桌面 exe（Electron 套壳），共用同一套前端代码。

## 2. 目标与非目标

### 目标
1. 单图交互式分析：上传 → 调参 → 矩阵热力图 → Haralick 特征表 → 导出。
2. 批量分析：上传多图/ZIP → 后端计算 → 合并特征 CSV 下载。
3. 三端交付 + 云端部署，功能一致、可访问。
4. 前端（JS）与后端（Python）的 GLCM 计算结果**完全一致**。

### 非目标（第一版不做）
- 用户账号、登录、多用户、数据持久化/云端存储。
- 深度学习/分类模型集成（GLCM 只做特征提取，输出 CSV 由用户自行喂给模型）。
- 移动端原生 App（PWA 已覆盖手机场景）。
- 视频/多光谱/3D 图像处理。

## 3. 架构

```
┌─────────────────────────────────────────────────────────┐
│                      前端（React + TS + Vite）            │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ 图片上传/预览 │  │  参数面板     │  │ 矩阵热力图     │  │
│  └──────┬───────┘  └──────┬───────┘  │ 特征表        │  │
│         │                 │          │ 导出(CSV/PNG) │  │
│         ▼                 ▼          └───────────────┘  │
│  ┌───────────────────────────────────────────┐          │
│  │  GLCM 引擎（纯 TS 模块，可单测）            │          │
│  └───────────────────────────────────────────┘          │
│         │ 单图（前端本地算，不发服务器）                    │
│         │ 批量（POST /api/batch → 后端）                  │
└─────────┼───────────────────────────────────────────────┘
          │ HTTP/HTTPS
          ▼
┌─────────────────────────────────────────────────────────┐
│                   后端（Python + FastAPI + numpy）        │
│  POST /api/batch : 上传 ZIP/多图 → 逐张算 GLCM 特征       │
│                     → 返回合并特征表 CSV                   │
│  ┌───────────────────────────────────────────┐          │
│  │  GLCM 引擎（numpy 实现，与 TS 版逐条对齐）  │          │
│  └───────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

**桌面 App**：Electron 加载前端构建产物，`electron-builder` 打 Windows 安装包。无独立后端逻辑。

**部署**：
- 前端 → Vercel（GitHub 仓库连接，推送自动部署）。
- 后端 → Render 免费层（FastAPI + Dockerfile）。
- 桌面 exe → 本地打包，GitHub Releases 分发。

## 4. 前端设计

### 4.1 技术栈
- React 18 + TypeScript + Vite
- 状态管理：组件内 `useState`/`useReducer`，不引入重型状态库
- PWA：`vite-plugin-pwa`
- 测试：Vitest
- UI 语言：中文（默认），预留英文切换

### 4.2 GLCM 引擎（`src/glcm/`，纯函数，无 UI 依赖）
三个模块，职责单一、可单测：
- `quantize.ts`：灰度量化（0–255 → Ng 级）
- `glcm.ts`：构造共生矩阵
- `haralick.ts`：由归一化矩阵计算特征

引擎对外接口（与后端 Python 版签名一一对应）：

```ts
computeGlcmFeatures(image: Uint8Array, width: number, height: number,
  opts: { levels: number; distance: number; angle: 0|45|90|135; symmetric: boolean }
): { matrix: number[][]; features: FeatureMap }
```

### 4.3 UI 组件
- `ImageUpload`：拖拽/点击/粘贴上传，自动转灰度，预览
- `ParamsPanel`：灰度级（8/16/32/64）、距离 d（1–10）、方向（0/45/90/135 单选或多选）、对称开关
- `MatrixHeatmap`：canvas 渲染 Ng×Ng 矩阵热力图，配颜色条、悬停读值
- `FeatureTable`：特征名 + 数值，支持复制
- `ExportPanel`：特征 CSV/JSON、矩阵 CSV、热力图 PNG
- `BatchTab`：批量上传 + 参数 + 调用后端 + 下载 CSV + 进度/状态显示

### 4.4 方向多选
若用户同时选多个方向（如 0/45/90/135），引擎对每个方向分别算矩阵与特征，UI 以标签页或并排展示，特征表按方向分列；默认单方向（0°）。

## 5. 后端设计

### 5.1 技术栈
- Python 3.11 + FastAPI + uvicorn
- numpy（向量化计算 GLCM）
- 依赖列表见 `requirements.txt`

### 5.2 GLCM 引擎（`app/glcm.py`）
与前端 TS 版**逐条对齐**（见第 7 节算法规格），保证单图与批量结果一致。

### 5.3 API
- `GET /health` → 健康检查
- `POST /api/batch`：multipart 上传多文件或单个 ZIP（含多图 + 可选 params.json），参数与单图一致。返回 `application/octet-stream` 的合并特征 CSV（每行一张图：`filename, 各方向特征列...`），或返回 JSON 下载链接（大结果时）。

### 5.4 一致性与对拍
用 `skimage.feature.graycomatrix` / `graycoprops` 作为**测试对拍参考**，不用于生产计算。三者（TS、Python、skimage）在测试图上的数值必须一致（允许浮点误差 < 1e-9）。

## 6. 桌面 App

- Electron 主进程加载前端 `dist/`（本地文件或打包内嵌），`main.js` 极薄：创建窗口 + 加载入口。
- `electron-builder` 打 Windows NSIS 安装包（`.exe`）。
- 已有 Node 24（`D:\app\node.exe`）满足构建要求；暂不引入 Rust/Tauri。

## 7. GLCM 算法规格（JS/Python 一致性核心）

### 7.1 转灰度（前后端一致）
- 输入已是单通道灰度：直接使用。
- 输入为彩色（RGB/RGBA）：`gray = round(0.299·R + 0.587·G + 0.114·B)`，取 0–255 整数。
- 透明通道（alpha）忽略。

### 7.2 灰度量化
输入灰度图 0–255，量化到 `Ng` 级（8/16/32/64）：
`q = clamp(floor(pixel * Ng / 256), 0, Ng-1)`

### 7.2 方向（offset）
距离 `d`，方向单位向量：
- 0° → `(0, d)`
- 45° → `(d, d)`
- 90° → `(d, 0)`
- 135° → `(-d, d)`

### 7.3 矩阵构造
`Ng × Ng` 矩阵 `G`，遍历所有满足 `(p, p+offset)` 都在图内的像素对：
`G[i][j] += 1`，其中 `i=量化(p)`，`j=量化(p+offset)`。

### 7.4 对称
若 `symmetric=true`：`G = G + Gᵀ`（等价于每个像素对正反方向各计一次）。

### 7.5 归一化
`P = G / ΣG`（概率形式，ΣP = 1）。所有特征在 `P` 上计算。

### 7.6 Haralick 特征（共 14 项）
约定 `p(i,j)=P[i][j]`，`i,j ∈ [0, Ng-1]`，`μx=Σ i·p(i,j)`，`μy=Σ j·p(i,j)`，
`σx²=Σ (i-μx)²·p(i,j)`，`σy²` 同理，`0·ln0 = 0`：

| # | 特征 | 公式 |
|---|------|------|
| 1 | 对比度 Contrast | `Σ (i-j)²·p(i,j)` |
| 2 | 相异性 Dissimilarity | `Σ \|i-j\|·p(i,j)` |
| 3 | 同质性 Homogeneity | `Σ p(i,j)/(1+(i-j)²)` |
| 4 | 能量/角二阶矩 ASM | `Σ p(i,j)²` |
| 5 | 熵 Entropy | `-Σ p(i,j)·ln(p(i,j))` |
| 6 | 相关性 Correlation | `Σ ((i-μx)(j-μy)·p(i,j))/(σx·σy)` |
| 7 | 均值 Mean | `(μx+μy)/2` |
| 8 | 方差 Variance | `(σx²+σy²)/2` |
| 9 | 最大概率 Max Probability | `max(p(i,j))` |
| 10 | 聚类阴影 Cluster Shade | `Σ (i+j-μx-μy)³·p(i,j)` |
| 11 | 聚类突出 Cluster Prominence | `Σ (i+j-μx-μy)⁴·p(i,j)` |
| 12 | 逆差 Inverse Difference | `Σ p(i,j)/(1+\|i-j\|)` |
| 13 | 和平均 Sum Average | `Σ k·pₓ₊ᵧ(k)`，k=2..2(Ng-1) |
| 14 | 和熵 Sum Entropy | `-Σ pₓ₊ᵧ(k)·ln(pₓ₊ᵧ(k))` |

> 相关性为 0/0（σx·σy=0）时定义为 0。`pₓ₊ᵧ(k)=Σ_{i+j=k} p(i,j)`。

### 7.7 黄金测试值
- 用一张固定的小测试图（4×4，Haralick 1973 示例）和一张 5×5 随机种子图，在 TS、Python、skimage 三处计算并断言一致。
- 具体期望值在实现阶段计算并固定进测试（golden values），作为回归基准。

## 8. 数据流

### 8.1 单图流程（纯前端）
1. 用户上传图片 → 前端解码 + 转灰度（uint8）
2. 用户调参（levels/distance/angle/symmetric）
3. 前端引擎 `computeGlcmFeatures` 计算
4. 渲染矩阵热力图 + 特征表
5. 用户导出 CSV/JSON/PNG

### 8.2 批量流程（走后端）
1. 用户切到批量页，上传多图或 ZIP，设置参数
2. 前端 `POST /api/batch`（multipart）
3. 后端逐张：解码 → 量化 → 矩阵 → 特征
4. 后端汇总为 CSV，返回下载
5. 前端展示进度/完成状态，触发下载

## 9. 错误处理

- 前端：非图片文件、解码失败、超大图 → 明确中文提示；参数非法值 → 前端校验拦截。
- 后端：上传非图片/损坏文件 → 跳过并记录到结果（CSV 中标注 `error`），不中断整批；整批失败 → HTTP 4xx + JSON 错误信息；请求过大 → 413。
- 批量子集失败：逐文件 try/except，结果行标注错误原因，其余正常返回。

## 10. 测试策略

- 前端引擎：Vitest 单测（量化边界、矩阵构造、14 项特征、对称、方向、黄金值）。
- 后端引擎：pytest（同上 + 与 skimage 对拍）。
- 一致性：同一测试图在 TS 与 Python 输出 diff = 0（< 1e-9）。
- 接口：pytest 起 TestClient 测 `/health`、`/api/batch`（正常、空、损坏文件、超大）。
- 手工验收：三端各跑一遍单图 + 批量流程。

## 11. 目录结构

```
glcm-tool/
├── frontend/            # React + TS + Vite + PWA
│   ├── src/
│   │   ├── glcm/        # quantize.ts / glcm.ts / haralick.ts
│   │   ├── components/  # 上传/参数/热力图/特征表/导出/批量
│   │   ├── app/         # 页面与路由
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts   # + vite-plugin-pwa
│   └── package.json
├── backend/             # FastAPI
│   ├── app/             # glcm.py / main.py / schemas.py
│   ├── tests/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── render.yaml
├── desktop/             # Electron 壳
│   ├── main.js
│   └── package.json
├── docs/superpowers/specs/  # 本文档
└── README.md
```

## 12. 里程碑顺序

1. **M1**：前端 GLCM 引擎（TS）+ 单测 + 黄金值对齐
2. **M2**：单图 UI（上传/参数/热力图/特征表/导出）
3. **M3**：后端 GLCM 引擎（Python）+ pytest 对拍 skimage
4. **M4**：批量 API + 前端批量页
5. **M5**：PWA 配置 + Electron 打包 exe
6. **M6**：部署（Vercel 前端 + Render 后端）+ 三端验收

## 13. 开放问题

- 无（技术选型已锁定；部署账号由用户在部署阶段提供）。
