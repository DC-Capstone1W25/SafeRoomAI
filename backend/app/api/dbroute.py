from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from .database import SessionLocal  # use relative import

app = FastAPI()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()