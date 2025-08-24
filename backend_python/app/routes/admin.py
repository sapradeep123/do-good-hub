from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from datetime import datetime
from typing import List, Optional
import uuid

from ..database.connection import get_db_session
from ..models.models import (
    Profile, NGO, Vendor, ApplicationSettings, DonationPackage, 
    VendorInvoice, Transaction
)
from ..schemas.schemas import (
    NGOResponse, NGOUpdate, VendorResponse, VendorUpdate,
    ApplicationSettingsResponse, ApplicationSettingsUpdate, ApplicationSettingsCreate,
    DonationPackageResponse, DonationPackageCreate, DonationPackageUpdate,
    VendorInvoiceResponse, SuccessResponse, UserRole, ApprovalStatus
)
from ..middleware.auth import get_current_active_user
from ..utils.email_service import email_service

router = APIRouter(prefix="/admin", tags=["admin"])

# Helper function to check admin role
def check_admin_role(current_user: Profile):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can access this endpoint"
        )

# NGO Management
@router.get("/ngos", response_model=List[NGOResponse])
async def get_all_ngos(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get all NGOs (Admin only)."""
    check_admin_role(current_user)
    
    stmt = select(NGO).offset(skip).limit(limit)
    result = await db.execute(stmt)
    ngos = result.scalars().all()
    
    return [NGOResponse(
        id=ngo.id,
        user_id=ngo.user_id,
        name=ngo.name,
        description=ngo.description,
        website=ngo.website,
        logo_url=ngo.logo_url,
        full_address=ngo.full_address,
        city=ngo.city,
        state=ngo.state,
        country=ngo.country,
        pin_code=ngo.pin_code,
        phone=ngo.phone,
        email=ngo.email,
        registration_number=ngo.registration_number,
        started_date=ngo.started_date,
        license_number=ngo.license_number,
        total_members=ngo.total_members,
        mission=ngo.mission,
        gallery_images=ngo.gallery_images,
        verified=ngo.verified,
        created_at=ngo.created_at,
        updated_at=ngo.updated_at
    ) for ngo in ngos]

@router.get("/ngos/{ngo_id}", response_model=NGOResponse)
async def get_ngo_by_id(
    ngo_id: uuid.UUID,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get NGO by ID (Admin only)."""
    check_admin_role(current_user)
    
    stmt = select(NGO).where(NGO.id == ngo_id)
    result = await db.execute(stmt)
    ngo = result.scalar_one_or_none()
    
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
        website=ngo.website,
        logo_url=ngo.logo_url,
        full_address=ngo.full_address,
        city=ngo.city,
        state=ngo.state,
        country=ngo.country,
        pin_code=ngo.pin_code,
        phone=ngo.phone,
        email=ngo.email,
        registration_number=ngo.registration_number,
        started_date=ngo.started_date,
        license_number=ngo.license_number,
        total_members=ngo.total_members,
        mission=ngo.mission,
        gallery_images=ngo.gallery_images,
        verified=ngo.verified,
        created_at=ngo.created_at,
        updated_at=ngo.updated_at
    )

