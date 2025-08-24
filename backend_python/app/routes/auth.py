from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import timedelta, datetime
import uuid
import logging
import traceback

from ..database.connection import get_db_session
from ..models.models import Profile, NGO, Vendor, ApplicationSettings
from ..schemas.schemas import (
    ProfileCreate, ProfileLogin, ProfileResponse, 
    Token, AuthResponse, SuccessResponse, NGORegistration, VendorRegistration,
    ApprovalRequest, ApprovalStatus, UserRole
)
from ..middleware.auth import (
    verify_password, get_password_hash, create_access_token,
    get_current_active_user, ACCESS_TOKEN_EXPIRE_MINUTES
)
from ..utils.email_service import email_service

router = APIRouter(tags=["authentication"])

@router.post("/register", response_model=AuthResponse)
async def register_user(
    user_data: ProfileCreate,
    db: AsyncSession = Depends(get_db_session)
):
    """Register a new user."""
    logger = logging.getLogger(__name__)
    logger.info(f"Registration attempt for email: {user_data.email}")
    
    try:
        # Validate input data
        if not user_data.email or not user_data.password:
            logger.warning(f"Invalid registration data: missing email or password for {user_data.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email and password are required"
            )
        
        # Check if user already exists
        stmt = select(Profile).where(Profile.email == user_data.email)
        result = await db.execute(stmt)
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            logger.warning(f"Registration failed: User already exists with email {user_data.email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Create new user
        user_id = uuid.uuid4()
        hashed_password = get_password_hash(user_data.password)
        
        new_user = Profile(
            id=uuid.uuid4(),
            user_id=user_id,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            email=user_data.email,
            phone=user_data.phone,
            role=user_data.role or 'user',
            password_hash=hashed_password
        )
        
        logger.info(f"Creating new user with role: {new_user.role} for email: {user_data.email}")
        
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": str(new_user.user_id),
                "email": new_user.email,
                "role": new_user.role
            },
            expires_delta=access_token_expires
        )
        
        logger.info(f"User registration successful for email: {user_data.email}")
        
        return AuthResponse(
            success=True,
            message="User registered successfully",
            data={
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": str(new_user.id),
                    "user_id": str(new_user.user_id),
                    "email": new_user.email,
                    "first_name": new_user.first_name,
                    "last_name": new_user.last_name,
                    "role": new_user.role
                }
            }
        )
        
    except HTTPException as he:
        logger.error(f"HTTP Exception during registration for {user_data.email}: {he.detail}")
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"Unexpected error during registration for {user_data.email}: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to register user: {str(e)}"
        )

