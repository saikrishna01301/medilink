from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db import init_db
from app.routers import auth_routes, doctor_routes, patient_routes


app = FastAPI()

# --- CORS CONFIGURATION (FIXES THE CROSS-ORIGIN BLOCK) ---
origins = [
    "http://localhost",
    "http://localhost:3000",  # Add your frontend's development URL here
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Run this function exactly once, when the application first starts up
@app.on_event("startup")
async def on_startup():
    await init_db()


# Include Routers
app.include_router(auth_routes.router, prefix="/auth", tags=["auth"])
app.include_router(doctor_routes.router, prefix="/patient", tags=["patient"])
app.include_router(patient_routes.router, prefix="/doctor", tags=["doctor"])
