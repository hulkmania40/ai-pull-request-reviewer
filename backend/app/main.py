from fastapi import FastAPI

from app.routes.review import router as review_router

app = FastAPI()

app.include_router(review_router)


@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}

# uvicorn app.main:app --reload