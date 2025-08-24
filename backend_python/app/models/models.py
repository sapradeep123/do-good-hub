from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, CheckConstraint, DECIMAL
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.database.connection import Base

class Profile(Base):
    __tablename__ = "profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4)
    first_name = Column(Text)
    last_name = Column(Text)
    email = Column(Text, nullable=False)
    phone = Column(Text)
    password_hash = Column(Text)
    role = Column(Text, nullable=False, default='user')
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    __table_args__ = (
        CheckConstraint("role IN ('user', 'admin', 'ngo', 'vendor')", name='check_role'),
    )
    
    # Relationships
    ngos = relationship("NGO", back_populates="profile", cascade="all, delete-orphan")
    vendors = relationship("Vendor", back_populates="profile", cascade="all, delete-orphan")
    donations = relationship("Donation", back_populates="profile", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="donor_profile", cascade="all, delete-orphan")
    created_tickets = relationship("Ticket", foreign_keys="[Ticket.created_by_user_id]", back_populates="creator", cascade="all, delete-orphan")
    assigned_tickets = relationship("Ticket", foreign_keys="[Ticket.assigned_to_user_id]", back_populates="assignee")

class NGO(Base):
    __tablename__ = "ngos"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('profiles.user_id', ondelete='CASCADE'), nullable=False)
    name = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    mission = Column(Text)
    website = Column(Text)
    logo_url = Column(Text)
    gallery_images = Column(Text)  # JSON array of image URLs
    started_date = Column(DateTime(timezone=True), nullable=False)
    license_number = Column(Text)  # Optional
    total_members = Column(Integer, nullable=False)
    full_address = Column(Text, nullable=False)
    pin_code = Column(String(10), nullable=False)
    city = Column(Text, nullable=False)
    state = Column(Text, nullable=False)
    country = Column(Text, default='India')
    phone = Column(Text, nullable=False)
    email = Column(Text, nullable=False)
    registration_number = Column(Text)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    profile = relationship("Profile", back_populates="ngos")
    packages = relationship("Package", back_populates="ngo", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="ngo")

class Vendor(Base):
    __tablename__ = "vendors"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('profiles.user_id', ondelete='CASCADE'), nullable=False)
    company_name = Column(Text, nullable=False)  # This is the actual DB column
    description = Column(Text)
    website = Column(Text)
    logo_url = Column(Text)
    address = Column(Text, nullable=False)  # This is the actual DB column
    city = Column(Text, nullable=False)
    state = Column(Text, nullable=False)
    country = Column(Text, default='India')
    phone = Column(Text, nullable=False)
    email = Column(Text, nullable=False)
    business_type = Column(Text, nullable=False)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    profile = relationship("Profile", back_populates="vendors")
    transactions = relationship("Transaction", back_populates="vendor")

class Package(Base):
    __tablename__ = "packages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ngo_id = Column(UUID(as_uuid=True), ForeignKey('ngos.id', ondelete='CASCADE'), nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text)
    amount = Column(DECIMAL(10, 2), nullable=False)
    image_url = Column(Text)
    category = Column(Text)
    target_quantity = Column(Integer)
    current_quantity = Column(Integer, default=0)
    status = Column(Text, nullable=False, default='active')
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    __table_args__ = (
        CheckConstraint("status IN ('active', 'inactive', 'completed')", name='check_package_status'),
    )
    
    # Relationships
    ngo = relationship("NGO", back_populates="packages")

