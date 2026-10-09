import { Fragment } from 'react';
import { FEATURE_KEYS } from '../glcm';
import { FEATURE_LABELS, FEATURE_DESC } from '../featureMeta';

export interface RegionColumn {
  id: string;
  label: string;
  color: string;
  rows: { angle: number; features: Record<string, number> }[];
}

// 多区域对比表：两级表头（区域 × 方向），全图与各 ROI 并排对照
export default function FeatureTable({ regions }: { regions: RegionColumn[] }) {
  if (!regions.length || !regions[0].rows.length) return null;
  const angles = regions[0].rows.map((r) => r.angle);

  return (
    <div className="features-wrap">
      <table className="features compare">
        <thead>
          <tr>
            <th rowSpan={2} className="feat-head">特征</th>
            {regions.map((rg) => (
              <th key={rg.id} colSpan={angles.length} className="region-head">
                <span className="region-dot" style={{ background: rg.color }} />
                {rg.label}
              </th>
            ))}
          </tr>
          <tr>
            {regions.map((rg) => (
              <Fragment key={rg.id}>
                {angles.map((a) => <th key={a} className="angle-head">{a}°</th>)}
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURE_KEYS.map((k) => (
            <tr key={k}>
              <td title={FEATURE_DESC[k]}>
                <span className="feat-name">{FEATURE_LABELS[k]}</span>
                <code className="feat-key">{k}</code>
              </td>
              {regions.map((rg) => (
                <Fragment key={rg.id}>
                  {rg.rows.map((r) => <td key={r.angle}>{r.features[k].toPrecision(6)}</td>)}
                </Fragment>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
