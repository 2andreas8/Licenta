from fastapi import FastAPI
from auth.routes import router as auth_router

app = FastAPI()

# inregistreaza rutele din auth.routes
app.include_router(auth_router)