import numpy as np
import pytest
from skimage.feature import graycomatrix, graycoprops

from app.glcm import quantize_image, glcm_matrix, haralick_features

LN2 = float(np.log(2.0))


def test_quantize():
    q = quantize_image(np.array([[0, 127, 255]], dtype=np.uint8), 8)
    assert q.tolist() == [[0, 3, 7]]


def test_glcm_matrix_counts():
    img = np.array([[0, 1], [1, 1]], dtype=np.int32)
    G = glcm_matrix(img, levels=2, distance=1, angle=0, symmetric=False)
    assert G.tolist() == [[0.0, 1.0], [0.0, 1.0]]
    Gs = glcm_matrix(img, levels=2, distance=1, angle=0, symmetric=True)
    assert Gs.tolist() == [[0.0, 1.0], [1.0, 2.0]]


def test_haralick_golden():
    f = haralick_features(np.array([[0.0, 1.0], [0.0, 1.0]]))
    assert f["contrast"] == pytest.approx(0.5)
    assert f["dissimilarity"] == pytest.approx(0.5)
    assert f["homogeneity"] == pytest.approx(0.75)
    assert f["asm"] == pytest.approx(0.5)
    assert f["entropy"] == pytest.approx(LN2)
    assert f["correlation"] == pytest.approx(0.0)
    assert f["mean"] == pytest.approx(0.75)
    assert f["variance"] == pytest.approx(0.125)
    assert f["maxProbability"] == pytest.approx(0.5)
    assert f["clusterShade"] == pytest.approx(0.0)
    assert f["clusterProminence"] == pytest.approx(0.0625)
    assert f["inverseDifference"] == pytest.approx(0.75)
    assert f["sumAverage"] == pytest.approx(1.5)
    assert f["sumEntropy"] == pytest.approx(LN2)


# 我方 angle ↔ skimage theta(弧度)：0↔π/2, 45↔π/4, 90↔0, 135↔3π/4
THETA = {0: np.pi / 2, 45: np.pi / 4, 90: 0.0, 135: 3 * np.pi / 4}


@pytest.mark.parametrize("angle", [0, 45, 90, 135])
def test_against_skimage(angle):
    rng = np.random.RandomState(0)
    img = rng.randint(0, 16, (32, 32)).astype(np.int32)
    ours = glcm_matrix(img, levels=16, distance=1, angle=angle, symmetric=True)
    ours_p = ours / ours.sum()
    theirs = graycomatrix(img, [1], [THETA[angle]], levels=16, symmetric=True, normed=True)[:, :, 0, 0]
    assert np.allclose(ours_p, theirs, atol=1e-12)

    f = haralick_features(ours)
    # 注：skimage 的 "energy" = √ASM，而本工程 "asm" = ΣP² = ASM，二者不等，
    # 故不在此对拍 "energy"（ASM 已由 ("ASM", "asm") 覆盖）。
    for prop, key in [("contrast", "contrast"), ("dissimilarity", "dissimilarity"),
                      ("homogeneity", "homogeneity"), ("ASM", "asm"),
                      ("correlation", "correlation")]:
        sk = float(graycoprops(graycomatrix(img, [1], [THETA[angle]], levels=16, symmetric=True), prop)[0, 0])
        assert f[key] == pytest.approx(sk, rel=1e-6)
