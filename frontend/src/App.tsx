import { useMemo, useRef, useState } from 'react';
import ImageUpload from './components/ImageUpload';
import ParamsPanel, { type ParamState } from './components/ParamsPanel';
import MatrixHeatmap from './components/MatrixHeatmap';
import FeatureTable from './components/FeatureTable';
import FeatureChart from './components/FeatureChart';
import ExportPanel, { type ResultRow } from './components/ExportPanel';
import BatchTab from './components/BatchTab';
import InfoSection from './components/InfoSection';
import RoiSelector, { type RoiRect, type RoiRegion } from './components/RoiSelector';
import { COLORMAPS, type ColormapId } from './colormaps';
import { computeGlcmFeatures, rgbaToGray } from './glcm';

interface ImageData {
  gray: Uint8Array;
  width: number;
  height: number;
  previewUrl: string;
  name: string;
}

interface RegionResult {
  id: string;
  label: string;
  color: string;
  width: number;
  height: number;
  rows: ResultRow[];
}

type SampleKind = 'checker' | 'stripes' | 'texture';

const REGION_COLORS = ['#f43f5e', '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];
const FULL_COLOR = '#6366f1';

// 内置示例纹理（无需上传即可体验），返回与上传一致的灰度数组与预览
function syntheticSample(kind: SampleKind): ImageData {
  const size = 240;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const image = ctx.createImageData(size, size);
  const d = image.data;
  const cell = 16;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let v: number;
      if (kind === 'checker') {
        v = (Math.floor(x / cell) + Math.floor(y / cell)) % 2 === 0 ? 45 : 215;
      } else if (kind === 'stripes') {
        v = Math.floor(x / cell) % 2 === 0 ? 35 : 225;
      } else {
        v = Math.max(0, Math.min(255, Math.round(127 + 100 * Math.sin((x + y) / 9) + 45 * Math.sin(x / 3))));
      }
      const i = (y * size + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const data = ctx.getImageData(0, 0, size, size).data;
  return {
    gray: rgbaToGray(data, size, size),
    width: size,
    height: size,
    previewUrl: canvas.toDataURL('image/png'),
    name: kind === 'checker' ? '棋盘纹理' : kind === 'stripes' ? '条纹纹理' : '随机纹理',
  };
}

// 从全图灰度数组中裁出 ROI 子区域
function cropGray(gray: Uint8Array, width: number, roi: RoiRect): Uint8Array {
  const out = new Uint8Array(roi.w * roi.h);
  for (let r = 0; r < roi.h; r++) {
    const src = (roi.y + r) * width + roi.x;
    out.set(gray.subarray(src, src + roi.w), r * roi.w);
  }
  return out;
}

export default function App() {
  const [tab, setTab] = useState<'single' | 'batch'>('single');
  const [img, setImg] = useState<ImageData | null>(null);
  const [params, setParams] = useState<ParamState>({ levels: 16, distance: 1, angles: [0], symmetric: true });
  const [rois, setRois] = useState<RoiRegion[]>([]);
  const [viewRegionId, setViewRegionId] = useState('full');
  const [colormap, setColormap] = useState<ColormapId>('viridis');
  const roiCounter = useRef(0);
  const heatmapCanvases = useRef<Record<string, HTMLCanvasElement | null>>({});

  // 分析目标：全图 + 各 ROI 裁剪子图
  const targets = useMemo(() => {
    if (!img) return [];
    const list = [
      { id: 'full', label: '全图', color: FULL_COLOR, gray: img.gray, width: img.width, height: img.height },
    ];
    for (const r of rois) {
      list.push({
        id: r.id,
        label: r.label,
        color: r.color,
        gray: cropGray(img.gray, img.width, r.roi),
        width: r.roi.w,
        height: r.roi.h,
      });
    }
    return list;
  }, [img, rois]);

  const resultsByRegion: RegionResult[] = useMemo(() => {
    return targets.map((t) => ({
      id: t.id,
      label: t.label,
      color: t.color,
      width: t.width,
      height: t.height,
      rows: params.angles.map((angle) => {
        const r = computeGlcmFeatures(t.gray, t.width, t.height, {
          levels: params.levels, distance: params.distance, angle, symmetric: params.symmetric,
        });
        return { angle, matrix: r.matrix, features: r.features };
      }),
    }));
  }, [targets, params]);

  const viewRegion = resultsByRegion.find((r) => r.id === viewRegionId) ?? resultsByRegion[0];

  function loadImage(data: ImageData) {
    setImg(data);
    setRois([]);
    setViewRegionId('full');
    roiCounter.current = 0;
  }

  function addRegion(roi: RoiRect) {
    roiCounter.current += 1;
    const n = roiCounter.current;
    const region: RoiRegion = {
      id: `roi-${Date.now()}-${n}`,
      label: `区域 ${n}`,
      roi,
      color: REGION_COLORS[(n - 1) % REGION_COLORS.length],
    };
    setRois((prev) => [...prev, region]);
    setViewRegionId(region.id);
  }

  function removeRegion(id: string) {
    setRois((prev) => prev.filter((r) => r.id !== id));
    setViewRegionId((cur) => (cur === id ? 'full' : cur));
  }

  const paramsPanel = <ParamsPanel value={params} onChange={setParams} />;

  return (
    <main className="app">
      <header className="hero">
        <div className="container hero-inner">
          <h1>GLCM 纹理分析工具</h1>
          <p className="subtitle">灰度共生矩阵（Gray-Level Co-occurrence Matrix）· 14 项 Haralick 纹理特征提取与可视化</p>
          <div className="hero-tags">
            <span className="tag">单图前端本地计算</span>
            <span className="tag">批量后端处理</span>
            <span className="tag">网页 / PWA / 桌面端</span>
          </div>
        </div>
      </header>

      <div className="container">
        <nav className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'single'} onClick={() => setTab('single')} className={tab === 'single' ? 'active' : ''}>
            单图分析
          </button>
          <button role="tab" aria-selected={tab === 'batch'} onClick={() => setTab('batch')} className={tab === 'batch' ? 'active' : ''}>
            批量分析
          </button>
        </nav>

        {tab === 'single' ? (
          <div className="workspace">
            <section className="card">
              <h2>① 上传图片</h2>
              <ImageUpload onImage={(gray, width, height, url, name) => loadImage({ gray, width, height, previewUrl: url, name })} />
              {!img && (
                <div className="samples">
                  <span className="samples-hint">没有图片？试试内置示例：</span>
                  <button onClick={() => loadImage(syntheticSample('checker'))}>棋盘纹理</button>
                  <button onClick={() => loadImage(syntheticSample('stripes'))}>条纹纹理</button>
                  <button onClick={() => loadImage(syntheticSample('texture'))}>随机纹理</button>
                </div>
              )}
            </section>

            {img && viewRegion && (
              <div className="layout">
                <aside className="left">
                  <section className="card">
                    <h2>预览与选图</h2>
                    <RoiSelector
                      previewUrl={img.previewUrl}
                      width={img.width}
                      height={img.height}
                      regions={rois}
                      onAdd={addRegion}
                      onRemove={removeRegion}
                    />
                    <div className="region-select">
                      <button className={`region-btn${viewRegion.id === 'full' ? ' on' : ''}`} onClick={() => setViewRegionId('full')}>
                        <span className="region-dot" style={{ background: FULL_COLOR }} />
                        全图
                      </button>
                      {rois.map((r) => (
                        <button key={r.id} className={`region-btn${viewRegion.id === r.id ? ' on' : ''}`} onClick={() => setViewRegionId(r.id)}>
                          <span className="region-dot" style={{ background: r.color }} />
                          {r.label}
                        </button>
                      ))}
                    </div>
                    <dl className="meta">
                      <div><dt>图片</dt><dd>{img.name}</dd></div>
                      <div><dt>尺寸</dt><dd>{img.width} × {img.height} px</dd></div>
                      <div><dt>当前范围</dt><dd>{viewRegion.id === 'full' ? '全图' : `${viewRegion.label} ${viewRegion.width}×${viewRegion.height}`}</dd></div>
                      <div><dt>灰度级</dt><dd>{params.levels} 级</dd></div>
                      <div><dt>矩阵</dt><dd>{params.levels} × {params.levels}</dd></div>
                    </dl>
                  </section>
                  <section className="card">
                    <h2>参数</h2>
                    {paramsPanel}
                  </section>
                </aside>
                <section className="right">
                  <section className="card">
                    <h2>
                      灰度共生矩阵
                      <span className="range-badge" style={{ color: '#fff', background: viewRegion.color }}>{viewRegion.label}</span>
                    </h2>
                    <div className="heatmap-controls">
                      <label className="cmap-label">
                        颜色表
                        <select className="cmap-select" value={colormap} onChange={(e) => setColormap(e.target.value as ColormapId)}>
                          {COLORMAPS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                        </select>
                      </label>
                    </div>
                    {resultsByRegion.map((rg) => (
                      <div key={rg.id} className={`heatmap-group${rg.id === viewRegion.id ? '' : ' hidden'}`}>
                        {rg.rows.map((r) => (
                          <MatrixHeatmap
                            key={`${rg.id}:${r.angle}`}
                            ref={(el) => { heatmapCanvases.current[`${rg.id}:${r.angle}`] = el; }}
                            matrix={r.matrix}
                            title={`${rg.label} · GLCM 矩阵（${r.angle}°）`}
                            colormap={colormap}
                          />
                        ))}
                      </div>
                    ))}
                  </section>
                  <FeatureChart rows={viewRegion.rows} label={viewRegion.label} />
                  <section className="card">
                    <h2>特征值（全图 vs 区域对照）</h2>
                    <FeatureTable regions={resultsByRegion} />
                  </section>
                  <section className="card">
                    <h2>导出结果</h2>
                    <ExportPanel
                      regions={resultsByRegion}
                      imageName={img.name}
                      getHeatmapCanvas={(regionId, angle) => heatmapCanvases.current[`${regionId}:${angle}`] ?? null}
                    />
                  </section>
                </section>
              </div>
            )}
          </div>
        ) : (
          <div className="workspace">
            <div className="layout">
              <aside className="left">
                <section className="card">
                  <h2>参数</h2>
                  {paramsPanel}
                </section>
              </aside>
              <section className="right">
                <section className="card">
                  <h2>批量分析</h2>
                  <BatchTab levels={params.levels} distance={params.distance} angles={params.angles} symmetric={params.symmetric} />
                </section>
              </section>
            </div>
          </div>
        )}

        <InfoSection />
      </div>
    </main>
  );
}
