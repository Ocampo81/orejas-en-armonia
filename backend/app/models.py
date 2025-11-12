from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base

class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    whatsapp: Mapped[str] = mapped_column(String(40))
    message: Mapped[str] = mapped_column(String(500), default="")
    source: Mapped[str] = mapped_column(String(120), default="landing-orejas-en-armonia")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
