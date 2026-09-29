import { useState } from 'react';
import { API_BASE } from '../config';

interface Props {
  levels: number;
  distance: number;
  angles: number[];
  symmetric: boolean;
}

export default function BatchTab({ levels, distance, angles, symmetric }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function run() {
    if (!files.length) { setMsg('请先选择文件'); return; }
    setBusy(true);
    setMsg('处理中…');
    const fd = new FormData();
    for (const f of files) fd.append('files', f);
    fd.append('levels', String(levels));
    fd.append('distance', String(distance));
    fd.append('angles', angles.join(','));
    fd.append('symmetric', String(symmetric));
    try {
      const resp = await fetch(`${API_BASE}/api/batch`, { method: 'POST', body: fd });
      if (!resp.ok) {
        const err = await resp.text();
        setMsg(`失败（${resp.status}）：${err}`);
        return;
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'glcm_features.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMsg('完成，已下载 CSV');
    } catch (e) {
      setMsg(`请求出错：${String(e)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="batch">
      <input type="file" multiple accept="image/*,.zip" onChange={(e) => setFiles(Array.from(e.target.files ?? []))} />
      <p>已选 {files.length} 个文件</p>
      <button onClick={run} disabled={busy}>{busy ? '处理中…' : '开始批量分析'}</button>
      <p>{msg}</p>
    </section>
  );
}
