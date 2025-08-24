from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime
from typing import List, Optional
import uuid

from ..database.connection import get_db_session
from ..models.models import (
    Profile, Vendor, Transaction, VendorInvoice, DonationPackage
)
from ..schemas.schemas import (
    VendorResponse, VendorUpdate, TransactionResponse,
    VendorInvoiceResponse, VendorInvoiceCreate, VendorInvoiceUpdate,
    SuccessResponse, UserRole, InvoiceStatus
)
from ..middleware.auth import get_current_active_user
from ..utils.email_service import email_service

router = APIRouter(prefix="/vendor", tags=["vendor-dashboard"])

# Helper function to check vendor role and get vendor info
async def get_current_vendor(current_user: Profile, db: AsyncSession):
    if current_user.role != UserRole.VENDOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only vendors can access this endpoint"
        )
    
    stmt = select(Vendor).where(Vendor.user_id == current_user.user_id)
    result = await db.execute(stmt)
    vendor = result.scalar_one_or_none()
    
    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found"
        )
    
    return vendor

# Vendor Profile Management
@router.get("/profile", response_model=VendorResponse)
async def get_vendor_profile(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get current vendor profile."""
    vendor = await get_current_vendor(current_user, db)
    
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
        business_license="",  # Default business_license since it doesn't exist in DB
        verified=vendor.verified,
        created_at=vendor.created_at,
        updated_at=vendor.updated_at
    )

@router.put("/profile", response_model=SuccessResponse)
async def update_vendor_profile(
    vendor_data: VendorUpdate,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update vendor profile."""
    vendor = await get_current_vendor(current_user, db)
    
    # Update vendor fields
    update_data = vendor_data.model_dump(exclude_unset=True)
    if update_data:
        update_data['updated_at'] = datetime.utcnow()
        stmt = update(Vendor).where(Vendor.id == vendor.id).values(**update_data)
        await db.execute(stmt)
        await db.commit()
    
    return SuccessResponse(
        success=True,
        message="Vendor profile updated successfully"
    )

# Order Management
@router.get("/orders", response_model=List[TransactionResponse])
async def get_vendor_orders(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get all orders assigned to the current vendor."""
    vendor = await get_current_vendor(current_user, db)
    
    stmt = select(Transaction).where(
        Transaction.vendor_id == vendor.user_id
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

@router.get("/orders/{transaction_id}", response_model=TransactionResponse)
async def get_order_details(
    transaction_id: uuid.UUID,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get specific order details for the vendor."""
    vendor = await get_current_vendor(current_user, db)
    
    stmt = select(Transaction).where(
        Transaction.id == transaction_id,
        Transaction.vendor_id == vendor.user_id
    )
    result = await db.execute(stmt)
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or not assigned to you"
        )
    
    return TransactionResponse(
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
    )

@router.put("/orders/{transaction_id}/update-status", response_model=SuccessResponse)
async def update_order_status(
    transaction_id: uuid.UUID,
    status_update: str,
    tracking_id: Optional[str] = None,
    delivery_date: Optional[datetime] = None,
    notes: Optional[str] = None,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update order status and delivery information."""
    vendor = await get_current_vendor(current_user, db)
    
    # Check if transaction exists and belongs to vendor
    stmt = select(Transaction).where(
        Transaction.id == transaction_id,
        Transaction.vendor_id == vendor.user_id
    )
    result = await db.execute(stmt)
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or not assigned to you"
        )
    
    # Update transaction
    update_data = {
        'status': status_update,
        'updated_at': datetime.utcnow()
    }
    
    if tracking_id:
        update_data['tracking_id'] = tracking_id
    if delivery_date:
        update_data['delivery_date'] = delivery_date
    if notes:
        update_data['notes'] = notes
    
    stmt = update(Transaction).where(Transaction.id == transaction_id).values(**update_data)
    await db.execute(stmt)
    await db.commit()
    
    return SuccessResponse(
        success=True,
        message="Order status updated successfully"
    )

# Invoice Management
@router.post("/invoices", response_model=SuccessResponse)
async def upload_invoice(
    invoice_data: VendorInvoiceCreate,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Upload invoice for a transaction."""
    vendor = await get_current_vendor(current_user, db)
    
    # Verify the transaction belongs to this vendor
    stmt = select(Transaction).where(
        Transaction.id == invoice_data.transaction_id,
        Transaction.vendor_id == vendor.user_id
    )
    result = await db.execute(stmt)
    transaction = result.scalar_one_or_none()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found or not assigned to you"
        )
    
    # Check if invoice already exists for this transaction
    existing_invoice_stmt = select(VendorInvoice).where(
        VendorInvoice.transaction_id == invoice_data.transaction_id
    )
    existing_result = await db.execute(existing_invoice_stmt)
    existing_invoice = existing_result.scalar_one_or_none()
    
    if existing_invoice:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invoice already exists for this transaction"
        )
    
    # Create new invoice
    new_invoice = VendorInvoice(
        id=uuid.uuid4(),
        transaction_id=invoice_data.transaction_id,
        vendor_id=vendor.user_id,
        invoice_number=invoice_data.invoice_number,
        invoice_url=invoice_data.invoice_url,
        invoice_amount=invoice_data.invoice_amount,
        submitted_date=invoice_data.submitted_date,
        status=InvoiceStatus.PENDING
    )
    
    db.add(new_invoice)
    await db.commit()
    
    # Send email notification to admin
    try:
        await email_service.send_invoice_notification(
            db=db,
            vendor_name=vendor.shop_name or vendor.owner_name,
            invoice_number=invoice_data.invoice_number,
            invoice_amount=float(invoice_data.invoice_amount),
            transaction_id=str(invoice_data.transaction_id)
        )
    except Exception as e:
        # Log error but don't fail invoice upload
        print(f"Failed to send invoice notification email: {e}")
    
    return SuccessResponse(
        success=True,
        message="Invoice uploaded successfully and sent for admin approval"
    )

