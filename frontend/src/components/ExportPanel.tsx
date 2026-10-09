import { Fragment } from 'react';
import { FEATURE_KEYS } from '../glcm';

export interface ResultRow {
  angle: number;
  matrix: number[][];
  features: Record<string, number>;
}

export interface ExportRegion {
  id: string;
  label: string;
  color: string;
  rows: ResultRow[];
}

interface Props {
  regions: ExportRegion[];
  imageName: string;
  getHeatmapCanvas?: (regionId: string, angle: number) => HTMLCanvasElement | null;
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function safe(s: string) {
  return s.replace(/[\\/:*?"<>|]/g, '_');
}

export default function ExportPanel({ regions, imageName, getHeatmapCanvas }: Props) {
  // 合并特征表：包含 region 与 angle 两列，供机器学习 / 对比使用
  function csvFeatures() {
    const header = ['region', 'angle', ...FEATURE_KEYS];
    const lines = regions.flatMap((rg) =>
      rg.rows.map((r) => [rg.label, r.angle, ...FEATURE_KEYS.map((k) => r.features[k])])
    );
    return [header.join(','), ...lines.map((l) => l.join(','))].join('\n');
  }

  function jsonFeatures() {
    return JSON.stringify(
      regions.map((rg) => ({
        region: rg.label,
        rows: rg.rows.map((r) => ({ angle: r.angle, matrix: r.matrix, features: r.features })),
      })),
      null, 2
    );
  }

  function csvMatrix(regionId: string, angle: number) {
    const rg = regions.find((x) => x.id === regionId);
    const r = rg?.rows.find((x) => x.angle === angle);
    if (!r) return '';
    return r.matrix.map((row) => row.join(',')).join('\n');
  }

  function png(regionId: string, angle: number) {
    const c = getHeatmapCanvas?.(regionId, angle);
    if (!c) return;
    const rg = regions.find((x) => x.id === regionId);
    const dataUrl = c.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${safe(imageName)}_${safe(rg?.label ?? regionId)}_heatmap_${angle}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  const showPerRegion = regions.length > 1;

  return (
    <section className="export">
      <button onClick={() => download(`${safe(imageName)}_features.csv`, csvFeatures(), 'text/csv')}>特征 CSV</button>
      <button onClick={() => download(`${safe(imageName)}_features.json`, jsonFeatures(), 'application/json')}>特征 JSON</button>

      {regions.map((rg) => (
        <Fragment key={rg.id}>
          {showPerRegion && <span className="export-sep" />}
          {showPerRegion && (
            <span className="export-label">
              <span className="region-dot" style={{ background: rg.color }} />
              {rg.label}
            </span>
          )}
          {rg.rows.map((r) => (
            <button key={`${rg.id}-m-${r.angle}`} onClick={() => download(`${safe(imageName)}_${safe(rg.label)}_matrix_${r.angle}.csv`, csvMatrix(rg.id, r.angle), 'text/csv')}>
              矩阵 CSV ({r.angle}°)
            </button>
          ))}
          {rg.rows.map((r) => (
            <button key={`${rg.id}-p-${r.angle}`} onClick={() => png(rg.id, r.angle)}>
              热力图 PNG ({r.angle}°)
            </button>
          ))}
        </Fragment>
      ))}
    </section>
  );
}
