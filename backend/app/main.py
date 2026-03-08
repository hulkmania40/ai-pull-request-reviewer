from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.review import router as review_router

app = FastAPI()

origins = [
    "https://ai-pull-request-reviewer.onrender.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(review_router)


@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}

# uvicorn app.main:app --reload