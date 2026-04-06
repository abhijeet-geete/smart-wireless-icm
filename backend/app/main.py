from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, payout, data_mgmt

app = FastAPI(title="Smart Wireless ICM API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://smart-wireless-icm.vercel.app",
        "https://smart-wireless-icm-git-main-abhijeet-geetes-projects.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(payout.router, prefix="/api/payout", tags=["payout"])
app.include_router(data_mgmt.router, prefix="/api/data", tags=["data"])


@app.get("/")
async def root():
    return {"message": "Smart Wireless ICM API is running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}