@router.put("/ngos/{ngo_id}", response_model=SuccessResponse)
async def update_ngo(
    ngo_id: uuid.UUID,
    ngo_data: NGOUpdate,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update NGO (Admin only)."""
    check_admin_role(current_user)
    
    # Check if NGO exists
    stmt = select(NGO).where(NGO.id == ngo_id)
    result = await db.execute(stmt)
    ngo = result.scalar_one_or_none()
    
    if not ngo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO not found"
        )
    
    # Update NGO fields
    update_data = ngo_data.model_dump(exclude_unset=True)
    if update_data:
        update_data['updated_at'] = datetime.utcnow()
        stmt = update(NGO).where(NGO.id == ngo_id).values(**update_data)
        await db.execute(stmt)
        await db.commit()
    
    return SuccessResponse(
        success=True,
        message="NGO updated successfully"
    )

@router.delete("/ngos/{ngo_id}", response_model=SuccessResponse)
async def delete_ngo(
    ngo_id: uuid.UUID,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete NGO (Admin only)."""
    check_admin_role(current_user)
    
    # Check if NGO exists
    stmt = select(NGO).where(NGO.id == ngo_id)
    result = await db.execute(stmt)
    ngo = result.scalar_one_or_none()
    
    if not ngo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="NGO not found"
        )
    
    # Delete associated profile first
    profile_stmt = delete(Profile).where(Profile.user_id == ngo.user_id)
    await db.execute(profile_stmt)
    
    # Delete NGO
    ngo_stmt = delete(NGO).where(NGO.id == ngo_id)
    await db.execute(ngo_stmt)
    
    await db.commit()
    
    return SuccessResponse(
        success=True,
        message="NGO deleted successfully"
    )

# Vendor Management
@router.get("/vendors", response_model=List[VendorResponse])
async def get_all_vendors(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get all Vendors (Admin only)."""
    check_admin_role(current_user)
    
    stmt = select(Vendor).offset(skip).limit(limit)
    result = await db.execute(stmt)
    vendors = result.scalars().all()
    
    return [VendorResponse(
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
    ) for vendor in vendors]

@router.put("/vendors/{vendor_id}", response_model=SuccessResponse)
async def update_vendor(
    vendor_id: uuid.UUID,
    vendor_data: VendorUpdate,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update Vendor (Admin only)."""
    check_admin_role(current_user)
    
    # Check if Vendor exists
    stmt = select(Vendor).where(Vendor.id == vendor_id)
    result = await db.execute(stmt)
    vendor = result.scalar_one_or_none()
    
    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor not found"
        )
    
    # Update Vendor fields with proper mapping from API fields to database columns
    update_data = vendor_data.model_dump(exclude_unset=True)
    if update_data:
        # Map API field names to database column names
        field_mapping = {
            'shop_name': 'company_name',
            'full_address': 'address',
            'shop_location': 'address'  # Both map to address in DB
        }
        
        # Create mapped update data
        mapped_update_data = {}
        for field, value in update_data.items():
            # Use mapped field name if it exists, otherwise use original field name
            db_field = field_mapping.get(field, field)
            mapped_update_data[db_field] = value
        
        mapped_update_data['updated_at'] = datetime.utcnow()
        stmt = update(Vendor).where(Vendor.id == vendor_id).values(**mapped_update_data)
        await db.execute(stmt)
        await db.commit()
    
    return SuccessResponse(
        success=True,
        message="Vendor updated successfully"
    )

