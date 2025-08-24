from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime
from typing import List, Optional
import uuid
import json

from ..database.connection import get_db_session
from ..models.models import (
    Profile, NGO, Transaction, Donation, DonationPackage
)
from ..schemas.schemas import (
    NGOResponse, NGOUpdate, TransactionResponse, DonationResponse,
    SuccessResponse, UserRole
)
from ..middleware.auth import get_current_active_user

router = APIRouter(prefix="/ngo", tags=["ngo-dashboard"])

# Helper function to check NGO role and get NGO info
async def get_current_ngo(current_user: Profile, db: AsyncSession):
    if current_user.role != UserRole.NGO:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only NGOs can access this endpoint"
        )
    
    stmt = select(NGO).where(NGO.user_id == current_user.user_id)
    result = await db.execute(stmt)
    ngo = result.scalar_one_or_none()
    
    if not ngo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO profile not found"
        )
    
    return ngo

# NGO Profile Management
@router.get("/profile", response_model=NGOResponse)
async def get_ngo_profile(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get current NGO profile."""
    ngo = await get_current_ngo(current_user, db)
    
    return NGOResponse(
        id=ngo.id,
        user_id=ngo.user_id,
        name=ngo.name,
        description=ngo.description,
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
        verified=ngo.verified,
        created_at=ngo.created_at,
        updated_at=ngo.updated_at
    )

@router.put("/profile", response_model=SuccessResponse)
async def update_ngo_profile(
    ngo_data: NGOUpdate,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update NGO profile."""
    ngo = await get_current_ngo(current_user, db)
    
    # Update NGO fields
    update_data = ngo_data.model_dump(exclude_unset=True)
    if update_data:
        update_data['updated_at'] = datetime.utcnow()
        stmt = update(NGO).where(NGO.id == ngo.id).values(**update_data)
        await db.execute(stmt)
        await db.commit()
    
    return SuccessResponse(
        success=True,
        message="NGO profile updated successfully"
    )

# Gallery Management
@router.post("/gallery/upload", response_model=SuccessResponse)
async def upload_gallery_image(
    image_url: str,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Add image to NGO gallery."""
    ngo = await get_current_ngo(current_user, db)
    
    # Get current gallery images
    current_images = ngo.gallery_images or []
    
    # Add new image URL
    if image_url not in current_images:
        current_images.append(image_url)
        
        # Update NGO with new gallery
        stmt = update(NGO).where(NGO.id == ngo.id).values(
            gallery_images=current_images,
            updated_at=datetime.utcnow()
        )
        await db.execute(stmt)
        await db.commit()
    
    return SuccessResponse(
        success=True,
        message="Image added to gallery successfully"
    )

@router.delete("/gallery/{image_index}", response_model=SuccessResponse)
async def remove_gallery_image(
    image_index: int,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Remove image from NGO gallery by index."""
    ngo = await get_current_ngo(current_user, db)
    
    # Get current gallery images
    current_images = ngo.gallery_images or []
    
    if 0 <= image_index < len(current_images):
        # Remove image at specified index
        current_images.pop(image_index)
        
        # Update NGO with modified gallery
        stmt = update(NGO).where(NGO.id == ngo.id).values(
            gallery_images=current_images,
            updated_at=datetime.utcnow()
        )
        await db.execute(stmt)
        await db.commit()
        
        return SuccessResponse(
            success=True,
            message="Image removed from gallery successfully"
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image index"
        )

@router.get("/gallery")
async def get_gallery_images(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get all gallery images for the NGO."""
    ngo = await get_current_ngo(current_user, db)
    
    return {
        "success": True,
        "data": {
            "gallery_images": ngo.gallery_images or [],
            "total_images": len(ngo.gallery_images or [])
        }
    }

@router.put("/gallery/reorder", response_model=SuccessResponse)
async def reorder_gallery_images(
    new_order: List[str],
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Reorder gallery images."""
    ngo = await get_current_ngo(current_user, db)
    
    # Validate that all images in new_order exist in current gallery
    current_images = set(ngo.gallery_images or [])
    new_order_set = set(new_order)
    
    if current_images != new_order_set:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New order must contain exactly the same images as current gallery"
        )
    
    # Update NGO with reordered gallery
    stmt = update(NGO).where(NGO.id == ngo.id).values(
        gallery_images=new_order,
        updated_at=datetime.utcnow()
    )
    await db.execute(stmt)
    await db.commit()
    
    return SuccessResponse(
        success=True,
        message="Gallery images reordered successfully"
    )

# Donations and Transactions
@router.get("/donations", response_model=List[DonationResponse])
async def get_ngo_donations(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get all donations received by the NGO."""
    ngo = await get_current_ngo(current_user, db)
    
    stmt = select(Donation).where(
        Donation.ngo_id == ngo.user_id
    ).offset(skip).limit(limit)
    result = await db.execute(stmt)
    donations = result.scalars().all()
    
    return [DonationResponse(
        id=donation.id,
        user_id=donation.user_id,
        ngo_id=donation.ngo_id,
        package_id=donation.package_id,
        amount=donation.amount,
        message=donation.message,
        anonymous=donation.anonymous,
        created_at=donation.created_at
    ) for donation in donations]

@router.get("/transactions", response_model=List[TransactionResponse])
async def get_ngo_transactions(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get all transactions related to the NGO."""
    ngo = await get_current_ngo(current_user, db)
    
    stmt = select(Transaction).where(
        Transaction.ngo_id == ngo.user_id
    ).offset(skip).limit(limit)
    result = await db.execute(stmt)
    transactions = result.scalars().all()
    
    return [TransactionResponse(
        id=transaction.id,
        donation_id=transaction.donation_id,
        ngo_id=transaction.ngo_id,
        vendor_id=transaction.vendor_id,
        user_id=transaction.user_id,
        amount=transaction.amount,
        status=transaction.status,
        tracking_id=transaction.tracking_id,
        delivery_address=transaction.delivery_address,
        delivery_date=transaction.delivery_date,
        notes=transaction.notes,
        created_at=transaction.created_at,
        updated_at=transaction.updated_at
    ) for transaction in transactions]

# Available Packages
@router.get("/available-packages")
async def get_available_packages(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get donation packages available for the NGO."""
    ngo = await get_current_ngo(current_user, db)
    
    stmt = select(DonationPackage).where(
        DonationPackage.status == 'active'
    )
    result = await db.execute(stmt)
    packages = result.scalars().all()
    
    return {
        "success": True,
        "data": [
            {
                "id": str(package.id),
                "title": package.title,
                "description": package.description,
                "amount": float(package.amount),
                "category": package.category,
                "target_quantity": package.target_quantity,
                "current_quantity": package.current_quantity,
                "status": package.status,
                "assigned_vendor_id": str(package.assigned_vendor_id) if package.assigned_vendor_id else None,
                "created_at": package.created_at.isoformat()
            }
            for package in packages
        ]
    }

# Dashboard Statistics
@router.get("/dashboard/stats")
async def get_ngo_dashboard_stats(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get NGO dashboard statistics."""
    ngo = await get_current_ngo(current_user, db)
    
    # Get total donations
    total_donations_stmt = select(Donation).where(Donation.ngo_id == ngo.user_id)
    total_donations_result = await db.execute(total_donations_stmt)
    donations = total_donations_result.scalars().all()
    total_donations = len(donations)
    total_amount = sum(float(donation.amount) for donation in donations)
    
    # Get total transactions
    total_transactions_stmt = select(Transaction).where(Transaction.ngo_id == ngo.user_id)
    total_transactions_result = await db.execute(total_transactions_stmt)
    transactions = total_transactions_result.scalars().all()
    total_transactions = len(transactions)
    
    # Get pending transactions
    pending_transactions = len([t for t in transactions if t.status == 'pending'])
    
    # Get completed transactions
    completed_transactions = len([t for t in transactions if t.status == 'completed'])
    
    # Get gallery image count
    gallery_count = len(ngo.gallery_images or [])
    
    return {
        "success": True,
        "data": {
            "total_donations": total_donations,
            "total_amount_received": total_amount,
            "total_transactions": total_transactions,
            "pending_transactions": pending_transactions,
            "completed_transactions": completed_transactions,
            "gallery_images_count": gallery_count,
            "ngo_verified": ngo.verified,
            "profile_completion": {
                "description": bool(ngo.description),
                "website": bool(ngo.website),
                "logo": bool(ngo.logo_url),
                "gallery": gallery_count > 0,
                "started_date": bool(ngo.started_date),
                "license": bool(ngo.license_number),
                "members_count": bool(ngo.total_members)
            }
        }
    }

# NGO Information for Public View
@router.get("/public-info")
async def get_public_ngo_info(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get NGO information that can be displayed publicly."""
    ngo = await get_current_ngo(current_user, db)
    
    return {
        "success": True,
        "data": {
            "id": str(ngo.id),
            "name": ngo.name,
            "description": ngo.description,
            "website": ngo.website,
            "logo_url": ngo.logo_url,
            "gallery_images": ngo.gallery_images or [],
            "started_date": ngo.started_date.isoformat() if ngo.started_date else None,
            "total_members": ngo.total_members,
            "city": ngo.city,
            "state": ngo.state,
            "country": ngo.country,
            "verified": ngo.verified,
            "created_at": ngo.created_at.isoformat()
        }
    }

# Update NGO Description
@router.put("/description", response_model=SuccessResponse)
async def update_ngo_description(
    description: str,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update NGO description."""
    ngo = await get_current_ngo(current_user, db)
    
    # Update NGO description
    stmt = update(NGO).where(NGO.id == ngo.id).values(
        description=description,
        updated_at=datetime.utcnow()
    )
    await db.execute(stmt)
    await db.commit()
    
    return SuccessResponse(
        success=True,
        message="NGO description updated successfully"
    )

# Update NGO Logo
@router.put("/logo", response_model=SuccessResponse)
async def update_ngo_logo(
    logo_url: str,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update NGO logo."""
    ngo = await get_current_ngo(current_user, db)
    
    # Update NGO logo
    stmt = update(NGO).where(NGO.id == ngo.id).values(
        logo_url=logo_url,
        updated_at=datetime.utcnow()
    )
    await db.execute(stmt)
    await db.commit()
    
    return SuccessResponse(
        success=True,
        message="NGO logo updated successfully"
    )

# Bulk Gallery Upload
@router.post("/gallery/bulk-upload", response_model=SuccessResponse)
async def bulk_upload_gallery_images(
    image_urls: List[str],
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Add multiple images to NGO gallery."""
    ngo = await get_current_ngo(current_user, db)
    
    # Get current gallery images
    current_images = ngo.gallery_images or []
    
    # Add new image URLs (avoid duplicates)
    for image_url in image_urls:
        if image_url not in current_images:
            current_images.append(image_url)
    
    # Update NGO with new gallery
    stmt = update(NGO).where(NGO.id == ngo.id).values(
        gallery_images=current_images,
        updated_at=datetime.utcnow()
    )
    await db.execute(stmt)
    await db.commit()
    
    return SuccessResponse(
        success=True,
        message=f"Added {len([url for url in image_urls if url not in (ngo.gallery_images or [])])} new images to gallery"
    )