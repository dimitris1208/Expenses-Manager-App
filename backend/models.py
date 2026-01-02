from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DECIMAL, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "fin_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

class Expense(Base):
    __tablename__ = "fin_expenses"

    id = Column(Integer, primary_key=True, index=True)
    payer_id = Column(Integer, ForeignKey("fin_users.id"), nullable=False)
    description = Column(String(255), nullable=False)
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    is_fully_settled = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    payer = relationship("User")
    shares = relationship("ExpenseShare", back_populates="expense", cascade="all, delete-orphan")

class ExpenseShare(Base):
    __tablename__ = "fin_expense_shares"

    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(Integer, ForeignKey("fin_expenses.id"), nullable=False)
    debtor_id = Column(Integer, ForeignKey("fin_users.id"), nullable=False)
    amount_owed = Column(DECIMAL(10, 2), nullable=False)
    is_paid = Column(Boolean, default=False)
    paid_at = Column(TIMESTAMP, nullable=True)

    # Relationships
    expense = relationship("Expense", back_populates="shares")
    debtor = relationship("User")