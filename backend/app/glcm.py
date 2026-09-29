import numpy as np

FEATURE_KEYS = [
    "contrast", "dissimilarity", "homogeneity", "asm", "entropy", "correlation",
    "mean", "variance", "maxProbability", "clusterShade", "clusterProminence",
    "inverseDifference", "sumAverage", "sumEntropy",
]

ANGLES = {0: (0, 1), 45: (1, 1), 90: (1, 0), 135: (-1, 1)}


def quantize_image(gray: np.ndarray, levels: int) -> np.ndarray:
    q = np.clip(gray.astype(np.int64) * levels // 256, 0, levels - 1)
    return q.astype(np.int32)


def glcm_matrix(quantized: np.ndarray, levels: int, distance: int, angle: int, symmetric: bool) -> np.ndarray:
    ux, uy = ANGLES[angle]
    dx, dy = ux * distance, uy * distance
    h, w = quantized.shape
    ys0, ys1 = max(0, -dy), h - max(0, dy)
    xs0, xs1 = max(0, -dx), w - max(0, dx)
    src = quantized[ys0:ys1, xs0:xs1]
    dst = quantized[ys0 + dy:ys1 + dy, xs0 + dx:xs1 + dx]
    G = np.zeros((levels, levels), dtype=np.float64)
    np.add.at(G, (src.ravel(), dst.ravel()), 1.0)
    if symmetric:
        G = G + G.T
    return G


def haralick_features(G: np.ndarray) -> dict:
    total = G.sum()
    P = G / total if total > 0 else G
    n = P.shape[0]
    ii, jj = np.meshgrid(np.arange(n), np.arange(n), indexing="ij")
    ii = ii.astype(np.float64)
    jj = jj.astype(np.float64)

    mux = float((ii * P).sum())
    muy = float((jj * P).sum())
    varx = float(((ii - mux) ** 2 * P).sum())
    vary = float(((jj - muy) ** 2 * P).sum())

    contrast = float(((ii - jj) ** 2 * P).sum())
    dissimilarity = float((np.abs(ii - jj) * P).sum())
    homogeneity = float((P / (1 + (ii - jj) ** 2)).sum())
    asm = float((P ** 2).sum())
    logP = np.where(P > 0, np.log(P), 0.0)
    entropy = float(-(P * logP).sum())
    max_prob = float(P.max())

    s = ii + jj - mux - muy
    cluster_shade = float((s ** 3 * P).sum())
    cluster_prominence = float((s ** 4 * P).sum())
    inverse_difference = float((P / (1 + np.abs(ii - jj))).sum())

    idx = (ii + jj).astype(np.int64)
    sum_prob = np.bincount(idx.ravel(), weights=P.ravel(), minlength=2 * n - 1)
    sum_average = float((np.arange(2 * n - 1) * sum_prob).sum())
    sum_log = np.where(sum_prob > 0, np.log(sum_prob), 0.0)
    sum_entropy = float(-(sum_prob * sum_log).sum())

    if varx * vary > 0:
        correlation = float((((ii - mux) * (jj - muy) * P).sum()) / np.sqrt(varx * vary))
    else:
        correlation = 0.0

    return {
        "contrast": contrast,
        "dissimilarity": dissimilarity,
        "homogeneity": homogeneity,
        "asm": asm,
        "entropy": entropy,
        "correlation": correlation,
        "mean": (mux + muy) / 2,
        "variance": (varx + vary) / 2,
        "maxProbability": max_prob,
        "clusterShade": cluster_shade,
        "clusterProminence": cluster_prominence,
        "inverseDifference": inverse_difference,
        "sumAverage": sum_average,
        "sumEntropy": sum_entropy,
    }
