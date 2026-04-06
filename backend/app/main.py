from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from app.routers import auth, payout, data_mgmt

app = FastAPI(title="Smart Wireless ICM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "*"
    return response

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(payout.router, prefix="/api/payout", tags=["payout"])
app.include_router(data_mgmt.router, prefix="/api/data", tags=["data"])

@app.get("/")
async def root():
    return {"message": "Smart Wireless ICM API is running"}

@app.get("/health")
async def health():
    return {"status": "healthy"}