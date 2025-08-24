from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from enum import Enum
import uuid

# Enums
class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    NGO = "ngo"
    VENDOR = "vendor"

class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class InvoiceStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class PackageStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    COMPLETED = "completed"

class TransactionStatus(str, Enum):
    PENDING_ADMIN_ASSIGNMENT = "pending_admin_assignment"
    ASSIGNED_TO_VENDOR = "assigned_to_vendor"
    VENDOR_PROCESSING = "vendor_processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ISSUE_REPORTED = "issue_reported"

class TicketStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class TicketPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TicketCategory(str, Enum):
    DELIVERY_DELAY = "delivery_delay"
    QUALITY_ISSUE = "quality_issue"
    MISSING_ITEMS = "missing_items"
    WRONG_DELIVERY = "wrong_delivery"
    INVOICE_ISSUE = "invoice_issue"
    TRACKING_ISSUE = "tracking_issue"
    OTHER = "other"

# Base schemas
class BaseSchema(BaseModel):
    class Config:
        from_attributes = True
        use_enum_values = True

# Profile schemas
class ProfileBase(BaseSchema):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    role: UserRole = UserRole.USER
    is_approved: bool = False
    approval_status: ApprovalStatus = ApprovalStatus.PENDING

class ProfileCreate(ProfileBase):
    password: str = Field(..., min_length=6)
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class ProfileUpdate(BaseSchema):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None

class ProfileResponse(ProfileBase):
    id: uuid.UUID
    user_id: uuid.UUID
    approved_by: Optional[uuid.UUID] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class ProfileLogin(BaseSchema):
    email: EmailStr
    password: str

# NGO schemas
class NGOBase(BaseSchema):
    name: str
    description: str
    mission: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    gallery_images: Optional[str] = None  # JSON array of image URLs
    started_date: datetime
    license_number: Optional[str] = None  # Optional
    total_members: int
    full_address: str
    pin_code: str = Field(..., min_length=6, max_length=10)
    city: str
    state: str
    country: str = "India"
    phone: str
    email: EmailStr
    registration_number: Optional[str] = None

class NGOCreate(NGOBase):
    pass

class NGOUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    mission: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    gallery_images: Optional[str] = None
    started_date: Optional[datetime] = None
    license_number: Optional[str] = None
    total_members: Optional[int] = None
    full_address: Optional[str] = None
    pin_code: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    registration_number: Optional[str] = None

class NGOResponse(NGOBase):
    id: uuid.UUID
    user_id: uuid.UUID
    verified: bool
    created_at: datetime
    updated_at: datetime
    # Additional fields from join
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    user_email: Optional[str] = None

# Vendor schemas
class VendorBase(BaseSchema):
    shop_name: str
    owner_name: str
    description: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    shop_location: str
    full_address: str
    pin_code: str = Field(..., min_length=6, max_length=10)
    city: str
    state: str
    country: str = "India"
    phone: str
    email: EmailStr
    gst_number: str = Field(..., min_length=15, max_length=15)
    business_type: str
    business_license: Optional[str] = None  # Optional license document URL

class VendorCreate(VendorBase):
    pass

class VendorUpdate(BaseSchema):
    shop_name: Optional[str] = None
    owner_name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    logo_url: Optional[str] = None
    shop_location: Optional[str] = None
    full_address: Optional[str] = None
    pin_code: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    gst_number: Optional[str] = None
    business_type: Optional[str] = None
    business_license: Optional[str] = None

class VendorResponse(VendorBase):
    id: uuid.UUID
    user_id: uuid.UUID
    verified: bool
    created_at: datetime
    updated_at: datetime

# Package schemas
class PackageBase(BaseSchema):
    title: str
    description: Optional[str] = None
    amount: Decimal = Field(..., decimal_places=2)
    image_url: Optional[str] = None
    category: Optional[str] = None
    target_quantity: Optional[int] = None
    current_quantity: int = 0
    status: PackageStatus = PackageStatus.ACTIVE

class PackageCreate(PackageBase):
    ngo_id: uuid.UUID

class PackageUpdate(BaseSchema):
    title: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    target_quantity: Optional[int] = None
    current_quantity: Optional[int] = None
    status: Optional[PackageStatus] = None

class PackageResponse(PackageBase):
    id: uuid.UUID
    ngo_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

# Donation schemas
class DonationBase(BaseSchema):
    ngo_id: str
    package_id: str
    package_title: str
    package_amount: Decimal = Field(..., decimal_places=2)
    quantity: int = 1
    total_amount: Decimal = Field(..., decimal_places=2)
    payment_method: str = "card"
    payment_status: str = "pending"
    transaction_id: Optional[str] = None
    invoice_number: Optional[str] = None

class DonationCreate(DonationBase):
    pass

class DonationUpdate(BaseSchema):
    payment_status: Optional[str] = None
    transaction_id: Optional[str] = None

