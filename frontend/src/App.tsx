import { useMemo, useRef, useState } from 'react';
import ImageUpload from './components/ImageUpload';
import ParamsPanel, { type ParamState } from './components/ParamsPanel';
import MatrixHeatmap from './components/MatrixHeatmap';
import FeatureTable from './components/FeatureTable';
import ExportPanel, { type ResultRow } from './components/ExportPanel';
import { computeGlcmFeatures } from './glcm';

interface ImageData {
  gray: Uint8Array;
  width: number;
  height: number;
  previewUrl: string;
  name: string;
}

export default function App() {
  const [img, setImg] = useState<ImageData | null>(null);
  const [params, setParams] = useState<ParamState>({ levels: 16, distance: 1, angles: [0], symmetric: true });
  const heatmapCanvases = useRef<Record<number, HTMLCanvasElement | null>>({});

  const results: ResultRow[] = useMemo(() => {
    if (!img) return [];
    return params.angles.map((angle) => {
      const r = computeGlcmFeatures(img.gray, img.width, img.height, {
        levels: params.levels, distance: params.distance, angle, symmetric: params.symmetric,
      });
      return { angle, matrix: r.matrix, features: r.features };
    });
  }, [img, params]);

  const getHeatmapCanvas = (angle: number) => heatmapCanvases.current[angle] ?? null;

  return (
    <main className="app">
      <h1>GLCM 纹理分析工具</h1>
      <ImageUpload onImage={(gray, width, height, url, name) => setImg({ gray, width, height, previewUrl: url, name })} />
      {img && (
        <div className="layout">
          <aside className="left">
            <img src={img.previewUrl} alt="预览" />
            <ParamsPanel value={params} onChange={setParams} />
          </aside>
          <section className="right">
            {results.map((r) => (
              <div key={r.angle}>
                <MatrixHeatmap
                  ref={(el) => { heatmapCanvases.current[r.angle] = el; }}
                  matrix={r.matrix}
                  title={`GLCM 矩阵（${r.angle}°）`}
                />
              </div>
            ))}
            <FeatureTable rows={results} />
            <ExportPanel results={results} imageName={img.name} getHeatmapCanvas={getHeatmapCanvas} />
          </section>
        </div>
      )}
    </main>
  );
}
