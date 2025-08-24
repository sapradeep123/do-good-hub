from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import uuid

from ..database.connection import get_db_session
from ..models.models import Profile
from ..schemas.schemas import (
    ProfileUpdate, ProfileResponse, SuccessResponse
)
from ..middleware.auth import (
    get_current_active_user, require_admin
)

router = APIRouter(tags=["users"])

@router.get("/", response_model=List[ProfileResponse])
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: Profile = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Get all users (admin only)."""
    try:
        stmt = (
            select(Profile)
            .offset(skip)
            .limit(limit)
            .order_by(Profile.created_at.desc())
        )
        
        result = await db.execute(stmt)
        users = result.scalars().all()
        
        return [
            ProfileResponse(
                id=user.id,
                user_id=user.user_id,
                first_name=user.first_name,
                last_name=user.last_name,
                email=user.email,
                phone=user.phone,
                role=user.role,
                created_at=user.created_at,
                updated_at=user.updated_at
            )
            for user in users
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch users"
        )

@router.get("/{user_id}", response_model=ProfileResponse)
async def get_user_by_id(
    user_id: uuid.UUID,
    current_user: Profile = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Get a specific user by ID (admin only)."""
    try:
        stmt = select(Profile).where(Profile.user_id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return ProfileResponse(
            id=user.id,
            user_id=user.user_id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            phone=user.phone,
            role=user.role,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch user"
        )

@router.put("/profile", response_model=ProfileResponse)
async def update_user_profile(
    profile_data: ProfileUpdate,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update current user's profile."""
    try:
        # Update user profile fields
        update_data = profile_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(current_user, field, value)
        
        await db.commit()
        await db.refresh(current_user)
        
        return ProfileResponse(
            id=current_user.id,
            user_id=current_user.user_id,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            email=current_user.email,
            phone=current_user.phone,
            role=current_user.role,
            created_at=current_user.created_at,
            updated_at=current_user.updated_at
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )

@router.delete("/{user_id}", response_model=SuccessResponse)
async def delete_user(
    user_id: uuid.UUID,
    current_user: Profile = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete a user (admin only)."""
    try:
        stmt = select(Profile).where(Profile.user_id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prevent admin from deleting themselves
        if user.user_id == current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )
        
        await db.delete(user)
        await db.commit()
        
        return SuccessResponse(
            success=True,
            message="User deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user"
        )