class DonationResponse(DonationBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

# Transaction schemas
class TransactionBase(BaseSchema):
    package_id: uuid.UUID
    ngo_id: uuid.UUID
    vendor_id: Optional[uuid.UUID] = None
    status: TransactionStatus = TransactionStatus.PENDING_ADMIN_ASSIGNMENT
    tracking_number: Optional[str] = None
    delivery_note_url: Optional[str] = None
    invoice_url: Optional[str] = None
    admin_notes: Optional[str] = None
    vendor_notes: Optional[str] = None

class TransactionCreate(TransactionBase):
    donation_id: uuid.UUID
    donor_user_id: uuid.UUID

class TransactionUpdate(BaseSchema):
    vendor_id: Optional[uuid.UUID] = None
    status: Optional[TransactionStatus] = None
    tracking_number: Optional[str] = None
    delivery_note_url: Optional[str] = None
    invoice_url: Optional[str] = None
    admin_notes: Optional[str] = None
    vendor_notes: Optional[str] = None

class TransactionResponse(TransactionBase):
    id: uuid.UUID
    donation_id: uuid.UUID
    donor_user_id: uuid.UUID
    assigned_at: Optional[datetime] = None
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

# Ticket schemas
class TicketBase(BaseSchema):
    title: str
    description: str
    status: TicketStatus = TicketStatus.OPEN
    priority: TicketPriority = TicketPriority.MEDIUM
    category: TicketCategory
    assigned_to_user_id: Optional[uuid.UUID] = None
    resolution_notes: Optional[str] = None

class TicketCreate(TicketBase):
    transaction_id: uuid.UUID

class TicketUpdate(BaseSchema):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    category: Optional[TicketCategory] = None
    assigned_to_user_id: Optional[uuid.UUID] = None
    resolution_notes: Optional[str] = None

class TicketResponse(TicketBase):
    id: uuid.UUID
    transaction_id: uuid.UUID
    created_by_user_id: uuid.UUID
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

# Authentication schemas
class Token(BaseSchema):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseSchema):
    user_id: Optional[uuid.UUID] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None

class AuthResponse(BaseSchema):
    success: bool
    message: str
    data: dict

# Generic response schemas
class SuccessResponse(BaseSchema):
    success: bool = True
    message: str
    data: Optional[dict] = None
    count: Optional[int] = None

class ErrorResponse(BaseSchema):
    success: bool = False
    message: str
    error: Optional[str] = None

# Application Settings schemas
class ApplicationSettingsBase(BaseSchema):
    app_name: str = "Do Good Hub"
    app_logo_url: Optional[str] = None
    app_description: Optional[str] = None
    admin_email: EmailStr = "shibinsp43@gmail.com"
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None

class ApplicationSettingsCreate(ApplicationSettingsBase):
    pass

class ApplicationSettingsUpdate(BaseSchema):
    app_name: Optional[str] = None
    app_logo_url: Optional[str] = None
    app_description: Optional[str] = None
    admin_email: Optional[EmailStr] = None
    smtp_host: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_username: Optional[str] = None
    smtp_password: Optional[str] = None

class ApplicationSettingsResponse(ApplicationSettingsBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

# Vendor Invoice schemas
class VendorInvoiceBase(BaseSchema):
    invoice_number: str
    invoice_url: str
    invoice_amount: Decimal = Field(..., decimal_places=2)
    submitted_date: datetime
    status: InvoiceStatus = InvoiceStatus.PENDING
    admin_notes: Optional[str] = None

class VendorInvoiceCreate(VendorInvoiceBase):
    transaction_id: uuid.UUID
    vendor_id: uuid.UUID

class VendorInvoiceUpdate(BaseSchema):
    status: Optional[InvoiceStatus] = None
    admin_notes: Optional[str] = None

class VendorInvoiceResponse(VendorInvoiceBase):
    id: uuid.UUID
    transaction_id: uuid.UUID
    vendor_id: uuid.UUID
    approved_by: Optional[uuid.UUID] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

# Donation Package schemas
class DonationPackageBase(BaseSchema):
    title: str
    description: str
    amount: Decimal = Field(..., decimal_places=2)
    image_url: Optional[str] = None
    category: str
    target_quantity: int
    current_quantity: int = 0
    assigned_vendor_id: Optional[uuid.UUID] = None
    status: PackageStatus = PackageStatus.ACTIVE

class DonationPackageCreate(DonationPackageBase):
    created_by: uuid.UUID

class DonationPackageUpdate(BaseSchema):
    title: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    target_quantity: Optional[int] = None
    current_quantity: Optional[int] = None
    assigned_vendor_id: Optional[uuid.UUID] = None
    status: Optional[PackageStatus] = None

class DonationPackageResponse(DonationPackageBase):
    id: uuid.UUID
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime

# Registration schemas
class NGORegistration(BaseSchema):
    # Profile fields
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    password: str = Field(..., min_length=6)
    # NGO specific fields
    name: str
    description: str
    started_date: datetime
    license_number: Optional[str] = None
    total_members: int
    full_address: str
    pin_code: str = Field(..., min_length=6, max_length=10)
    city: str
    state: str
    country: str = "India"
    registration_number: Optional[str] = None
    website: Optional[str] = None
    mission: Optional[str] = None

class VendorRegistration(BaseSchema):
    # Profile fields
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    password: str = Field(..., min_length=6)
    # Vendor specific fields
    shop_name: str
    owner_name: str
    shop_location: str
    full_address: str
    pin_code: str = Field(..., min_length=6, max_length=10)
    city: str
    state: str
    country: str = "India"
    gst_number: str = Field(..., min_length=15, max_length=15)
    business_type: str
    business_license: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None

# Approval schemas
class ApprovalRequest(BaseSchema):
    user_id: uuid.UUID
    approval_status: ApprovalStatus
    admin_notes: Optional[str] = None