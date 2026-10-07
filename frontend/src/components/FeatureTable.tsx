import { FEATURE_KEYS } from '../glcm';
import { FEATURE_LABELS, FEATURE_DESC } from '../featureMeta';

export default function FeatureTable({ rows }: { rows: { angle: number; features: Record<string, number> }[] }) {
  if (!rows.length) return null;
  const angles = rows.map((r) => r.angle);
  return (
    <div className="features-wrap">
      <table className="features">
        <thead>
          <tr>
            <th>特征</th>
            {angles.map((a) => <th key={a}>{a}°</th>)}
          </tr>
        </thead>
        <tbody>
          {FEATURE_KEYS.map((k) => (
            <tr key={k}>
              <td title={FEATURE_DESC[k]}>
                <span className="feat-name">{FEATURE_LABELS[k]}</span>
                <code className="feat-key">{k}</code>
              </td>
              {rows.map((r) => <td key={r.angle}>{r.features[k].toPrecision(6)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
