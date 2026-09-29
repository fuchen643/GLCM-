from fastapi import FastAPI

app = FastAPI(title="GLCM 批量分析后端")


@app.get("/health")
def health():
    return {"status": "ok"}
