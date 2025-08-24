from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import uuid

from ..database.connection import get_db_session
from ..models.models import Transaction
from ..schemas.schemas import (
    TransactionCreate, TransactionUpdate, TransactionResponse, SuccessResponse
)
from ..middleware.auth import (
    get_current_active_user, require_admin
)

router = APIRouter(tags=["transactions"])

@router.get("/", response_model=List[TransactionResponse])
async def get_all_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_id: Optional[uuid.UUID] = Query(None),
    transaction_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get transactions. Users can see their own transactions, admins can see all."""
    try:
        stmt = select(Transaction)
        
        # Apply user-based filtering
        if current_user.role != "admin":
            stmt = stmt.where(Transaction.user_id == current_user.user_id)
        
        # Apply additional filters (admin only for user_id filter)
        if user_id and current_user.role == "admin":
            stmt = stmt.where(Transaction.user_id == user_id)
        if transaction_type:
            stmt = stmt.where(Transaction.transaction_type == transaction_type)
        if status:
            stmt = stmt.where(Transaction.status == status)
        
        stmt = (
            stmt.offset(skip)
            .limit(limit)
            .order_by(Transaction.created_at.desc())
        )
        
        result = await db.execute(stmt)
        transactions = result.scalars().all()
        
        return [
            TransactionResponse(
                id=transaction.id,
                user_id=transaction.user_id,
                amount=transaction.amount,
                transaction_type=transaction.transaction_type,
                status=transaction.status,
                payment_method=transaction.payment_method,
                reference_id=transaction.reference_id,
                description=transaction.description,
                metadata=transaction.metadata,
                created_at=transaction.created_at,
                updated_at=transaction.updated_at
            )
            for transaction in transactions
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch transactions"
        )

@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction_by_id(
    transaction_id: uuid.UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get a specific transaction by ID. Users can only see their own transactions."""
    try:
        stmt = select(Transaction).where(Transaction.id == transaction_id)
        
        # Non-admin users can only see their own transactions
        if current_user.role != "admin":
            stmt = stmt.where(Transaction.user_id == current_user.user_id)
        
        result = await db.execute(stmt)
        transaction = result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        
        return TransactionResponse(
            id=transaction.id,
            user_id=transaction.user_id,
            amount=transaction.amount,
            transaction_type=transaction.transaction_type,
            status=transaction.status,
            payment_method=transaction.payment_method,
            reference_id=transaction.reference_id,
            description=transaction.description,
            metadata=transaction.metadata,
            created_at=transaction.created_at,
            updated_at=transaction.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch transaction"
        )

@router.post("/", response_model=TransactionResponse)
async def create_transaction(
    transaction_data: TransactionCreate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new transaction."""
    try:
        # Create new transaction
        new_transaction = Transaction(
            id=uuid.uuid4(),
            user_id=current_user.user_id,
            amount=transaction_data.amount,
            transaction_type=transaction_data.transaction_type,
            status=transaction_data.status or "pending",
            payment_method=transaction_data.payment_method,
            reference_id=transaction_data.reference_id,
            description=transaction_data.description,
            metadata=transaction_data.metadata
        )
        
        db.add(new_transaction)
        await db.commit()
        await db.refresh(new_transaction)
        
        return TransactionResponse(
            id=new_transaction.id,
            user_id=new_transaction.user_id,
            amount=new_transaction.amount,
            transaction_type=new_transaction.transaction_type,
            status=new_transaction.status,
            payment_method=new_transaction.payment_method,
            reference_id=new_transaction.reference_id,
            description=new_transaction.description,
            metadata=new_transaction.metadata,
            created_at=new_transaction.created_at,
            updated_at=new_transaction.updated_at
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create transaction"
        )

@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: uuid.UUID,
    transaction_data: TransactionUpdate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update a transaction. Users can update their own transactions, admins can update any."""
    try:
        # Get the transaction
        stmt = select(Transaction).where(Transaction.id == transaction_id)
        
        # Non-admin users can only update their own transactions
        if current_user.role != "admin":
            stmt = stmt.where(Transaction.user_id == current_user.user_id)
        
        result = await db.execute(stmt)
        transaction = result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found or not authorized"
            )
        
        # Update transaction fields
        update_data = transaction_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(transaction, field, value)
        
        await db.commit()
        await db.refresh(transaction)
        
        return TransactionResponse(
            id=transaction.id,
            user_id=transaction.user_id,
            amount=transaction.amount,
            transaction_type=transaction.transaction_type,
            status=transaction.status,
            payment_method=transaction.payment_method,
            reference_id=transaction.reference_id,
            description=transaction.description,
            metadata=transaction.metadata,
            created_at=transaction.created_at,
            updated_at=transaction.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update transaction"
        )

@router.delete("/{transaction_id}", response_model=SuccessResponse)
async def delete_transaction(
    transaction_id: uuid.UUID,
    current_user = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete a transaction (admin only)."""
    try:
        # Get the transaction
        stmt = select(Transaction).where(Transaction.id == transaction_id)
        result = await db.execute(stmt)
        transaction = result.scalar_one_or_none()
        
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        
        await db.delete(transaction)
        await db.commit()
        
        return SuccessResponse(
            success=True,
            message="Transaction deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete transaction"
        )

@router.get("/user/{user_id}/summary")
async def get_user_transaction_summary(
    user_id: uuid.UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get transaction summary for a user. Users can see their own summary, admins can see any."""
    try:
        # Check permissions
        if current_user.role != "admin" and current_user.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this user's transaction summary"
            )
        
        # Get transaction summary
        stmt = select(Transaction).where(Transaction.user_id == user_id)
        result = await db.execute(stmt)
        transactions = result.scalars().all()
        
        # Calculate summary statistics
        total_amount = sum(t.amount for t in transactions)
        total_count = len(transactions)
        completed_transactions = [t for t in transactions if t.status == "completed"]
        completed_amount = sum(t.amount for t in completed_transactions)
        pending_transactions = [t for t in transactions if t.status == "pending"]
        pending_amount = sum(t.amount for t in pending_transactions)
        
        # Group by transaction type
        type_summary = {}
        for transaction in transactions:
            t_type = transaction.transaction_type
            if t_type not in type_summary:
                type_summary[t_type] = {"count": 0, "amount": 0}
            type_summary[t_type]["count"] += 1
            type_summary[t_type]["amount"] += transaction.amount
        
        return {
            "user_id": user_id,
            "total_transactions": total_count,
            "total_amount": total_amount,
            "completed_transactions": len(completed_transactions),
            "completed_amount": completed_amount,
            "pending_transactions": len(pending_transactions),
            "pending_amount": pending_amount,
            "by_type": type_summary
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch transaction summary"
        )