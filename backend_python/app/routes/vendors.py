from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, join
from typing import List, Optional
import uuid

from ..database.connection import get_db_session
from ..models.models import Vendor, Profile
from ..schemas.schemas import (
    VendorCreate, VendorUpdate, VendorResponse, SuccessResponse
)
from ..middleware.auth import (
    get_current_active_user, require_vendor, require_admin_or_vendor
)

router = APIRouter(tags=["vendors"])

@router.get("/", response_model=List[VendorResponse])
async def get_all_vendors(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db_session)
):
    """Get all vendors with pagination."""
    try:
        stmt = (
            select(Vendor)
            .offset(skip)
            .limit(limit)
            .order_by(Vendor.created_at.desc())
        )
        
        result = await db.execute(stmt)
        vendors = result.scalars().all()
        
        return [
            VendorResponse(
                id=vendor.id,
                user_id=vendor.user_id,
                shop_name=vendor.company_name,  # Map company_name to shop_name
                owner_name=vendor.company_name,  # Use company_name as owner_name for now
                description=vendor.description,
                website=vendor.website,
                logo_url=vendor.logo_url,
                shop_location=vendor.address,  # Map address to shop_location
                full_address=vendor.address,  # Map address to full_address
                pin_code="000000",  # Default pin_code since it doesn't exist in DB
                city=vendor.city,
                state=vendor.state,
                country=vendor.country,
                phone=vendor.phone,
                email=vendor.email,
                gst_number="000000000000000",  # Default GST since it doesn't exist in DB
                business_type=vendor.business_type,
                business_license=None,  # Default since it doesn't exist in DB
                verified=vendor.verified,
                created_at=vendor.created_at,
                updated_at=vendor.updated_at
            )
            for vendor in vendors
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch vendors"
        )

@router.get("/{vendor_id}", response_model=VendorResponse)
async def get_vendor_by_id(
    vendor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session)
):
    """Get a specific vendor by ID."""
    try:
        stmt = select(Vendor).where(Vendor.id == vendor_id)
        result = await db.execute(stmt)
        vendor = result.scalar_one_or_none()
        
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor not found"
            )
        
        return VendorResponse(
            id=vendor.id,
            user_id=vendor.user_id,
            shop_name=vendor.company_name,  # Map company_name to shop_name
            owner_name=vendor.company_name,  # Use company_name as owner_name for now
            description=vendor.description,
            website=vendor.website,
            logo_url=vendor.logo_url,
            shop_location=vendor.address,  # Map address to shop_location
            full_address=vendor.address,  # Map address to full_address
            pin_code="000000",  # Default pin_code since it doesn't exist in DB
            city=vendor.city,
            state=vendor.state,
            country=vendor.country,
            phone=vendor.phone,
            email=vendor.email,
            gst_number="000000000000000",  # Default GST since it doesn't exist in DB
            business_type=vendor.business_type,
            business_license=None,  # Default since it doesn't exist in DB
            verified=vendor.verified,
            created_at=vendor.created_at,
            updated_at=vendor.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch vendor"
        )

