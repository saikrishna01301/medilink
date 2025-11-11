from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import init_db
from db.database import init_connector, close_connector
from routers import auth_routes, doctor_routes, google_calendar_routes


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
    # Initialize Cloud SQL connector first (if using Cloud SQL)
    await init_connector()
    # Then initialize the database
    await init_db()


# Close Cloud SQL connector on shutdown
@app.on_event("shutdown")
async def on_shutdown():
    await close_connector()


# Include Routers
app.include_router(auth_routes.router, prefix="/auth", tags=["auth"])
app.include_router(doctor_routes.router, prefix="/doctors", tags=["doctors"])
app.include_router(google_calendar_routes.router, prefix="/calendar/google", tags=["google-calendar"])
