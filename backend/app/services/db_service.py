import os
from datetime import datetime

import psycopg2
from dotenv import load_dotenv

load_dotenv()


def _get_env_value(*keys: str) -> str | None:
    for key in keys:
        value = os.getenv(key)
        if value:
            return value
    return None


def get_db_connection():
    database_url = _get_env_value("DATABASE_URL", "database_url", "uri", "URI")

    if database_url:
        return psycopg2.connect(
            database_url,
            connect_timeout=10,
        )

    user = _get_env_value("user", "USER", "DB_USER", "POSTGRES_USER")
    password = _get_env_value(
        "password", "PASSWORD", "DB_PASSWORD", "POSTGRES_PASSWORD"
    )
    host = _get_env_value("host", "HOST", "DB_HOST", "POSTGRES_HOST")
    port = _get_env_value("port", "PORT", "DB_PORT", "POSTGRES_PORT")
    dbname = _get_env_value("dbname", "DBNAME", "DB_NAME", "POSTGRES_DB")

    missing = [
        key
        for key, value in {
            "user": user,
            "password": password,
            "host": host,
            "port": port,
            "dbname": dbname,
        }.items()
        if not value
    ]

    if missing:
        raise ValueError(
            "Set DATABASE_URL (preferred) or provide required database env vars: "
            + ", ".join(missing)
        )

    return psycopg2.connect(
        user=user,
        password=password,
        host=host,
        port=port,
        dbname=dbname,
        connect_timeout=10,
        sslmode="require",
    )


def test_postgres_connection() -> dict:
    connection = get_db_connection()

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT NOW();")
            current_time = cursor.fetchone()

        return {
            "connected": True,
            "db_time": current_time[0].isoformat() if current_time else None,
            "checked_at": datetime.utcnow().isoformat() + "Z",
        }
    finally:
        connection.close()
