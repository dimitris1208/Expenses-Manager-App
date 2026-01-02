from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    full_name: str

class UserCreate(UserBase):
    password: str  # Only used when creating a user

class UserOut(UserBase):
    id: int
    class Config:
        from_attributes = True

# --- Share Schemas ---
class ShareOut(BaseModel):
    id: int
    debtor_id: int
    amount_owed: Decimal
    is_paid: bool
    
    class Config:
        from_attributes = True

# --- Expense Schemas ---
class ExpenseCreate(BaseModel):
    description: str
    total_amount: Decimal
    # We don't need to ask for split details; logic handles that.

class ExpenseOut(BaseModel):
    id: int
    payer_id: int
    description: str
    total_amount: Decimal
    is_fully_settled: bool
    created_at: datetime
    # Nested shares so we can see who owes what
    shares: List[ShareOut] = []

    class Config:
        from_attributes = True