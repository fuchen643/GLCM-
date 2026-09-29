import io
import zipfile
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def _png_bytes(rows=4, cols=4):
    import numpy as np
    from PIL import Image
    rng = np.random.RandomState(1)
    arr = rng.randint(0, 255, (rows, cols)).astype(np.uint8)
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, format="PNG")
    return buf.getvalue()


def test_batch_single_png():
    data = _png_bytes()
    resp = client.post(
        "/api/batch",
        files=[("files", ("a.png", data, "image/png"))],
        data={"levels": "16", "distance": "1", "angles": "0", "symmetric": "true"},
    )
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    # CSV 用 utf-8-sig（带 BOM）；resp.text 按 charset=utf-8 解码不剥 BOM，
    # 故用 content.decode("utf-8-sig") 取文本，否则 lines[0] 以 ﻿ 开头。
    text = resp.content.decode("utf-8-sig")
    lines = text.strip().splitlines()
    assert lines[0].startswith("filename,contrast_0,")
    assert lines[1].startswith("a.png,")


def test_batch_zip():
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("a.png", _png_bytes())
        z.writestr("b.png", _png_bytes())
    resp = client.post(
        "/api/batch",
        files=[("files", ("imgs.zip", buf.getvalue(), "application/zip"))],
        data={"levels": "8", "distance": "1", "angles": "0,90", "symmetric": "true"},
    )
    assert resp.status_code == 200
    lines = resp.content.decode("utf-8-sig").strip().splitlines()
    assert len(lines) == 3  # header + 2 rows


def test_batch_bad_levels():
    resp = client.post(
        "/api/batch",
        files=[("files", ("a.png", _png_bytes(), "image/png"))],
        data={"levels": "7"},
    )
    assert resp.status_code == 400


def test_batch_bad_angles():
    resp = client.post(
        "/api/batch",
        files=[("files", ("a.png", _png_bytes(), "image/png"))],
        data={"levels": "16", "angles": "abc"},
    )
    assert resp.status_code == 400


def test_batch_corrupt_zip():
    resp = client.post(
        "/api/batch",
        files=[("files", ("bad.zip", b"not a zip file", "application/zip"))],
        data={"levels": "16", "distance": "1", "angles": "0", "symmetric": "true"},
    )
    assert resp.status_code == 200
    lines = resp.content.decode("utf-8-sig").strip().splitlines()
    assert len(lines) == 2  # header + 1 ERROR row
    assert lines[1].startswith("bad.zip,")
    assert "ERROR:" in lines[1]


def test_cors_header_present():
    # 前端(Vercel)/后端(Render)跨源，响应必须带 Access-Control-Allow-Origin
    resp = client.post(
        "/api/batch",
        files=[("files", ("a.png", _png_bytes(), "image/png"))],
        data={"levels": "16", "distance": "1", "angles": "0", "symmetric": "true"},
        headers={"Origin": "https://glcm-frontend.vercel.app"},
    )
    assert resp.status_code == 200
    assert resp.headers["access-control-allow-origin"] == "*"


def test_decode_gray_matches_frontend_formula():
    # 与前端 rgbaToGray 同公式：0.299R+0.587G+0.114B, round half up
    # (7,21,220) -> 39.5 -> 40；PIL .convert("L") 会得 39，此测试锁定一致性
    import numpy as np
    from PIL import Image
    from app.main import decode_gray

    arr = np.array([[[7, 21, 220]]], dtype=np.uint8)
    buf = io.BytesIO()
    Image.fromarray(arr, mode="RGB").save(buf, format="PNG")
    gray = decode_gray(buf.getvalue())
    assert gray.shape == (1, 1)
    assert int(gray[0, 0]) == 40
