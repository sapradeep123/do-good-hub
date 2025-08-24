from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, join
from sqlalchemy.orm import selectinload
from typing import List, Optional
import uuid

from ..database.connection import get_db_session
from ..models.models import NGO, Profile
from ..schemas.schemas import (
    NGOCreate, NGOUpdate, NGOResponse, SuccessResponse
)
from ..middleware.auth import (
    get_current_active_user, require_ngo, require_admin_or_ngo
)

router = APIRouter(tags=["ngos"])

@router.get("/", response_model=List[NGOResponse])
async def get_all_ngos(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db_session)
):
    """Get all NGOs with pagination."""
    try:
        # Join NGO with Profile to get user details
        stmt = (
            select(
                NGO.id,
                NGO.user_id,
                NGO.name,
                NGO.description,
                NGO.mission,
                NGO.website,
                NGO.logo_url,
                NGO.gallery_images,
                NGO.started_date,
                NGO.license_number,
                NGO.total_members,
                NGO.full_address,
                NGO.pin_code,
                NGO.city,
                NGO.state,
                NGO.country,
                NGO.phone,
                NGO.email,
                NGO.registration_number,
                NGO.verified,
                NGO.created_at,
                NGO.updated_at,
                Profile.first_name,
                Profile.last_name,
                Profile.email.label('user_email')
            )
            .select_from(join(NGO, Profile, NGO.user_id == Profile.user_id))
            .offset(skip)
            .limit(limit)
            .order_by(NGO.created_at.desc())
        )
        
        result = await db.execute(stmt)
        ngos = result.fetchall()
        
        return [
            NGOResponse(
                id=ngo.id,
                user_id=ngo.user_id,
                name=ngo.name,
                description=ngo.description,
                mission=ngo.mission,
                website=ngo.website,
                logo_url=ngo.logo_url,
                gallery_images=ngo.gallery_images,
                started_date=ngo.started_date,
                license_number=ngo.license_number,
                total_members=ngo.total_members,
                full_address=ngo.full_address,
                pin_code=ngo.pin_code,
                city=ngo.city,
                state=ngo.state,
                country=ngo.country,
                phone=ngo.phone,
                email=ngo.email,
                registration_number=ngo.registration_number,
                verified=ngo.verified,
                created_at=ngo.created_at,
                updated_at=ngo.updated_at,
                first_name=ngo.first_name,
                last_name=ngo.last_name,
                user_email=ngo.user_email
            )
            for ngo in ngos
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch NGOs"
        )

@router.get("/{ngo_id}", response_model=NGOResponse)
async def get_ngo_by_id(
    ngo_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session)
):
    """Get a specific NGO by ID."""
    try:
        # Join NGO with Profile to get user details
        stmt = (
            select(
                NGO.id,
                NGO.user_id,
                NGO.name,
                NGO.description,
                NGO.mission,
                NGO.website,
                NGO.logo_url,
                NGO.gallery_images,
                NGO.started_date,
                NGO.license_number,
                NGO.total_members,
                NGO.full_address,
                NGO.pin_code,
                NGO.city,
                NGO.state,
                NGO.country,
                NGO.phone,
                NGO.email,
                NGO.registration_number,
                NGO.verified,
                NGO.created_at,
                NGO.updated_at,
                Profile.first_name,
                Profile.last_name,
                Profile.email.label('user_email')
            )
            .select_from(join(NGO, Profile, NGO.user_id == Profile.user_id))
            .where(NGO.id == ngo_id)
        )
        
        result = await db.execute(stmt)
        ngo = result.fetchone()
        
        if not ngo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="NGO not found"
            )
        
        return NGOResponse(
            id=ngo.id,
            user_id=ngo.user_id,
            name=ngo.name,
            description=ngo.description,
            mission=ngo.mission,
            website=ngo.website,
            logo_url=ngo.logo_url,
            gallery_images=ngo.gallery_images,
            started_date=ngo.started_date,
            license_number=ngo.license_number,
            total_members=ngo.total_members,
            full_address=ngo.full_address,
            pin_code=ngo.pin_code,
            city=ngo.city,
            state=ngo.state,
            country=ngo.country,
            phone=ngo.phone,
            email=ngo.email,
            registration_number=ngo.registration_number,
            verified=ngo.verified,
            created_at=ngo.created_at,
            updated_at=ngo.updated_at,
            first_name=ngo.first_name,
            last_name=ngo.last_name,
            user_email=ngo.user_email
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch NGO"
        )

