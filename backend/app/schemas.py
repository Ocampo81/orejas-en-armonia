from pydantic import BaseModel, Field
from datetime import datetime

class LeadCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    whatsapp: str = Field(min_length=7, max_length=40)
    message: str = Field(default="", max_length=500)
    source: str | None = "landing-orejas-en-armonia"

class LeadOut(LeadCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class LeadPage(BaseModel):
    items: list[LeadOut]
    total: int
    page: int
    page_size: int
    pages: int
