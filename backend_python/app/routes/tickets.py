from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import uuid

from ..database.connection import get_db_session
from ..models.models import Ticket
from ..schemas.schemas import (
    TicketCreate, TicketUpdate, TicketResponse, SuccessResponse
)
from ..middleware.auth import (
    get_current_active_user, require_admin
)

router = APIRouter(tags=["tickets"])

@router.get("/", response_model=List[TicketResponse])
async def get_all_tickets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get tickets. Users can see their own tickets, admins can see all."""
    try:
        stmt = select(Ticket)
        
        # Apply user-based filtering
        if current_user.role != "admin":
            stmt = stmt.where(Ticket.user_id == current_user.user_id)
        
        # Apply additional filters (admin only for user_id filter)
        if user_id and current_user.role == "admin":
            stmt = stmt.where(Ticket.user_id == user_id)
        if status:
            stmt = stmt.where(Ticket.status == status)
        if priority:
            stmt = stmt.where(Ticket.priority == priority)
        if category:
            stmt = stmt.where(Ticket.category == category)
        
        stmt = (
            stmt.offset(skip)
            .limit(limit)
            .order_by(Ticket.created_at.desc())
        )
        
        result = await db.execute(stmt)
        tickets = result.scalars().all()
        
        return [
            TicketResponse(
                id=ticket.id,
                user_id=ticket.user_id,
                title=ticket.title,
                description=ticket.description,
                category=ticket.category,
                priority=ticket.priority,
                status=ticket.status,
                assigned_to=ticket.assigned_to,
                resolution=ticket.resolution,
                created_at=ticket.created_at,
                updated_at=ticket.updated_at,
                resolved_at=ticket.resolved_at
            )
            for ticket in tickets
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch tickets"
        )

@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket_by_id(
    ticket_id: uuid.UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get a specific ticket by ID. Users can only see their own tickets."""
    try:
        stmt = select(Ticket).where(Ticket.id == ticket_id)
        
        # Non-admin users can only see their own tickets
        if current_user.role != "admin":
            stmt = stmt.where(Ticket.user_id == current_user.user_id)
        
        result = await db.execute(stmt)
        ticket = result.scalar_one_or_none()
        
        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found"
            )
        
        return TicketResponse(
            id=ticket.id,
            user_id=ticket.user_id,
            title=ticket.title,
            description=ticket.description,
            category=ticket.category,
            priority=ticket.priority,
            status=ticket.status,
            assigned_to=ticket.assigned_to,
            resolution=ticket.resolution,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
            resolved_at=ticket.resolved_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch ticket"
        )

@router.post("/", response_model=TicketResponse)
async def create_ticket(
    ticket_data: TicketCreate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new ticket."""
    try:
        # Create new ticket
        new_ticket = Ticket(
            id=uuid.uuid4(),
            user_id=current_user.user_id,
            title=ticket_data.title,
            description=ticket_data.description,
            category=ticket_data.category,
            priority=ticket_data.priority or "medium",
            status="open",  # New tickets are always open
            assigned_to=ticket_data.assigned_to
        )
        
        db.add(new_ticket)
        await db.commit()
        await db.refresh(new_ticket)
        
        return TicketResponse(
            id=new_ticket.id,
            user_id=new_ticket.user_id,
            title=new_ticket.title,
            description=new_ticket.description,
            category=new_ticket.category,
            priority=new_ticket.priority,
            status=new_ticket.status,
            assigned_to=new_ticket.assigned_to,
            resolution=new_ticket.resolution,
            created_at=new_ticket.created_at,
            updated_at=new_ticket.updated_at,
            resolved_at=new_ticket.resolved_at
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create ticket"
        )

@router.put("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(
    ticket_id: uuid.UUID,
    ticket_data: TicketUpdate,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update a ticket. Users can update their own tickets, admins can update any."""
    try:
        # Get the ticket
        stmt = select(Ticket).where(Ticket.id == ticket_id)
        
        # Non-admin users can only update their own tickets
        if current_user.role != "admin":
            stmt = stmt.where(Ticket.user_id == current_user.user_id)
        
        result = await db.execute(stmt)
        ticket = result.scalar_one_or_none()
        
        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found or not authorized"
            )
        
        # Update ticket fields
        update_data = ticket_data.dict(exclude_unset=True)
        
        # Handle status changes
        if "status" in update_data:
            new_status = update_data["status"]
            
            # Set resolved_at when ticket is resolved or closed
            if new_status in ["resolved", "closed"] and ticket.status not in ["resolved", "closed"]:
                from datetime import datetime
                ticket.resolved_at = datetime.utcnow()
            # Clear resolved_at if ticket is reopened
            elif new_status not in ["resolved", "closed"] and ticket.status in ["resolved", "closed"]:
                ticket.resolved_at = None
        
        # Apply updates
        for field, value in update_data.items():
            setattr(ticket, field, value)
        
        await db.commit()
        await db.refresh(ticket)
        
        return TicketResponse(
            id=ticket.id,
            user_id=ticket.user_id,
            title=ticket.title,
            description=ticket.description,
            category=ticket.category,
            priority=ticket.priority,
            status=ticket.status,
            assigned_to=ticket.assigned_to,
            resolution=ticket.resolution,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
            resolved_at=ticket.resolved_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update ticket"
        )

@router.delete("/{ticket_id}", response_model=SuccessResponse)
async def delete_ticket(
    ticket_id: uuid.UUID,
    current_user = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete a ticket. Users can delete their own tickets, admins can delete any."""
    try:
        # Get the ticket
        stmt = select(Ticket).where(Ticket.id == ticket_id)
        
        # Non-admin users can only delete their own tickets
        if current_user.role != "admin":
            stmt = stmt.where(Ticket.user_id == current_user.user_id)
        
        result = await db.execute(stmt)
        ticket = result.scalar_one_or_none()
        
        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ticket not found or not authorized"
            )
        
        await db.delete(ticket)
        await db.commit()
        
        return SuccessResponse(
            success=True,
            message="Ticket deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete ticket"
        )

@router.get("/stats/summary")
async def get_ticket_stats(
    current_user = Depends(require_admin),
    db: AsyncSession = Depends(get_db_session)
):
    """Get ticket statistics (admin only)."""
    try:
        # Get all tickets
        stmt = select(Ticket)
        result = await db.execute(stmt)
        tickets = result.scalars().all()
        
        # Calculate statistics
        total_tickets = len(tickets)
        open_tickets = len([t for t in tickets if t.status == "open"])
        in_progress_tickets = len([t for t in tickets if t.status == "in_progress"])
        resolved_tickets = len([t for t in tickets if t.status == "resolved"])
        closed_tickets = len([t for t in tickets if t.status == "closed"])
        
        # Priority breakdown
        high_priority = len([t for t in tickets if t.priority == "high"])
        medium_priority = len([t for t in tickets if t.priority == "medium"])
        low_priority = len([t for t in tickets if t.priority == "low"])
        
        # Category breakdown
        category_stats = {}
        for ticket in tickets:
            category = ticket.category
            if category not in category_stats:
                category_stats[category] = 0
            category_stats[category] += 1
        
        return {
            "total_tickets": total_tickets,
            "by_status": {
                "open": open_tickets,
                "in_progress": in_progress_tickets,
                "resolved": resolved_tickets,
                "closed": closed_tickets
            },
            "by_priority": {
                "high": high_priority,
                "medium": medium_priority,
                "low": low_priority
            },
            "by_category": category_stats
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch ticket statistics"
        )