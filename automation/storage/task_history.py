from automation.storage.database import (
    get_connection,
    initialize_database
)


def save_task(instruction, task_type, status, result=None):
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO tasks
            (user_instruction, task_type, status, result)
            VALUES (?, ?, ?, ?)
            """,
            (instruction, task_type, status, result)
        )

        return cursor.lastrowid


def get_all_tasks():
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM tasks ORDER BY id DESC"
        ).fetchall()

        return [dict(row) for row in rows]


if __name__ == "__main__":
    initialize_database()

    task_id = save_task(
        "Create an Excel file",
        "excel",
        "completed",
        "File created successfully"
    )

    print("Saved task ID:", task_id)
    print("Task history:")

    for task in get_all_tasks():
        print(task)