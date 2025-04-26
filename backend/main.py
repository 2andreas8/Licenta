from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from auth.routes import router as auth_router
import traceback

app = FastAPI()

# inregistreaza rutele din auth.routes
app.include_router(auth_router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("===ERROR ===")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error (detalii in consola)"},
    )