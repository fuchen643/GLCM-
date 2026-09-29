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