class Donation(Base):
    __tablename__ = "donations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('profiles.user_id', ondelete='CASCADE'), nullable=False)
    ngo_id = Column(Text, nullable=False)
    package_id = Column(Text, nullable=False)
    package_title = Column(Text, nullable=False)
    package_amount = Column(DECIMAL(10, 2), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    payment_method = Column(Text, nullable=False, default='card')
    payment_status = Column(Text, nullable=False, default='pending')
    transaction_id = Column(Text)
    invoice_number = Column(Text, unique=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    profile = relationship("Profile", back_populates="donations")
    transactions = relationship("Transaction", back_populates="donation", cascade="all, delete-orphan")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    donation_id = Column(UUID(as_uuid=True), ForeignKey('donations.id', ondelete='CASCADE'), nullable=False)
    package_id = Column(UUID(as_uuid=True), nullable=False)
    ngo_id = Column(UUID(as_uuid=True), ForeignKey('ngos.id'), nullable=False)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey('vendors.id'))
    donor_user_id = Column(UUID(as_uuid=True), ForeignKey('profiles.user_id', ondelete='CASCADE'), nullable=False)
    status = Column(Text, nullable=False, default='pending_admin_assignment')
    tracking_number = Column(Text)
    delivery_note_url = Column(Text)
    invoice_url = Column(Text)
    admin_notes = Column(Text)
    vendor_notes = Column(Text)
    assigned_at = Column(DateTime(timezone=True))
    shipped_at = Column(DateTime(timezone=True))
    delivered_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending_admin_assignment', 'assigned_to_vendor', 'vendor_processing', 'shipped', 'delivered', 'completed', 'cancelled', 'issue_reported')",
            name='check_transaction_status'
        ),
    )
    
    # Relationships
    donation = relationship("Donation", back_populates="transactions")
    ngo = relationship("NGO", back_populates="transactions")
    vendor = relationship("Vendor", back_populates="transactions")
    donor_profile = relationship("Profile", back_populates="transactions")
    tickets = relationship("Ticket", back_populates="transaction", cascade="all, delete-orphan")

class Ticket(Base):
    __tablename__ = "tickets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey('transactions.id', ondelete='CASCADE'), nullable=False)
    created_by_user_id = Column(UUID(as_uuid=True), ForeignKey('profiles.user_id', ondelete='CASCADE'), nullable=False)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Text, nullable=False, default='open')
    priority = Column(Text, nullable=False, default='medium')
    category = Column(Text, nullable=False)
    assigned_to_user_id = Column(UUID(as_uuid=True), ForeignKey('profiles.user_id'))
    resolution_notes = Column(Text)
    resolved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    __table_args__ = (
        CheckConstraint("status IN ('open', 'in_progress', 'resolved', 'closed')", name='check_ticket_status'),
        CheckConstraint("priority IN ('low', 'medium', 'high', 'urgent')", name='check_ticket_priority'),
        CheckConstraint(
            "category IN ('delivery_delay', 'quality_issue', 'missing_items', 'wrong_delivery', 'invoice_issue', 'tracking_issue', 'other')",
            name='check_ticket_category'
        ),
    )
    
    # Relationships
    transaction = relationship("Transaction", back_populates="tickets")
    creator = relationship("Profile", foreign_keys=[created_by_user_id], back_populates="created_tickets")
    assignee = relationship("Profile", foreign_keys=[assigned_to_user_id], back_populates="assigned_tickets")

class ApplicationSettings(Base):
    __tablename__ = "application_settings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    app_name = Column(Text, nullable=False, default='Do Good Hub')
    app_logo_url = Column(Text)
    app_description = Column(Text)
    admin_email = Column(Text, nullable=False, default='shibinsp43@gmail.com')
    smtp_host = Column(Text)
    smtp_port = Column(Integer)
    smtp_username = Column(Text)
    smtp_password = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

class VendorInvoice(Base):
    __tablename__ = "vendor_invoices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey('transactions.id', ondelete='CASCADE'), nullable=False)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey('vendors.id', ondelete='CASCADE'), nullable=False)
    invoice_number = Column(Text, nullable=False, unique=True)
    invoice_url = Column(Text, nullable=False)
    invoice_amount = Column(DECIMAL(10, 2), nullable=False)
    submitted_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(Text, nullable=False, default='pending')
    admin_notes = Column(Text)
    approved_by = Column(UUID(as_uuid=True), ForeignKey('profiles.user_id'))
    approved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'approved', 'rejected')", name='check_invoice_status'),
    )
    
    # Relationships
    transaction = relationship("Transaction")
    vendor = relationship("Vendor")
    approver = relationship("Profile")

class DonationPackage(Base):
    __tablename__ = "donation_packages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    amount = Column(DECIMAL(10, 2), nullable=False)
    image_url = Column(Text)
    category = Column(Text, nullable=False)
    target_quantity = Column(Integer, nullable=False)
    current_quantity = Column(Integer, default=0)
    assigned_vendor_id = Column(UUID(as_uuid=True), ForeignKey('vendors.id'))
    status = Column(Text, nullable=False, default='active')
    created_by = Column(UUID(as_uuid=True), ForeignKey('profiles.user_id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    __table_args__ = (
        CheckConstraint("status IN ('active', 'inactive', 'completed')", name='check_donation_package_status'),
    )
    
    # Relationships
    assigned_vendor = relationship("Vendor")
    creator = relationship("Profile")