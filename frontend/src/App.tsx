import { useState } from 'react';
import ImageUpload from './components/ImageUpload';

export default function App() {
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <main className="app">
      <h1>GLCM 纹理分析工具</h1>
      <ImageUpload onImage={(_g, _w, _h, url) => setPreview(url)} />
      {preview && <img src={preview} alt="预览" style={{ maxWidth: '100%', maxHeight: 320 }} />}
    </main>
  );
}
