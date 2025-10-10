# Phase 1.1 – Initialize FastAPI Project & Database Connection

## Objective
Set up the FastAPI backend with a clean project structure, connect to the managed Postgres instance, and confirm basic service startup.

## Prerequisites
- Provider credentials from Phase 0 (Postgres connection string, Auth provider keys).  
- Repository skeleton created.

## Step-by-Step

1. **Project structure.**
   - In `backend/`, create:
     ```
     backend/
     ├── app/
     │   ├── __init__.py
     │   ├── main.py
     │   ├── api/
     │   │   ├── __init__.py
     │   │   └── v1/
     │   │       ├── __init__.py
     │   │       └── routes.py
     │   ├── core/
     │   │   ├── __init__.py
     │   │   └── config.py
     │   ├── db/
     │   │   ├── __init__.py
     │   │   ├── session.py
     │   │   └── base.py
     │   └── utils/
     ├── alembic/
     ├── alembic.ini
     └── tests/
     ```

2. **Install dependencies.**
   - `pip install fastapi uvicorn sqlmodel sqlalchemy psycopg[binary] alembic python-dotenv`  
   - For typing/lint: `pip install black ruff mypy`  
   - Update `requirements.txt` and lock file if used.

3. **Configuration module (`core/config.py`).**
   ```python
   from pydantic_settings import BaseSettings

   class Settings(BaseSettings):
       app_name: str = 'Course Atlas API'
       database_url: str
       auth_domain: str
       auth_audience: str

       class Config:
           env_file = '.env'

   settings = Settings()
   ```

4. **Database session (`db/session.py`).**
   ```python
   from sqlmodel import Session, SQLModel, create_engine
   from app.core.config import settings

   engine = create_engine(settings.database_url, echo=False)

   def get_session():
       with Session(engine) as session:
           yield session
   ```

5. **Main application (`main.py`).**
   ```python
   from fastapi import FastAPI
   from fastapi.middleware.cors import CORSMiddleware

   from app.core.config import settings
   from app.db.session import engine

   app = FastAPI(title=settings.app_name)

   app.add_middleware(
       CORSMiddleware,
       allow_origins=['*'],  # tighten later with actual domains
       allow_credentials=True,
       allow_methods=['*'],
       allow_headers=['*'],
   )

   @app.get('/healthz')
   def health_check():
       return {'status': 'ok'}
   ```

6. **Alembic initialization.**
   - `alembic init alembic`
   - Configure `alembic.ini` to use `settings.database_url`.  
   - In `alembic/env.py`, import SQLModel metadata:
     ```python
     from app.db.base import SQLModel
     target_metadata = SQLModel.metadata
     ```

7. **Database connection test.**
   - Ensure `.env` contains `DATABASE_URL`.  
   - Run `uvicorn app.main:app --reload`.  
   - Hit `http://localhost:8000/healthz` and ensure `{'status': 'ok'}` response.  
   - Run a simple SQL query using SQLModel in REPL to verify connection.

8. **Commit checkpoint.**
   - `git add backend/app backend/alembic ...`
   - `git commit -m "feat: bootstrap fastapi backend"`

## Deliverables
- Structured FastAPI app with environment-aware config.  
- Alembic set up for migrations.  
- Successful health check using managed Postgres connection.
