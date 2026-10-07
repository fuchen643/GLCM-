import { FEATURE_KEYS } from '../glcm';
import { FEATURE_LABELS, FEATURE_DESC, FEATURE_FORMULA } from '../featureMeta';

export default function InfoSection() {
  return (
    <section className="info">
      <h2>原理说明</h2>
      <div className="info-grid">
        <article className="card">
          <h3>什么是灰度共生矩阵（GLCM）？</h3>
          <p>
            灰度共生矩阵（Gray-Level Co-occurrence Matrix，GLCM）统计图像中“相隔一定距离、沿特定方向”
            的像素灰度对出现的概率，是 Haralick 等人于 1973 年提出的经典纹理统计方法，广泛应用于图像分类、
            材料分析与医学影像等领域。
          </p>
          <p>
            计算流程：彩色图转灰度 → 灰度量化到 N 级 → 按距离 d 与方向 θ 统计灰度对 (i, j) 出现次数 →
            对称化 → 归一化为概率矩阵 P → 由 P 提取特征。
          </p>
        </article>
        <article className="card">
          <h3>14 项 Haralick 纹理特征</h3>
          <p>
            由归一化矩阵 P 可提取 14 项纹理特征，分别刻画对比度、均匀性、随机性、方向性等不同纹理属性。
            下方表格给出每一项特征的中文名称、物理含义与计算公式，其中 p(i,j) 为矩阵第 i 行第 j 列的概率值。
          </p>
        </article>
      </div>
      <div className="card">
        <h3>特征含义与公式</h3>
        <div className="features-wrap">
          <table className="info-table">
            <thead>
              <tr>
                <th>特征</th>
                <th>含义</th>
                <th>公式</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_KEYS.map((k) => (
                <tr key={k}>
                  <td>{FEATURE_LABELS[k]}<code className="key">{k}</code></td>
                  <td>{FEATURE_DESC[k]}</td>
                  <td className="formula">{FEATURE_FORMULA[k]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
