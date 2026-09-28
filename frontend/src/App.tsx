import { useState } from 'react';
import ImageUpload from './components/ImageUpload';
import ParamsPanel, { type ParamState } from './components/ParamsPanel';

export default function App() {
  const [preview, setPreview] = useState<string | null>(null);
  const [params, setParams] = useState<ParamState>({ levels: 16, distance: 1, angles: [0], symmetric: true });
  return (
    <main className="app">
      <h1>GLCM 纹理分析工具</h1>
      <ImageUpload onImage={(_g, _w, _h, url) => setPreview(url)} />
      {preview && <img src={preview} alt="预览" style={{ maxWidth: '100%', maxHeight: 320 }} />}
      <ParamsPanel value={params} onChange={setParams} />
    </main>
  );
}
