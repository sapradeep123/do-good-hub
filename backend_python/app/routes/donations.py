from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import uuid

from ..database.connection import get_db_session
from ..models.models import Donation, Package, NGO
from ..schemas.schemas import (
    DonationCreate, DonationUpdate, DonationResponse, SuccessResponse
)
from ..middleware.auth import (
    get_current_active_user, require_admin
)

router = APIRouter(tags=["donations"])

@router.get("/", response_model=List[DonationResponse])
async def get_all_donations(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    donor_id: Optional[uuid.UUID] = Query(None),
    package_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get donations. Users can see their own donations, admins can see all."""
    try:
        stmt = select(Donation)
        
        # Apply user-based filtering
        if current_user.role != "admin":
            stmt = stmt.where(Donation.donor_id == current_user.user_id)
        
        # Apply additional filters
        if donor_id and current_user.role == "admin":
            stmt = stmt.where(Donation.donor_id == donor_id)
        if package_id:
            stmt = stmt.where(Donation.package_id == package_id)
        if status:
            stmt = stmt.where(Donation.status == status)
        
        stmt = (
            stmt.offset(skip)
            .limit(limit)
            .order_by(Donation.created_at.desc())
        )
        
        result = await db.execute(stmt)
        donations = result.scalars().all()
        
        return [
            DonationResponse(
                id=donation.id,
                donor_id=donation.donor_id,
                package_id=donation.package_id,
                amount=donation.amount,
                quantity=donation.quantity,
                status=donation.status,
                payment_method=donation.payment_method,
                transaction_id=donation.transaction_id,
                notes=donation.notes,
                created_at=donation.created_at,
                updated_at=donation.updated_at
            )
            for donation in donations
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch donations"
        )

@router.get("/{donation_id}", response_model=DonationResponse)
async def get_donation_by_id(
    donation_id: uuid.UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get a specific donation by ID. Users can only see their own donations."""
    try:
        stmt = select(Donation).where(Donation.id == donation_id)
        
        # Non-admin users can only see their own donations
        if current_user.role != "admin":
            stmt = stmt.where(Donation.donor_id == current_user.user_id)
        
        result = await db.execute(stmt)
        donation = result.scalar_one_or_none()
        
        if not donation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Donation not found"
            )
        
        return DonationResponse(
            id=donation.id,
            donor_id=donation.donor_id,
            package_id=donation.package_id,
            amount=donation.amount,
            quantity=donation.quantity,
            status=donation.status,
            payment_method=donation.payment_method,
            transaction_id=donation.transaction_id,
            notes=donation.notes,
            created_at=donation.created_at,
            updated_at=donation.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch donation"
        )

@router.post("/", response_model=DonationResponse)
async def create_donation(
    donation_data: DonationCreate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new donation."""
    try:
        # Verify that the package exists
        package_stmt = select(Package).where(Package.id == donation_data.package_id)
        package_result = await db.execute(package_stmt)
        package = package_result.scalar_one_or_none()
        
        if not package:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Package not found"
            )
        
        # Check if package is active
        if package.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Package is not available for donations"
            )
        
        # Create new donation
        new_donation = Donation(
            id=uuid.uuid4(),
            donor_id=current_user.user_id,
            package_id=donation_data.package_id,
            amount=donation_data.amount,
            quantity=donation_data.quantity,
            status=donation_data.status or "pending",
            payment_method=donation_data.payment_method,
            transaction_id=donation_data.transaction_id,
            notes=donation_data.notes
        )
        
        db.add(new_donation)
        
        # Update package current quantity if donation is completed
        if new_donation.status == "completed":
            package.current_quantity += donation_data.quantity
        
        await db.commit()
        await db.refresh(new_donation)
        
        return DonationResponse(
            id=new_donation.id,
            donor_id=new_donation.donor_id,
            package_id=new_donation.package_id,
            amount=new_donation.amount,
            quantity=new_donation.quantity,
            status=new_donation.status,
            payment_method=new_donation.payment_method,
            transaction_id=new_donation.transaction_id,
            notes=new_donation.notes,
            created_at=new_donation.created_at,
            updated_at=new_donation.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create donation"
        )

@router.put("/{donation_id}", response_model=DonationResponse)
async def update_donation(
    donation_id: uuid.UUID,
    donation_data: DonationUpdate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update a donation. Users can update their own donations, admins can update any."""
    try:
        # Get the donation
        stmt = select(Donation).where(Donation.id == donation_id)
        
        # Non-admin users can only update their own donations
        if current_user.role != "admin":
            stmt = stmt.where(Donation.donor_id == current_user.user_id)
        
        result = await db.execute(stmt)
        donation = result.scalar_one_or_none()
        
        if not donation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Donation not found or not authorized"
            )
        
        # Get the associated package for quantity updates
        package_stmt = select(Package).where(Package.id == donation.package_id)
        package_result = await db.execute(package_stmt)
        package = package_result.scalar_one_or_none()
        
        # Handle status changes that affect package quantity
        old_status = donation.status
        old_quantity = donation.quantity
        
        # Update donation fields
        update_data = donation_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(donation, field, value)
        
        # Update package quantity based on status changes
        if package:
            # Remove old quantity if it was counted
            if old_status == "completed":
                package.current_quantity -= old_quantity
            
            # Add new quantity if donation is now completed
            if donation.status == "completed":
                package.current_quantity += donation.quantity
        
        await db.commit()
        await db.refresh(donation)
        
        return DonationResponse(
            id=donation.id,
            donor_id=donation.donor_id,
            package_id=donation.package_id,
            amount=donation.amount,
            quantity=donation.quantity,
            status=donation.status,
            payment_method=donation.payment_method,
            transaction_id=donation.transaction_id,
            notes=donation.notes,
            created_at=donation.created_at,
            updated_at=donation.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update donation"
        )

@router.delete("/{donation_id}", response_model=SuccessResponse)
async def delete_donation(
    donation_id: uuid.UUID,
    current_user = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete a donation (admin only)."""
    try:
        # Get the donation
        stmt = select(Donation).where(Donation.id == donation_id)
        result = await db.execute(stmt)
        donation = result.scalar_one_or_none()
        
        if not donation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Donation not found"
            )
        
        # Update package quantity if donation was completed
        if donation.status == "completed":
            package_stmt = select(Package).where(Package.id == donation.package_id)
            package_result = await db.execute(package_stmt)
            package = package_result.scalar_one_or_none()
            
            if package:
                package.current_quantity -= donation.quantity
        
        await db.delete(donation)
        await db.commit()
        
        return SuccessResponse(
            success=True,
            message="Donation deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete donation"
        )