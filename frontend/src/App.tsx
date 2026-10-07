import { useMemo, useRef, useState } from 'react';
import ImageUpload from './components/ImageUpload';
import ParamsPanel, { type ParamState } from './components/ParamsPanel';
import MatrixHeatmap from './components/MatrixHeatmap';
import FeatureTable from './components/FeatureTable';
import FeatureChart from './components/FeatureChart';
import ExportPanel, { type ResultRow } from './components/ExportPanel';
import BatchTab from './components/BatchTab';
import InfoSection from './components/InfoSection';
import RoiSelector, { type RoiRect } from './components/RoiSelector';
import { computeGlcmFeatures, rgbaToGray } from './glcm';

interface ImageData {
  gray: Uint8Array;
  width: number;
  height: number;
  previewUrl: string;
  name: string;
}

type SampleKind = 'checker' | 'stripes' | 'texture';

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
  const [roi, setRoi] = useState<RoiRect | null>(null);
  const [mode, setMode] = useState<'full' | 'roi'>('full');
  const heatmapCanvases = useRef<Record<number, HTMLCanvasElement | null>>({});

  const roiActive = mode === 'roi' && roi !== null;

  // 分析所用灰度数据：全图或 ROI 子区域
  const src = useMemo(() => {
    if (!img) return null;
    if (roiActive && roi) {
      return { gray: cropGray(img.gray, img.width, roi), width: roi.w, height: roi.h };
    }
    return { gray: img.gray, width: img.width, height: img.height };
  }, [img, roiActive, roi]);

  const results: ResultRow[] = useMemo(() => {
    if (!src) return [];
    return params.angles.map((angle) => {
      const r = computeGlcmFeatures(src.gray, src.width, src.height, {
        levels: params.levels, distance: params.distance, angle, symmetric: params.symmetric,
      });
      return { angle, matrix: r.matrix, features: r.features };
    });
  }, [src, params]);

  const getHeatmapCanvas = (angle: number) => heatmapCanvases.current[angle] ?? null;

  function loadImage(data: ImageData) {
    setImg(data);
    setRoi(null);
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

            {img && (
              <div className="layout">
                <aside className="left">
                  <section className="card">
                    <h2>预览与选图</h2>
                    <div className="mode-toggle">
                      <button className={mode === 'full' ? 'on' : ''} onClick={() => setMode('full')}>全图分析</button>
                      <button className={mode === 'roi' ? 'on' : ''} onClick={() => setMode('roi')}>局部分析</button>
                    </div>
                    <RoiSelector
                      previewUrl={img.previewUrl}
                      width={img.width}
                      height={img.height}
                      roi={roi}
                      onSelect={setRoi}
                    />
                    {mode === 'roi' && !roi && <p className="error">请先在预览图上框选局部区域</p>}
                    <dl className="meta">
                      <div><dt>图片</dt><dd>{img.name}</dd></div>
                      <div><dt>尺寸</dt><dd>{img.width} × {img.height} px</dd></div>
                      <div><dt>分析范围</dt><dd>{roiActive && roi ? `局部 ${roi.w}×${roi.h}` : '全图'}</dd></div>
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
                      {roiActive && roi && <span className="range-badge">局部 {roi.w}×{roi.h}</span>}
                    </h2>
                    {results.map((r) => (
                      <MatrixHeatmap
                        key={r.angle}
                        ref={(el) => { heatmapCanvases.current[r.angle] = el; }}
                        matrix={r.matrix}
                        title={`GLCM 矩阵（${r.angle}°）`}
                      />
                    ))}
                  </section>
                  <FeatureChart rows={results} />
                  <section className="card">
                    <h2>特征值</h2>
                    <FeatureTable rows={results} />
                  </section>
                  <section className="card">
                    <h2>导出结果</h2>
                    <ExportPanel results={results} imageName={roiActive && roi ? `${img.name}_局部` : img.name} getHeatmapCanvas={getHeatmapCanvas} />
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
