from fastapi import Request, HTTPException, status
from functools import wraps
from typing import Dict, Any, Callable
import logging
from middleware.auth import auth_middleware

logger = logging.getLogger(__name__)


def auth_guard(func: Callable) -> Callable:
    """
    Decorator that validates authentication and injects user data into request state.
    The user data will be available in request.state.user for the decorated function.
    """
    @wraps(func)
    async def wrapper(request: Request, *args, **kwargs):
        try:
            # Get user from authentication (Header or Cookie)
            user = await auth_middleware.get_current_user(request)
            
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            # Extract user data based on user object type
            user_data = None
            if hasattr(user, 'user') and user.user:
                # Handle MockUser object
                user_data = user.user
            elif hasattr(user, 'user'):
                # Handle Supabase user object
                user_data = user.user
            else:
                # Handle direct user data
                user_data = user
            
            # Inject user data into request state
            request.state.user = user_data
            request.state.authenticated = True
            
            # Call the original function with request containing user data
            return await func(request, *args, **kwargs)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Auth guard error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Authentication validation failed"
            )
    
    return wrapper


def optional_auth_guard(func: Callable) -> Callable:
    """
    Decorator that optionally validates authentication and injects user data into request state.
    Unlike auth_guard, this doesn't raise an error if user is not authenticated.
    The user data will be available in request.state.user for the decorated function.
    """
    @wraps(func)
    async def wrapper(request: Request, *args, **kwargs):
        try:
            # Get user from authentication (Header or Cookie)
            user = await auth_middleware.get_current_user(request)
            
            if user:
                # Extract user data based on user object type
                user_data = None
                if hasattr(user, 'user') and user.user:
                    # Handle MockUser object
                    user_data = user.user
                elif hasattr(user, 'user'):
                    # Handle Supabase user object
                    user_data = user.user
                else:
                    # Handle direct user data
                    user_data = user
                
                # Inject user data into request state
                request.state.user = user_data
                request.state.authenticated = True
            else:
                # No user authenticated
                request.state.user = None
                request.state.authenticated = False
            
            # Call the original function with request containing user data
            return await func(request, *args, **kwargs)
            
        except Exception as e:
            logger.error(f"Optional auth guard error: {str(e)}")
            # For optional auth, we don't raise errors, just set unauthenticated state
            request.state.user = None
            request.state.authenticated = False
            return await func(request, *args, **kwargs)
    
    return wrapper
