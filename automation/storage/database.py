import os
import sqlite3
from pathlib import Path

# Store data in Windows local application storage
LOCAL_APP_DATA = Path(
    os.environ.get(
        "LOCALAPPDATA",
        Path.home() / "AppData" / "Local"
    )
)

DATA_DIR = LOCAL_APP_DATA / "ForgeAI"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = DATA_DIR / "forge.db"


def get_connection():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_connection() as connection:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_instruction TEXT NOT NULL,
                task_type TEXT NOT NULL,
                status TEXT NOT NULL,
                result TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

    print("FORGE AI local database initialized!")
    print(f"Database location: {DB_PATH}")


if __name__ == "__main__":
    initialize_database()