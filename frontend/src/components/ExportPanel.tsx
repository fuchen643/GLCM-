import { FEATURE_KEYS } from '../glcm';

export interface ResultRow {
  angle: number;
  matrix: number[][];
  features: Record<string, number>;
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  results: ResultRow[];
  imageName: string;
  getHeatmapCanvas?: (angle: number) => HTMLCanvasElement | null;
}

export default function ExportPanel({ results, imageName, getHeatmapCanvas }: Props) {
  function csvFeatures() {
    const header = ['angle', ...FEATURE_KEYS];
    const lines = results.map((r) => [r.angle, ...FEATURE_KEYS.map((k) => r.features[k])]);
    return [header.join(','), ...lines.map((l) => l.join(','))].join('\n');
  }
  function csvMatrix(angle: number) {
    const r = results.find((x) => x.angle === angle);
    if (!r) return '';
    return r.matrix.map((row) => row.join(',')).join('\n');
  }
  function json() {
    return JSON.stringify(
      results.map((r) => ({ angle: r.angle, matrix: r.matrix, features: r.features })),
      null, 2
    );
  }
  function png(angle: number) {
    const c = getHeatmapCanvas?.(angle);
    if (!c) return;
    const dataUrl = c.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${imageName}_heatmap_${angle}.png`;
    a.click();
  }
  return (
    <section className="export">
      <button onClick={() => download(`${imageName}_features.csv`, csvFeatures(), 'text/csv')}>特征 CSV</button>
      <button onClick={() => download(`${imageName}_features.json`, json(), 'application/json')}>特征 JSON</button>
      {results.map((r) => (
        <button key={r.angle} onClick={() => download(`${imageName}_matrix_${r.angle}.csv`, csvMatrix(r.angle), 'text/csv')}>
          矩阵 CSV ({r.angle}°)
        </button>
      ))}
      {results.map((r) => (
        <button key={`png-${r.angle}`} onClick={() => png(r.angle)}>
          热力图 PNG ({r.angle}°)
        </button>
      ))}
    </section>
  );
}