@router.delete("/vendors/{vendor_id}", response_model=SuccessResponse)
async def delete_vendor(
    vendor_id: uuid.UUID,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete Vendor (Admin only)."""
    check_admin_role(current_user)
    
    # Check if Vendor exists
    stmt = select(Vendor).where(Vendor.id == vendor_id)
    result = await db.execute(stmt)
    vendor = result.scalar_one_or_none()
    
    if not vendor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor not found"
        )
    
    # Delete associated profile first
    profile_stmt = delete(Profile).where(Profile.user_id == vendor.user_id)
    await db.execute(profile_stmt)
    
    # Delete Vendor
    vendor_stmt = delete(Vendor).where(Vendor.id == vendor_id)
    await db.execute(vendor_stmt)
    
    await db.commit()
    
    return SuccessResponse(
        success=True,
        message="Vendor deleted successfully"
    )

# Application Settings Management
@router.get("/settings", response_model=ApplicationSettingsResponse)
async def get_application_settings(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get application settings (Admin only)."""
    check_admin_role(current_user)
    
    stmt = select(ApplicationSettings).limit(1)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    
    if not settings:
        # Create default settings if none exist
        settings = ApplicationSettings(
            id=uuid.uuid4(),
            app_name="Do Good Hub",
            admin_email="shibinsp43@gmail.com"
        )
        db.add(settings)
        await db.commit()
        await db.refresh(settings)
    
    return ApplicationSettingsResponse(
        id=settings.id,
        app_name=settings.app_name,
        app_logo_url=settings.app_logo_url,
        app_description=settings.app_description,
        admin_email=settings.admin_email,
        smtp_host=settings.smtp_host,
        smtp_port=settings.smtp_port,
        smtp_username=settings.smtp_username,
        smtp_password=settings.smtp_password,
        created_at=settings.created_at,
        updated_at=settings.updated_at
    )

@router.put("/settings", response_model=SuccessResponse)
async def update_application_settings(
    settings_data: ApplicationSettingsUpdate,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update application settings (Admin only)."""
    check_admin_role(current_user)
    
    # Get existing settings
    stmt = select(ApplicationSettings).limit(1)
    result = await db.execute(stmt)
    settings = result.scalar_one_or_none()
    
    if not settings:
        # Create new settings if none exist
        settings_dict = settings_data.model_dump(exclude_unset=True)
        settings_dict['id'] = uuid.uuid4()
        settings = ApplicationSettings(**settings_dict)
        db.add(settings)
    else:
        # Update existing settings
        update_data = settings_data.model_dump(exclude_unset=True)
        if update_data:
            update_data['updated_at'] = datetime.utcnow()
            stmt = update(ApplicationSettings).where(ApplicationSettings.id == settings.id).values(**update_data)
            await db.execute(stmt)
    
    await db.commit()
    
    return SuccessResponse(
        success=True,
        message="Application settings updated successfully"
    )

# Donation Package Management
@router.post("/donation-packages", response_model=SuccessResponse)
async def create_donation_package(
    package_data: DonationPackageCreate,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Create donation package (Admin only)."""
    check_admin_role(current_user)
    
    new_package = DonationPackage(
        id=uuid.uuid4(),
        title=package_data.title,
        description=package_data.description,
        amount=package_data.amount,
        image_url=package_data.image_url,
        category=package_data.category,
        target_quantity=package_data.target_quantity,
        current_quantity=package_data.current_quantity,
        assigned_vendor_id=package_data.assigned_vendor_id,
        status=package_data.status,
        created_by=current_user.user_id
    )
    
    db.add(new_package)
    await db.commit()
    
    return SuccessResponse(
        success=True,
        message="Donation package created successfully"
    )

@router.get("/donation-packages", response_model=List[DonationPackageResponse])
async def get_all_donation_packages(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get all donation packages (Admin only)."""
    check_admin_role(current_user)
    
    stmt = select(DonationPackage).offset(skip).limit(limit)
    result = await db.execute(stmt)
    packages = result.scalars().all()
    
    return [DonationPackageResponse(
        id=package.id,
        title=package.title,
        description=package.description,
        amount=package.amount,
        image_url=package.image_url,
        category=package.category,
        target_quantity=package.target_quantity,
        current_quantity=package.current_quantity,
        assigned_vendor_id=package.assigned_vendor_id,
        status=package.status,
        created_by=package.created_by,
        created_at=package.created_at,
        updated_at=package.updated_at
    ) for package in packages]

@router.put("/donation-packages/{package_id}", response_model=SuccessResponse)
async def update_donation_package(
    package_id: uuid.UUID,
    package_data: DonationPackageUpdate,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update donation package (Admin only)."""
    check_admin_role(current_user)
    
    # Check if package exists
    stmt = select(DonationPackage).where(DonationPackage.id == package_id)
    result = await db.execute(stmt)
    package = result.scalar_one_or_none()
    
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation package not found"
        )
    
    # Update package fields
    update_data = package_data.model_dump(exclude_unset=True)
    if update_data:
        update_data['updated_at'] = datetime.utcnow()
        stmt = update(DonationPackage).where(DonationPackage.id == package_id).values(**update_data)
        await db.execute(stmt)
        await db.commit()
    
    return SuccessResponse(
        success=True,
        message="Donation package updated successfully"
    )

@router.delete("/donation-packages/{package_id}", response_model=SuccessResponse)
async def delete_donation_package(
    package_id: uuid.UUID,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete donation package (Admin only)."""
    check_admin_role(current_user)
    
    # Check if package exists
    stmt = select(DonationPackage).where(DonationPackage.id == package_id)
    result = await db.execute(stmt)
    package = result.scalar_one_or_none()
    
    if not package:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation package not found"
        )
    
    # Delete package
    stmt = delete(DonationPackage).where(DonationPackage.id == package_id)
    await db.execute(stmt)
    await db.commit()
    
    return SuccessResponse(
        success=True,
        message="Donation package deleted successfully"
    )

# Vendor Invoice Management
@router.get("/vendor-invoices", response_model=List[VendorInvoiceResponse])
async def get_all_vendor_invoices(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100)
):
    """Get all vendor invoices for admin validation (Admin only)."""
    check_admin_role(current_user)
    
    stmt = select(VendorInvoice).offset(skip).limit(limit)
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

@router.put("/vendor-invoices/{invoice_id}/approve", response_model=SuccessResponse)
async def approve_vendor_invoice(
    invoice_id: uuid.UUID,
    admin_notes: Optional[str] = None,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Approve vendor invoice (Admin only)."""
    check_admin_role(current_user)
    
    # Check if invoice exists
    stmt = select(VendorInvoice).where(VendorInvoice.id == invoice_id)
    result = await db.execute(stmt)
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Update invoice status
    update_data = {
        'status': 'APPROVED',
        'admin_notes': admin_notes,
        'approved_by': current_user.user_id,
        'approved_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    stmt = update(VendorInvoice).where(VendorInvoice.id == invoice_id).values(**update_data)
    await db.execute(stmt)
    await db.commit()
    
    # Send email notification to vendor
    vendor_stmt = select(Vendor).where(Vendor.id == invoice.vendor_id)
    vendor_result = await db.execute(vendor_stmt)
    vendor = vendor_result.scalar_one_or_none()
    
    if vendor and vendor.email:
        await email_service.send_invoice_approval_notification(
            vendor_email=vendor.email,
            vendor_name=vendor.shop_name,
            invoice_number=invoice.invoice_number,
            invoice_amount=invoice.invoice_amount,
            admin_notes=admin_notes
        )
    
    return SuccessResponse(
        success=True,
        message="Invoice approved successfully"
    )

@router.put("/vendor-invoices/{invoice_id}/reject", response_model=SuccessResponse)
async def reject_vendor_invoice(
    invoice_id: uuid.UUID,
    admin_notes: str,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Reject vendor invoice (Admin only)."""
    check_admin_role(current_user)
    
    # Check if invoice exists
    stmt = select(VendorInvoice).where(VendorInvoice.id == invoice_id)
    result = await db.execute(stmt)
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Update invoice status
    update_data = {
        'status': 'REJECTED',
        'admin_notes': admin_notes,
        'approved_by': current_user.user_id,
        'approved_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    stmt = update(VendorInvoice).where(VendorInvoice.id == invoice_id).values(**update_data)
    await db.execute(stmt)
    await db.commit()
    
    # Send email notification to vendor
    vendor_stmt = select(Vendor).where(Vendor.id == invoice.vendor_id)
    vendor_result = await db.execute(vendor_stmt)
    vendor = vendor_result.scalar_one_or_none()
    
    if vendor and vendor.email:
        await email_service.send_invoice_rejection_notification(
            vendor_email=vendor.email,
            vendor_name=vendor.shop_name,
            invoice_number=invoice.invoice_number,
            invoice_amount=invoice.invoice_amount,
            admin_notes=admin_notes
        )
    
    return SuccessResponse(
        success=True,
        message="Invoice rejected successfully"
    )