from functools import wraps
from psycopg2 import errorcodes
import psycopg2

from app.services.db_service import get_db_connection

def with_transaction(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        with get_db_connection() as connection:
            try:
                result = fn(*args, connection=connection, **kwargs)
                connection.commit()
                return result
            except Exception:
                connection.rollback()
                raise
    return wrapper


def with_connection(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        with get_db_connection() as connection:
            return fn(*args, connection=connection, **kwargs)
    return wrapper

def map_db_errors(
    unique_messages: dict[str, str] | None = None,
    unique_default_message: str = "Unique constraint violation",
):
    unique_messages = unique_messages or {}

    def deco(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                return fn(*args, **kwargs)
            except psycopg2.IntegrityError as exc:
                cause = getattr(exc, "__cause__", None) or exc
                code = getattr(cause, "pgcode", None)
                constraint = getattr(cause, "diag", None) and cause.diag.constraint_name

                if code == errorcodes.UNIQUE_VIOLATION:
                    if constraint and constraint in unique_messages:
                        raise ValueError(unique_messages[constraint]) from exc
                    raise ValueError(unique_default_message) from exc
                raise
        return wrapper
    return deco

def fetch_one(connection, query: str, params: tuple):
    with connection.cursor() as cursor:
        cursor.execute(query, params)
        return cursor.fetchone()


def execute(connection, query: str, params: tuple = ()):
    with connection.cursor() as cursor:
        cursor.execute(query, params)