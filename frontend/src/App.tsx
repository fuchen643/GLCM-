import { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import ParamsPanel, { type ParamState } from './components/ParamsPanel';
import MatrixHeatmap from './components/MatrixHeatmap';
import FeatureTable from './components/FeatureTable';
import ExportPanel, { type ResultRow } from './components/ExportPanel';
import { computeGlcmFeatures } from './glcm';

export default function App() {
  const [preview, setPreview] = useState<string | null>(null);
  const [image, setImage] = useState<{ gray: Uint8Array; width: number; height: number; name: string } | null>(null);
  const [params, setParams] = useState<ParamState>({ levels: 16, distance: 1, angles: [0], symmetric: true });

  const results: ResultRow[] = image
    ? params.angles.map((angle) => {
        const r = computeGlcmFeatures(image.gray, image.width, image.height, {
          levels: params.levels, distance: params.distance, angle, symmetric: params.symmetric,
        });
        return { angle, matrix: r.matrix, features: r.features };
      })
    : [];

  return (
    <main className="app">
      <h1>GLCM 纹理分析工具</h1>
      <ImageUpload onImage={(gray, width, height, url, name) => { setPreview(url); setImage({ gray, width, height, name }); }} />
      {preview && <img src={preview} alt="预览" style={{ maxWidth: '100%', maxHeight: 320 }} />}
      <ParamsPanel value={params} onChange={setParams} />
      {results.map((r) => (
        <MatrixHeatmap key={r.angle} matrix={r.matrix} title={`GLCM 矩阵（${r.angle}°）`} />
      ))}
      <FeatureTable rows={results} />
      <ExportPanel results={results} imageName={image?.name ?? 'image'} />
    </main>
  );
}
