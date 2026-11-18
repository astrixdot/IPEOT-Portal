from fastapi import FastAPI

app = FastAPI(title="ipeot-notifications")


@app.get("/health")
def health():
    return {"ok": True, "service": "ipeot-notifications"}
