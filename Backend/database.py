import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

def get_connection():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        sslmode=os.getenv("DB_SSLMODE")
    )
    return conn

def init_db():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id           SERIAL PRIMARY KEY,
                name         VARCHAR(100) NOT NULL,
                price        NUMERIC(10, 2) NOT NULL,
                quantity     INTEGER NOT NULL DEFAULT 0,
                discontinued BOOLEAN NOT NULL DEFAULT FALSE
            )
        """)
        cur.execute("""
            ALTER TABLE products
            ADD COLUMN IF NOT EXISTS discontinued BOOLEAN NOT NULL DEFAULT FALSE
        """)
        conn.commit()
        cur.close()
        conn.close()
        print("Database ready!")
    except Exception as e:
        print(f"DB init error: {e}")