@router.get("/invoices", response_model=List[VendorInvoiceResponse])
async def get_vendor_invoices(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get all invoices uploaded by the current vendor."""
    vendor = await get_current_vendor(current_user, db)
    
    stmt = select(VendorInvoice).where(
        VendorInvoice.vendor_id == vendor.user_id
    ).offset(skip).limit(limit)
    result = await db.execute(stmt)
    invoices = result.scalars().all()
    
    return [VendorInvoiceResponse(
        id=invoice.id,
        transaction_id=invoice.transaction_id,
        vendor_id=invoice.vendor_id,
        invoice_number=invoice.invoice_number,
        invoice_url=invoice.invoice_url,
        invoice_amount=invoice.invoice_amount,
        submitted_date=invoice.submitted_date,
        status=invoice.status,
        admin_notes=invoice.admin_notes,
        approved_by=invoice.approved_by,
        approved_at=invoice.approved_at,
        created_at=invoice.created_at,
        updated_at=invoice.updated_at
    ) for invoice in invoices]

@router.get("/invoices/{invoice_id}", response_model=VendorInvoiceResponse)
async def get_invoice_details(
    invoice_id: uuid.UUID,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get specific invoice details."""
    vendor = await get_current_vendor(current_user, db)
    
    stmt = select(VendorInvoice).where(
        VendorInvoice.id == invoice_id,
        VendorInvoice.vendor_id == vendor.user_id
    )
    result = await db.execute(stmt)
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    return VendorInvoiceResponse(
        id=invoice.id,
        transaction_id=invoice.transaction_id,
        vendor_id=invoice.vendor_id,
        invoice_number=invoice.invoice_number,
        invoice_url=invoice.invoice_url,
        invoice_amount=invoice.invoice_amount,
        submitted_date=invoice.submitted_date,
        status=invoice.status,
        admin_notes=invoice.admin_notes,
        approved_by=invoice.approved_by,
        approved_at=invoice.approved_at,
        created_at=invoice.created_at,
        updated_at=invoice.updated_at
    )

@router.put("/invoices/{invoice_id}", response_model=SuccessResponse)
async def update_invoice(
    invoice_id: uuid.UUID,
    invoice_data: VendorInvoiceUpdate,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update invoice (only if not yet approved)."""
    vendor = await get_current_vendor(current_user, db)
    
    # Check if invoice exists and belongs to vendor
    stmt = select(VendorInvoice).where(
        VendorInvoice.id == invoice_id,
        VendorInvoice.vendor_id == vendor.user_id
    )
    result = await db.execute(stmt)
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Check if invoice is still pending (can only update pending invoices)
    if invoice.status != InvoiceStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update invoice that has already been processed"
        )
    
    # Update invoice fields
    update_data = invoice_data.model_dump(exclude_unset=True)
    if update_data:
        update_data['updated_at'] = datetime.utcnow()
        stmt = update(VendorInvoice).where(VendorInvoice.id == invoice_id).values(**update_data)
        await db.execute(stmt)
        await db.commit()
    
    return SuccessResponse(
        success=True,
        message="Invoice updated successfully"
    )

# Dashboard Statistics
@router.get("/dashboard/stats")
async def get_vendor_dashboard_stats(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get vendor dashboard statistics."""
    vendor = await get_current_vendor(current_user, db)
    
    # Get total orders
    total_orders_stmt = select(Transaction).where(Transaction.vendor_id == vendor.user_id)
    total_orders_result = await db.execute(total_orders_stmt)
    total_orders = len(total_orders_result.scalars().all())
    
    # Get pending orders
    pending_orders_stmt = select(Transaction).where(
        Transaction.vendor_id == vendor.user_id,
        Transaction.status == 'pending'
    )
    pending_orders_result = await db.execute(pending_orders_stmt)
    pending_orders = len(pending_orders_result.scalars().all())
    
    # Get completed orders
    completed_orders_stmt = select(Transaction).where(
        Transaction.vendor_id == vendor.user_id,
        Transaction.status == 'completed'
    )
    completed_orders_result = await db.execute(completed_orders_stmt)
    completed_orders = len(completed_orders_result.scalars().all())
    
    # Get total invoices
    total_invoices_stmt = select(VendorInvoice).where(VendorInvoice.vendor_id == vendor.user_id)
    total_invoices_result = await db.execute(total_invoices_stmt)
    total_invoices = len(total_invoices_result.scalars().all())
    
    # Get pending invoices
    pending_invoices_stmt = select(VendorInvoice).where(
        VendorInvoice.vendor_id == vendor.user_id,
        VendorInvoice.status == InvoiceStatus.PENDING
    )
    pending_invoices_result = await db.execute(pending_invoices_stmt)
    pending_invoices = len(pending_invoices_result.scalars().all())
    
    return {
        "success": True,
        "data": {
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "completed_orders": completed_orders,
            "total_invoices": total_invoices,
            "pending_invoices": pending_invoices,
            "vendor_verified": vendor.verified
        }
    }

# Assigned Packages
@router.get("/assigned-packages", response_model=List[dict])
async def get_assigned_packages(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get donation packages assigned to the current vendor."""
    vendor = await get_current_vendor(current_user, db)
    
    stmt = select(DonationPackage).where(
        DonationPackage.assigned_vendor_id == vendor.user_id
    )
    result = await db.execute(stmt)
    packages = result.scalars().all()
    
    return [
        {
            "id": str(package.id),
            "title": package.title,
            "description": package.description,
            "amount": float(package.amount),
            "category": package.category,
            "target_quantity": package.target_quantity,
            "current_quantity": package.current_quantity,
            "status": package.status,
            "created_at": package.created_at.isoformat()
        }
        for package in packages
    ]