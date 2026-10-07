import { useState, type DragEvent } from 'react';
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
  const [dragging, setDragging] = useState(false);

  function addFiles(list: File[]) {
    setFiles((prev) => [...prev, ...list]);
    setMsg('');
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const list = Array.from(e.dataTransfer.files ?? []);
    if (list.length) addFiles(list);
  }

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
      <p className="batch-hint">选择多张图片或一个 ZIP 压缩包，后端将逐张计算特征并返回合并特征表 CSV（供机器学习 / 分类使用）。</p>
      <div
        className={`upload${dragging ? ' dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <label className="file-btn btn-primary">
          选择文件 / 拖拽到这里
          <input
            type="file"
            multiple
            accept="image/*,.zip"
            onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }}
          />
        </label>
      </div>

      {files.length > 0 && (
        <ul className="file-list">
          {files.slice(0, 20).map((f, i) => <li key={`${f.name}-${i}`}>{f.name}</li>)}
          {files.length > 20 && <li>… 共 {files.length} 个文件</li>}
        </ul>
      )}

      <p className="batch-count">已选 {files.length} 个文件</p>
      <button className="btn-primary" onClick={run} disabled={busy}>{busy ? '处理中…' : '开始批量分析'}</button>
      {msg && <p className={`batch-msg${msg.startsWith('完成') ? ' ok' : msg.startsWith('请') || msg.startsWith('处理') ? '' : ' err'}`}>{msg}</p>}
    </section>
  );
}
