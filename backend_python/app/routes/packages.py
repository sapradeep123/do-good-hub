from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import uuid

from ..database.connection import get_db_session
from ..models.models import Package, NGO
from ..schemas.schemas import (
    PackageCreate, PackageUpdate, PackageResponse, SuccessResponse
)
from ..middleware.auth import (
    get_current_active_user, require_ngo, require_admin_or_ngo
)

router = APIRouter(tags=["packages"])

@router.get("/", response_model=List[PackageResponse])
async def get_all_packages(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    ngo_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db_session)
):
    """Get all packages with optional filtering."""
    try:
        stmt = select(Package)
        
        # Apply filters
        if ngo_id:
            stmt = stmt.where(Package.ngo_id == ngo_id)
        if status:
            stmt = stmt.where(Package.status == status)
        
        stmt = (
            stmt.offset(skip)
            .limit(limit)
            .order_by(Package.created_at.desc())
        )
        
        result = await db.execute(stmt)
        packages = result.scalars().all()
        
        return [
            PackageResponse(
                id=package.id,
                ngo_id=package.ngo_id,
                title=package.title,
                description=package.description,
                amount=package.amount,
                image_url=package.image_url,
                category=package.category,
                target_quantity=package.target_quantity,
                current_quantity=package.current_quantity,
                status=package.status,
                created_at=package.created_at,
                updated_at=package.updated_at
            )
            for package in packages
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch packages"
        )

@router.get("/{package_id}", response_model=PackageResponse)
async def get_package_by_id(
    package_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session)
):
    """Get a specific package by ID."""
    try:
        stmt = select(Package).where(Package.id == package_id)
        result = await db.execute(stmt)
        package = result.scalar_one_or_none()
        
        if not package:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Package not found"
            )
        
        return PackageResponse(
            id=package.id,
            ngo_id=package.ngo_id,
            title=package.title,
            description=package.description,
            amount=package.amount,
            image_url=package.image_url,
            category=package.category,
            target_quantity=package.target_quantity,
            current_quantity=package.current_quantity,
            status=package.status,
            created_at=package.created_at,
            updated_at=package.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch package"
        )

@router.post("/", response_model=PackageResponse)
async def create_package(
    package_data: PackageCreate,
    current_user = Depends(require_ngo),
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new package (NGO users only)."""
    try:
        # Verify that the NGO exists and belongs to the current user
        ngo_stmt = select(NGO).where(
            NGO.id == package_data.ngo_id,
            NGO.user_id == current_user.user_id
        )
        ngo_result = await db.execute(ngo_stmt)
        ngo = ngo_result.scalar_one_or_none()
        
        if not ngo:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="NGO not found or not authorized"
            )
        
        # Create new package
        new_package = Package(
            id=uuid.uuid4(),
            ngo_id=package_data.ngo_id,
            title=package_data.title,
            description=package_data.description,
            amount=package_data.amount,
            image_url=package_data.image_url,
            category=package_data.category,
            target_quantity=package_data.target_quantity,
            current_quantity=package_data.current_quantity,
            status=package_data.status
        )
        
        db.add(new_package)
        await db.commit()
        await db.refresh(new_package)
        
        return PackageResponse(
            id=new_package.id,
            ngo_id=new_package.ngo_id,
            title=new_package.title,
            description=new_package.description,
            amount=new_package.amount,
            image_url=new_package.image_url,
            category=new_package.category,
            target_quantity=new_package.target_quantity,
            current_quantity=new_package.current_quantity,
            status=new_package.status,
            created_at=new_package.created_at,
            updated_at=new_package.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create package"
        )

@router.put("/{package_id}", response_model=PackageResponse)
async def update_package(
    package_id: uuid.UUID,
    package_data: PackageUpdate,
    current_user = Depends(require_admin_or_ngo),
    db: AsyncSession = Depends(get_db_session)
):
    """Update a package (package owner NGO or admin only)."""
    try:
        # Get the package
        stmt = select(Package).where(Package.id == package_id)
        result = await db.execute(stmt)
        package = result.scalar_one_or_none()
        
        if not package:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Package not found"
            )
        
        # Check permissions (package owner NGO or admin)
        if current_user.role != "admin":
            ngo_stmt = select(NGO).where(
                NGO.id == package.ngo_id,
                NGO.user_id == current_user.user_id
            )
            ngo_result = await db.execute(ngo_stmt)
            ngo = ngo_result.scalar_one_or_none()
            
            if not ngo:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to update this package"
                )
        
        # Update package fields
        update_data = package_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(package, field, value)
        
        await db.commit()
        await db.refresh(package)
        
        return PackageResponse(
            id=package.id,
            ngo_id=package.ngo_id,
            title=package.title,
            description=package.description,
            amount=package.amount,
            image_url=package.image_url,
            category=package.category,
            target_quantity=package.target_quantity,
            current_quantity=package.current_quantity,
            status=package.status,
            created_at=package.created_at,
            updated_at=package.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update package"
        )

@router.delete("/{package_id}", response_model=SuccessResponse)
async def delete_package(
    package_id: uuid.UUID,
    current_user = Depends(require_admin_or_ngo),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete a package (package owner NGO or admin only)."""
    try:
        # Get the package
        stmt = select(Package).where(Package.id == package_id)
        result = await db.execute(stmt)
        package = result.scalar_one_or_none()
        
        if not package:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Package not found"
            )
        
        # Check permissions (package owner NGO or admin)
        if current_user.role != "admin":
            ngo_stmt = select(NGO).where(
                NGO.id == package.ngo_id,
                NGO.user_id == current_user.user_id
            )
            ngo_result = await db.execute(ngo_stmt)
            ngo = ngo_result.scalar_one_or_none()
            
            if not ngo:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to delete this package"
                )
        
        await db.delete(package)
        await db.commit()
        
        return SuccessResponse(
            success=True,
            message="Package deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete package"
        )