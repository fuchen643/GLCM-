import { FEATURE_KEYS } from '../glcm';
import { FEATURE_LABELS } from '../featureMeta';

interface Props {
  rows: { angle: number; features: Record<string, number> }[];
}

const COLORS = ['#6366f1', '#0ea5e9', '#f59e0b', '#ef4444'];

export default function FeatureChart({ rows }: Props) {
  if (!rows.length) return null;

  const multi = rows.length > 1;

  // 单方向：跨特征的对数尺度（直观展示特征“指纹”）
  let denom = 1;
  if (!multi) {
    let maxAbs = 0;
    for (const r of rows) {
      for (const k of FEATURE_KEYS) maxAbs = Math.max(maxAbs, Math.abs(r.features[k]));
    }
    denom = Math.log10(1 + maxAbs) || 1;
  }

  // 多方向：同一特征内按各方向占比显示（反映特征随方向的变化）
  const totals: Record<string, number> = {};
  if (multi) {
    for (const k of FEATURE_KEYS) {
      let s = 0;
      for (const r of rows) s += Math.log10(1 + Math.abs(r.features[k]));
      totals[k] = s || 1;
    }
  }

  const widthOf = (k: string, v: number) => {
    const log = Math.log10(1 + Math.abs(v));
    return multi ? (log / totals[k]) * 100 : (log / denom) * 100;
  };

  return (
    <section className="feature-chart card">
      <h2>特征分布</h2>
      <p className="chart-note">
        {multi
          ? '同一特征内按各方向占比显示，反映特征随方向的变化。'
          : '各特征按 log₁₀(1+|v|) 归一化显示相对强度，横条越长表示该特征值越大。'}
      </p>
      <div className="chart">
        {FEATURE_KEYS.map((k) => (
          <div className="chart-row" key={k}>
            <span className="chart-label">{FEATURE_LABELS[k]}</span>
            <div className="chart-track">
              {rows.map((r, idx) => (
                <div
                  key={r.angle}
                  className="chart-bar"
                  style={{ width: `${widthOf(k, r.features[k])}%`, background: COLORS[idx % COLORS.length] }}
                  title={`${r.angle}°: ${r.features[k].toPrecision(4)}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="chart-legend">
        {rows.map((r, idx) => (
          <span key={r.angle} className="legend-item">
            <i style={{ background: COLORS[idx % COLORS.length] }} />
            {r.angle}°
          </span>
        ))}
      </div>
    </section>
  );
}