@router.post("/", response_model=NGOResponse)
async def create_ngo(
    ngo_data: NGOCreate,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new NGO (authenticated users only)."""
    try:
        # Check if user already has an NGO
        stmt = select(NGO).where(NGO.user_id == current_user.user_id)
        result = await db.execute(stmt)
        existing_ngo = result.scalar_one_or_none()
        
        if existing_ngo:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has an NGO registered"
            )
        
        # Create new NGO
        new_ngo = NGO(
            id=uuid.uuid4(),
            user_id=current_user.user_id,
            name=ngo_data.name,
            description=ngo_data.description,
            mission=ngo_data.mission,
            website=ngo_data.website,
            logo_url=ngo_data.logo_url,
            gallery_images=ngo_data.gallery_images,
            started_date=ngo_data.started_date,
            license_number=ngo_data.license_number,
            total_members=ngo_data.total_members,
            full_address=ngo_data.full_address,
            pin_code=ngo_data.pin_code,
            city=ngo_data.city,
            state=ngo_data.state,
            country=ngo_data.country,
            phone=ngo_data.phone,
            email=ngo_data.email,
            registration_number=ngo_data.registration_number,
            verified=False  # NGOs need admin verification
        )
        
        db.add(new_ngo)
        await db.commit()
        await db.refresh(new_ngo)
        
        return NGOResponse(
            id=new_ngo.id,
            user_id=new_ngo.user_id,
            name=new_ngo.name,
            description=new_ngo.description,
            mission=new_ngo.mission,
            website=new_ngo.website,
            logo_url=new_ngo.logo_url,
            gallery_images=new_ngo.gallery_images,
            started_date=new_ngo.started_date,
            license_number=new_ngo.license_number,
            total_members=new_ngo.total_members,
            full_address=new_ngo.full_address,
            pin_code=new_ngo.pin_code,
            city=new_ngo.city,
            state=new_ngo.state,
            country=new_ngo.country,
            phone=new_ngo.phone,
            email=new_ngo.email,
            registration_number=new_ngo.registration_number,
            verified=new_ngo.verified,
            created_at=new_ngo.created_at,
            updated_at=new_ngo.updated_at,
            first_name=current_user.first_name,
            last_name=current_user.last_name,
            user_email=current_user.email
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create NGO"
        )

@router.put("/{ngo_id}", response_model=NGOResponse)
async def update_ngo(
    ngo_id: uuid.UUID,
    ngo_data: NGOUpdate,
    current_user: Profile = Depends(require_admin_or_ngo),
    db: AsyncSession = Depends(get_db_session)
):
    """Update an NGO (NGO owner or admin only)."""
    try:
        # Get the NGO
        stmt = select(NGO).where(NGO.id == ngo_id)
        result = await db.execute(stmt)
        ngo = result.scalar_one_or_none()
        
        if not ngo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="NGO not found"
            )
        
        # Check permissions (NGO owner or admin)
        if current_user.role != "admin" and ngo.user_id != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this NGO"
            )
        
        # Update NGO fields
        update_data = ngo_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(ngo, field, value)
        
        await db.commit()
        await db.refresh(ngo)
        
        # Get user details for response
        user_stmt = select(Profile).where(Profile.user_id == ngo.user_id)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one()
        
        return NGOResponse(
            id=ngo.id,
            user_id=ngo.user_id,
            name=ngo.name,
            description=ngo.description,
            mission=ngo.mission,
            website=ngo.website,
            logo_url=ngo.logo_url,
            address=ngo.address,
            city=ngo.city,
            state=ngo.state,
            country=ngo.country,
            phone=ngo.phone,
            email=ngo.email,
            registration_number=ngo.registration_number,
            verified=ngo.verified,
            created_at=ngo.created_at,
            updated_at=ngo.updated_at,
            first_name=user.first_name,
            last_name=user.last_name,
            user_email=user.email
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update NGO"
        )

@router.delete("/{ngo_id}", response_model=SuccessResponse)
async def delete_ngo(
    ngo_id: uuid.UUID,
    current_user: Profile = Depends(require_admin_or_ngo),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete an NGO (NGO owner or admin only)."""
    try:
        # Get the NGO
        stmt = select(NGO).where(NGO.id == ngo_id)
        result = await db.execute(stmt)
        ngo = result.scalar_one_or_none()
        
        if not ngo:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="NGO not found"
            )
        
        # Check permissions (NGO owner or admin)
        if current_user.role != "admin" and ngo.user_id != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this NGO"
            )
        
        await db.delete(ngo)
        await db.commit()
        
        return SuccessResponse(
            success=True,
            message="NGO deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete NGO"
        )