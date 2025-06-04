from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from auth.routes import router as auth_router
from documents.routes import router as documents
from nlp.routes import router as nlp_router
from conversations.routes import router as conversations_router
import traceback
from dotenv import load_dotenv

load_dotenv()

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# inregistreaza rutele din auth.routes
app.include_router(auth_router)
app.include_router(documents)
app.include_router(nlp_router)
app.include_router(conversations_router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print("===ERROR ===")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error (detalii in consola)"},
    )