@router.post("/login", response_model=AuthResponse)
async def login_user(
    login_data: ProfileLogin,
    db: AsyncSession = Depends(get_db_session)
):
    """Authenticate user and return access token."""
    logger = logging.getLogger(__name__)
    logger.info(f"Login attempt for email: {login_data.email}")
    
    try:
        # Find user by email
        stmt = select(Profile).where(Profile.email == login_data.email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            logger.warning(f"User not found: {login_data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        logger.info(f"User found: {user.email}, role: {user.role}")
        
        # Verify password
        password_valid = verify_password(login_data.password, user.password_hash)
        logger.info(f"Password verification result: {password_valid}")
        
        if not password_valid:
            logger.warning(f"Invalid password for user: {login_data.email}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Note: Approval system has been simplified - all users can login after registration
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={
                "sub": str(user.user_id),
                "email": user.email,
                "role": user.role
            },
            expires_delta=access_token_expires
        )
        
        # Send welcome email after successful login
        try:
            user_full_name = f"{user.first_name} {user.last_name}".strip() or user.email
            await email_service.send_login_welcome_email(
                db=db,
                user_name=user_full_name,
                user_email=user.email,
                user_role=user.role
            )
        except Exception as email_error:
            # Log email error but don't fail the login
            logging.error(f"Failed to send welcome email to {user.email}: {email_error}")
        
        return AuthResponse(
            success=True,
            message="Login successful",
            data={
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": str(user.id),
                    "user_id": str(user.user_id),
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )

@router.get("/me", response_model=ProfileResponse)
async def get_current_user_info(
    current_user: Profile = Depends(get_current_active_user)
):
    """Get current authenticated user information."""
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

@router.post("/logout", response_model=SuccessResponse)
async def logout_user():
    """Logout user (client-side token removal)."""
    return SuccessResponse(
        success=True,
        message="Logged out successfully. Please remove the token from client storage."
    )

@router.post("/register/ngo", response_model=SuccessResponse)
async def register_ngo(
    ngo_data: NGORegistration,
    db: AsyncSession = Depends(get_db_session)
):
    """Register a new NGO (requires admin approval)."""
    try:
        # Check if user already exists
        stmt = select(Profile).where(Profile.email == ngo_data.email)
        result = await db.execute(stmt)
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Create new profile
        user_id = uuid.uuid4()
        hashed_password = get_password_hash(ngo_data.password)
        
        new_profile = Profile(
            id=uuid.uuid4(),
            user_id=user_id,
            first_name=ngo_data.first_name,
            last_name=ngo_data.last_name,
            email=ngo_data.email,
            phone=ngo_data.phone,
            role=UserRole.NGO,
            password_hash=hashed_password,
            is_approved=False,
            approval_status=ApprovalStatus.PENDING
        )
        
        # Create NGO record
        new_ngo = NGO(
            id=uuid.uuid4(),
            user_id=user_id,
            name=ngo_data.name,
            description=ngo_data.description,
            started_date=ngo_data.started_date,
            license_number=ngo_data.license_number,
            total_members=ngo_data.total_members,
            full_address=ngo_data.full_address,
            pin_code=ngo_data.pin_code,
            city=ngo_data.city,
            state=ngo_data.state,
            country=ngo_data.country,
            registration_number=ngo_data.registration_number,
            website=ngo_data.website,
            mission=ngo_data.mission,
            verified=False
        )
        
        db.add(new_profile)
        db.add(new_ngo)
        await db.commit()
        
        # Send email notification to admin
        registration_details = {
            "ngo_name": ngo_data.name,
            "description": ngo_data.description,
            "website": ngo_data.website,
            "started_date": str(ngo_data.started_date) if ngo_data.started_date else None,
            "license_number": ngo_data.license_number,
            "total_members": ngo_data.total_members,
            "full_address": ngo_data.full_address,
            "pin_code": ngo_data.pin_code,
            "city": ngo_data.city,
            "state": ngo_data.state,
            "phone": ngo_data.phone,
            "email": ngo_data.email,
            "registration_number": ngo_data.registration_number,
            "mission": ngo_data.mission
        }
        
        try:
            await email_service.send_registration_approval_request(
                db=db,
                user_name=ngo_data.name,
                user_email=ngo_data.email,
                user_role=UserRole.NGO,
                registration_details=registration_details
            )
        except Exception as e:
            # Log error but don't fail registration
            print(f"Failed to send email notification: {e}")
        
        return SuccessResponse(
            success=True,
            message="NGO registration submitted successfully. Please wait for admin approval."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register NGO"
        )

@router.post("/register/vendor", response_model=SuccessResponse)
async def register_vendor(
    vendor_data: VendorRegistration,
    db: AsyncSession = Depends(get_db_session)
):
    """Register a new Vendor (requires admin approval)."""
    try:
        # Check if user already exists
        stmt = select(Profile).where(Profile.email == vendor_data.email)
        result = await db.execute(stmt)
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        
        # Create new profile
        user_id = uuid.uuid4()
        hashed_password = get_password_hash(vendor_data.password)
        
        new_profile = Profile(
            id=uuid.uuid4(),
            user_id=user_id,
            first_name=vendor_data.first_name,
            last_name=vendor_data.last_name,
            email=vendor_data.email,
            phone=vendor_data.phone,
            role=UserRole.VENDOR,
            password_hash=hashed_password,
            is_approved=False,
            approval_status=ApprovalStatus.PENDING
        )
        
        # Create Vendor record
        new_vendor = Vendor(
            id=uuid.uuid4(),
            user_id=user_id,
            shop_name=vendor_data.shop_name,
            owner_name=vendor_data.owner_name,
            shop_location=vendor_data.shop_location,
            full_address=vendor_data.full_address,
            pin_code=vendor_data.pin_code,
            city=vendor_data.city,
            state=vendor_data.state,
            country=vendor_data.country,
            gst_number=vendor_data.gst_number,
            business_type=vendor_data.business_type,
            business_license=vendor_data.business_license,
            description=vendor_data.description,
            website=vendor_data.website,
            verified=False
        )
        
        db.add(new_profile)
        db.add(new_vendor)
        await db.commit()
        
        # Send email notification to admin
        registration_details = {
            "shop_name": vendor_data.shop_name,
            "owner_name": vendor_data.owner_name,
            "shop_location": vendor_data.shop_location,
            "full_address": vendor_data.full_address,
            "pin_code": vendor_data.pin_code,
            "city": vendor_data.city,
            "state": vendor_data.state,
            "country": vendor_data.country,
            "gst_number": vendor_data.gst_number,
            "business_type": vendor_data.business_type,
            "business_license": vendor_data.business_license,
            "description": vendor_data.description,
            "website": vendor_data.website,
            "phone": vendor_data.phone,
            "email": vendor_data.email
        }
        
        try:
            await email_service.send_registration_approval_request(
                db=db,
                user_name=vendor_data.shop_name,
                user_email=vendor_data.email,
                user_role=UserRole.VENDOR,
                registration_details=registration_details
            )
        except Exception as e:
            # Log error but don't fail registration
            print(f"Failed to send email notification: {e}")
        
        return SuccessResponse(
            success=True,
            message="Vendor registration submitted successfully. Please wait for admin approval."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register vendor"
        )

@router.post("/admin/approve-user", response_model=SuccessResponse)
async def approve_user(
    approval_data: ApprovalRequest,
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Admin endpoint to approve/reject user registrations."""
    try:
        # Check if current user is admin
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can approve users"
            )
        
        # Find the user to approve
        stmt = select(Profile).where(Profile.user_id == approval_data.user_id)
        result = await db.execute(stmt)
        user_to_approve = result.scalar_one_or_none()
        
        if not user_to_approve:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update approval status
        user_to_approve.approval_status = approval_data.approval_status
        user_to_approve.is_approved = (approval_data.approval_status == ApprovalStatus.APPROVED)
        user_to_approve.approved_by = current_user.user_id
        user_to_approve.approved_at = datetime.utcnow()
        
        await db.commit()
        
        # Send email notification to user
        try:
            user_name = ""
            user_email = user_to_approve.email
            
            # Get user name based on role
            if user_to_approve.role == UserRole.NGO:
                ngo_stmt = select(NGO).where(NGO.user_id == user_to_approve.user_id)
                ngo_result = await db.execute(ngo_stmt)
                ngo = ngo_result.scalar_one_or_none()
                if ngo:
                    user_name = ngo.name
            elif user_to_approve.role == UserRole.VENDOR:
                vendor_stmt = select(Vendor).where(Vendor.user_id == user_to_approve.user_id)
                vendor_result = await db.execute(vendor_stmt)
                vendor = vendor_result.scalar_one_or_none()
                if vendor:
                    user_name = vendor.shop_name
            
            await email_service.send_approval_notification(
                db=db,
                user_name=user_name or f"{user_to_approve.first_name} {user_to_approve.last_name}",
                user_email=user_email,
                user_role=user_to_approve.role,
                approved=(approval_data.approval_status == ApprovalStatus.APPROVED),
                admin_notes=getattr(approval_data, 'notes', None)
            )
        except Exception as e:
            # Log error but don't fail approval process
            print(f"Failed to send approval notification email: {e}")
        
        status_message = "approved" if approval_data.approval_status == ApprovalStatus.APPROVED else "rejected"
        
        return SuccessResponse(
            success=True,
            message=f"User {status_message} successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user approval status"
        )

@router.get("/admin/pending-approvals")
async def get_pending_approvals(
    current_user: Profile = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Admin endpoint to get all pending user approvals."""
    try:
        # Check if current user is admin
        if current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can view pending approvals"
            )
        
        # Get all pending users
        stmt = select(Profile).where(
            Profile.approval_status == ApprovalStatus.PENDING,
            Profile.role.in_([UserRole.VENDOR, UserRole.NGO])
        )
        result = await db.execute(stmt)
        pending_users = result.scalars().all()
        
        return {
            "success": True,
            "data": [
                {
                    "id": str(user.id),
                    "user_id": str(user.user_id),
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email,
                    "phone": user.phone,
                    "role": user.role,
                    "created_at": user.created_at.isoformat(),
                    "approval_status": user.approval_status
                }
                for user in pending_users
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch pending approvals"
        )