"""
Widget Token Guard Middleware

Validates widget tokens for public widget queries.
Extracts token from Authorization header or query parameter and validates it.
"""

from fastapi import Request, HTTPException, status
from functools import wraps
from typing import Callable, Optional
import logging
from services.widget_token_service import WidgetTokenService

logger = logging.getLogger(__name__)


def widget_token_guard(func: Callable) -> Callable:
    """
    Decorator that validates widget token and injects token data into request state.
    The token data will be available in request.state.widget_token for the decorated function.
    
    Token can be provided via:
    - Authorization header: "Bearer <token>" or "Token <token>"
    - Query parameter: "?token=<token>"
    """
    @wraps(func)
    async def wrapper(request: Request, *args, **kwargs):
        try:
            # Extract token from request
            token = None
            origin = None
            
            # Try Authorization header first
            auth_header = request.headers.get("Authorization")
            if auth_header:
                # Support both "Bearer <token>" and "Token <token>" formats
                parts = auth_header.split(" ", 1)
                if len(parts) == 2 and parts[0].lower() in ["bearer", "token"]:
                    token = parts[1]
            
            # Try query parameter as fallback
            if not token:
                token = request.query_params.get("token")
            
            # Get origin from headers (for domain validation)
            origin = request.headers.get("Origin") or request.headers.get("Referer")
            if origin:
                # Extract scheme + host from origin/referer
                try:
                    from urllib.parse import urlparse
                    parsed = urlparse(origin)
                    origin = f"{parsed.scheme}://{parsed.netloc}"
                except Exception:
                    pass  # Keep original origin if parsing fails
            
            if not token:
                logger.warning("Widget token not provided")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Widget token required. Provide token via Authorization header (Bearer/Token) or query parameter (?token=...)"
                )
            
            # Validate token
            token_service = WidgetTokenService()  # No access_token needed (uses service role)
            token_data = token_service.validate_token(token, origin=origin)
            
            if not token_data:
                logger.warning(f"Invalid or expired widget token (origin: {origin})")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Request is unauthorized"
                )
            
            # Inject token data into request state
            request.state.widget_token = token_data
            request.state.bot_id = token_data["bot_id"]  # For convenience
            request.state.authenticated = True  # Mark as authenticated via widget token
            
            # Call the original function with request containing token data
            return await func(request, *args, **kwargs)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Widget token guard error: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Token validation failed"
            )
    
    return wrapper

