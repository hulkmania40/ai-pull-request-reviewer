from fastapi import APIRouter, HTTPException

from app.services.db_service import test_postgres_connection

router = APIRouter(prefix="/db", tags=["db"])


@router.get("/test")
def test_db_connection():
    try:
        return test_postgres_connection()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Database connection test failed: {str(exc)}",
        ) from exc
