from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from jose import JWTError
from sqlalchemy.exc import IntegrityError, NoResultFound
import logging
from typing import Union

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "error": f"HTTP {exc.status_code}"
        }
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        message = error["msg"]
        errors.append(f"{field}: {message}")
    
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "message": "Validation error",
            "error": "; ".join(errors)
        }
    )

async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    # Handle specific database errors
    if isinstance(exc, IntegrityError):
        if "duplicate key" in str(exc).lower():
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={
                    "success": False,
                    "message": "Resource already exists",
                    "error": "Duplicate key error"
                }
            )
        else:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "message": "Database constraint violation",
                    "error": "Integrity error"
                }
            )
    
    # Handle not found errors
    if isinstance(exc, NoResultFound):
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "message": "Resource not found",
                "error": "Not found"
            }
        )
    
    # Handle JWT errors
    if isinstance(exc, JWTError):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "success": False,
                "message": "Invalid or expired token",
                "error": "JWT error"
            },
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Default server error
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Internal server error",
            "error": "Server error"
        }
    )

async def not_found_handler(request: Request, exc: StarletteHTTPException):
    """Handle 404 not found errors."""
    if exc.status_code == 404:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "message": f"Route {request.url.path} not found",
                "error": "Not found"
            }
        )
    
    # For other HTTP exceptions, use the general HTTP handler
    return await http_exception_handler(request, HTTPException(status_code=exc.status_code, detail=exc.detail))

def setup_exception_handlers(app):
    """Setup all exception handlers for the FastAPI app."""
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, not_found_handler)
    app.add_exception_handler(Exception, general_exception_handler)