import csv
import io
import zipfile
from typing import List

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image

from .glcm import FEATURE_KEYS, glcm_matrix, haralick_features, quantize_image

app = FastAPI(title="GLCM 批量分析后端")

MAX_IMAGES = 5000
MAX_TOTAL_BYTES = 100 * 1024 * 1024
IMG_EXTS = (".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff", ".webp")


@app.get("/health")
def health():
    return {"status": "ok"}


def decode_gray(data: bytes) -> np.ndarray:
    img = Image.open(io.BytesIO(data)).convert("L")
    return np.asarray(img, dtype=np.uint8)


def extract_images(files: List[UploadFile]):
    out = []
    total = 0
    for f in files:
        data = f.file.read()
        total += len(data)
        if total > MAX_TOTAL_BYTES:
            raise HTTPException(413, "上传总大小超过 100MB 限制")
        name = f.filename or "image"
        if name.lower().endswith(".zip"):
            try:
                with zipfile.ZipFile(io.BytesIO(data)) as z:
                    for entry in z.namelist():
                        if entry.lower().endswith(IMG_EXTS):
                            out.append((entry, z.read(entry)))
            except (zipfile.BadZipFile, zipfile.LargeZipFile):
                out.append((name, data))  # 坏 zip：作为一条坏文件，下游 decode_gray 会标注 ERROR 行
        else:
            out.append((name, data))
    return out


@app.post("/api/batch")
async def batch(
    files: List[UploadFile] = File(...),
    levels: int = Form(16),
    distance: int = Form(1),
    angles: str = Form("0,45,90,135"),
    symmetric: bool = Form(True),
):
    if levels not in (8, 16, 32, 64):
        raise HTTPException(400, "levels 必须是 8/16/32/64")
    if not (1 <= distance <= 10):
        raise HTTPException(400, "distance 必须在 1..10")
    try:
        angle_list = [int(a) for a in angles.split(",") if a.strip()]
    except ValueError:
        raise HTTPException(400, "angles 必须是 0/45/90/135 的逗号列表")
    if not angle_list or any(a not in (0, 45, 90, 135) for a in angle_list):
        raise HTTPException(400, "angles 必须是 0/45/90/135 的逗号列表")

    images = extract_images(files)
    if not images:
        raise HTTPException(400, "没有可处理的图片")
    if len(images) > MAX_IMAGES:
        raise HTTPException(413, f"图片数量超过上限 {MAX_IMAGES}")

    header = ["filename"]
    for a in angle_list:
        for k in FEATURE_KEYS:
            header.append(f"{k}_{a}")

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(header)

    for filename, data in images:
        row = [filename]
        try:
            gray = decode_gray(data)
            q = quantize_image(gray, levels)
        except Exception as exc:  # 坏文件：跳过并标注，不中断整批
            row.extend([f"ERROR:{exc}"] * (len(header) - 1))
            writer.writerow(row)
            continue
        for a in angle_list:
            G = glcm_matrix(q, levels, distance, a, symmetric)
            feats = haralick_features(G)
            for k in FEATURE_KEYS:
                row.append(f"{feats[k]:.9g}")
        writer.writerow(row)

    csv_bytes = buf.getvalue().encode("utf-8-sig")  # BOM 供 Excel 正确识别中文
    return Response(
        content=csv_bytes,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="glcm_features.csv"'},
    )
