from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "fin_users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

class Expense(Base):
    """External Expenses: Money leaving the company"""
    __tablename__ = "fin_expenses"
    id = Column(Integer, primary_key=True, index=True)
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(DateTime, server_default=func.now())
    
    # Who paid the external vendor?
    payer_id = Column(Integer, ForeignKey("fin_users.id"))
    payer = relationship("User", foreign_keys=[payer_id])

class Settlement(Base):
    """Internal Settlements: Money moving between users to fix debts"""
    __tablename__ = "fin_settlements"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    date = Column(DateTime, server_default=func.now())
    
    # Payer (Debtor) -> Receiver (Creditor)
    payer_id = Column(Integer, ForeignKey("fin_users.id"))
    receiver_id = Column(Integer, ForeignKey("fin_users.id"))
    
    payer = relationship("User", foreign_keys=[payer_id])
    receiver = relationship("User", foreign_keys=[receiver_id])