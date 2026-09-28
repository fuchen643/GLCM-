import { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import ParamsPanel, { type ParamState } from './components/ParamsPanel';
import MatrixHeatmap from './components/MatrixHeatmap';
import { computeGlcmFeatures } from './glcm';

export default function App() {
  const [preview, setPreview] = useState<string | null>(null);
  const [image, setImage] = useState<{ gray: Uint8Array; width: number; height: number } | null>(null);
  const [params, setParams] = useState<ParamState>({ levels: 16, distance: 1, angles: [0], symmetric: true });

  const result = image
    ? computeGlcmFeatures(image.gray, image.width, image.height, {
        levels: params.levels,
        distance: params.distance,
        angle: params.angles[0],
        symmetric: params.symmetric,
      })
    : null;

  return (
    <main className="app">
      <h1>GLCM 纹理分析工具</h1>
      <ImageUpload onImage={(gray, width, height, url) => { setPreview(url); setImage({ gray, width, height }); }} />
      {preview && <img src={preview} alt="预览" style={{ maxWidth: '100%', maxHeight: 320 }} />}
      <ParamsPanel value={params} onChange={setParams} />
      {result && <MatrixHeatmap matrix={result.matrix} title="GLCM 矩阵" />}
    </main>
  );
}
