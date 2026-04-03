from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATABASE_PATH = BASE_DIR / "city_explorer.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"

API_TITLE = "City Explorer Backend"
API_VERSION = "0.1.0"

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "city-explorer-dev-secret")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
