import type { Angle } from '../glcm';

export interface ParamState {
  levels: 8 | 16 | 32 | 64;
  distance: number;
  angles: Angle[];
  symmetric: boolean;
}

interface Props {
  value: ParamState;
  onChange: (v: ParamState) => void;
}

const ANGLE_OPTIONS: Angle[] = [0, 45, 90, 135];

export default function ParamsPanel({ value, onChange }: Props) {
  function toggleAngle(a: Angle) {
    const has = value.angles.includes(a);
    const angles = has ? value.angles.filter((x) => x !== a) : [...value.angles, a];
    onChange({ ...value, angles: angles.length ? angles : [0] });
  }

  return (
    <section className="params">
      <div className="row">
        <span>灰度级（量化等级）</span>
        <select
          value={value.levels}
          onChange={(e) => onChange({ ...value, levels: Number(e.target.value) as 8 | 16 | 32 | 64 })}
        >
          {[8, 16, 32, 64].map((n) => <option key={n} value={n}>{n} 级</option>)}
        </select>
      </div>
      <div className="row">
        <span>距离 d（1–10）</span>
        <input
          type="number" min={1} max={10} value={value.distance}
          onChange={(e) => onChange({ ...value, distance: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })}
        />
      </div>
      <fieldset>
        <legend>方向 θ（可多选）</legend>
        <div className="angle-group">
          {ANGLE_OPTIONS.map((a) => (
            <label key={a} className={`angle-chip${value.angles.includes(a) ? ' on' : ''}`}>
              <input type="checkbox" checked={value.angles.includes(a)} onChange={() => toggleAngle(a)} />
              {a}°
            </label>
          ))}
        </div>
      </fieldset>
      <label className="check-row">
        <input type="checkbox" checked={value.symmetric} onChange={(e) => onChange({ ...value, symmetric: e.target.checked })} />
        对称化（G = G + Gᵀ）
      </label>
    </section>
  );
}
