import sqlite3
import os

DB_URL = os.getenv("DATABASE_URL", "sqlite:///./dev.db")

if not DB_URL.startswith("sqlite:///"):
    raise SystemExit("Este script rápido es solo para SQLite.")

path = DB_URL.replace("sqlite:///", "")
conn = sqlite3.connect(path)
cur = conn.cursor()

# verifica si ya existe
cur.execute("PRAGMA table_info(leads)")
cols = [r[1] for r in cur.fetchall()]
if "source" in cols:
    print("✅ Columna 'source' ya existe. Nada que hacer.")
else:
    cur.execute("ALTER TABLE leads ADD COLUMN source TEXT DEFAULT 'landing-orejas-en-armonia'")
    conn.commit()
    print("✅ Columna 'source' agregada correctamente.")

conn.close()