@router.post("/", response_model=VendorResponse)
async def create_vendor(
    vendor_data: VendorCreate,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new vendor (authenticated users only)."""
    try:
        # Check if user already has a vendor profile
        stmt = select(Vendor).where(Vendor.user_id == current_user.user_id)
        result = await db.execute(stmt)
        existing_vendor = result.scalar_one_or_none()
        
        if existing_vendor:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has a vendor profile registered"
            )
        
        # Create new vendor
        new_vendor = Vendor(
            user_id=current_user.user_id,
            company_name=vendor_data.shop_name,  # Map shop_name to company_name
            description=vendor_data.description,
            website=vendor_data.website,
            logo_url=vendor_data.logo_url,
            address=vendor_data.full_address,  # Map full_address to address
            city=vendor_data.city,
            state=vendor_data.state,
            country=vendor_data.country,
            phone=vendor_data.phone,
            email=vendor_data.email,
            business_type=vendor_data.business_type,
            verified=False  # Vendors need admin verification
        )
        
        db.add(new_vendor)
        await db.commit()
        await db.refresh(new_vendor)
        
        return VendorResponse(
            id=new_vendor.id,
            user_id=new_vendor.user_id,
            shop_name=new_vendor.company_name,  # Map company_name to shop_name
            owner_name=new_vendor.company_name,  # Use company_name as owner_name for now
            description=new_vendor.description,
            website=new_vendor.website,
            logo_url=new_vendor.logo_url,
            shop_location=new_vendor.address,  # Map address to shop_location
            full_address=new_vendor.address,  # Map address to full_address
            pin_code="000000",  # Default pin_code since it doesn't exist in DB
            city=new_vendor.city,
            state=new_vendor.state,
            country=new_vendor.country,
            phone=new_vendor.phone,
            email=new_vendor.email,
            gst_number="000000000000000",  # Default GST since it doesn't exist in DB
            business_type=new_vendor.business_type,
            business_license=None,  # Default since it doesn't exist in DB
            verified=new_vendor.verified,
            created_at=new_vendor.created_at,
            updated_at=new_vendor.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create vendor"
        )

@router.put("/{vendor_id}", response_model=VendorResponse)
async def update_vendor(
    vendor_id: uuid.UUID,
    vendor_data: VendorUpdate,
    current_user: Profile = Depends(require_admin_or_vendor),
    db: AsyncSession = Depends(get_db_session)
):
    """Update a vendor (vendor owner or admin only)."""
    try:
        # Get the vendor
        stmt = select(Vendor).where(Vendor.id == vendor_id)
        result = await db.execute(stmt)
        vendor = result.scalar_one_or_none()
        
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor not found"
            )
        
        # Check permissions (vendor owner or admin)
        if current_user.role != "admin" and vendor.user_id != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this vendor"
            )
        
        # Update vendor fields with proper mapping from API fields to database columns
        update_data = vendor_data.dict(exclude_unset=True)
        
        # Map API field names to database column names
        field_mapping = {
            'shop_name': 'company_name',
            'full_address': 'address',
            'shop_location': 'address'  # Both map to address in DB
        }
        
        for field, value in update_data.items():
            # Use mapped field name if it exists, otherwise use original field name
            db_field = field_mapping.get(field, field)
            setattr(vendor, db_field, value)
        
        await db.commit()
        await db.refresh(vendor)
        
        return VendorResponse(
            id=vendor.id,
            user_id=vendor.user_id,
            shop_name=vendor.company_name,  # Map company_name to shop_name
            owner_name=vendor.company_name,  # Use company_name as owner_name for now
            description=vendor.description,
            website=vendor.website,
            logo_url=vendor.logo_url,
            shop_location=vendor.address,  # Map address to shop_location
            full_address=vendor.address,  # Map address to full_address
            pin_code="000000",  # Default pin_code since it doesn't exist in DB
            city=vendor.city,
            state=vendor.state,
            country=vendor.country,
            phone=vendor.phone,
            email=vendor.email,
            gst_number="000000000000000",  # Default GST since it doesn't exist in DB
            business_type=vendor.business_type,
            business_license=None,  # Default since it doesn't exist in DB
            verified=vendor.verified,
            created_at=vendor.created_at,
            updated_at=vendor.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update vendor"
        )

@router.delete("/{vendor_id}", response_model=SuccessResponse)
async def delete_vendor(
    vendor_id: uuid.UUID,
    current_user: Profile = Depends(require_admin_or_vendor),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete a vendor (vendor owner or admin only)."""
    try:
        # Get the vendor
        stmt = select(Vendor).where(Vendor.id == vendor_id)
        result = await db.execute(stmt)
        vendor = result.scalar_one_or_none()
        
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor not found"
            )
        
        # Check permissions (vendor owner or admin)
        if current_user.role != "admin" and vendor.user_id != current_user.user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this vendor"
            )
        
        await db.delete(vendor)
        await db.commit()
        
        return SuccessResponse(
            success=True,
            message="Vendor deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete vendor"
        )