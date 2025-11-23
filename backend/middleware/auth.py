from fastapi import Request
from typing import Optional, Dict, Any, Mapping
import logging
import base64
import json
from config.supabasedb import get_supabase_client

logger = logging.getLogger(__name__)


def _is_supabase_cookie_name(cookie_name: str) -> bool:
    """Check if cookie name matches Supabase auth cookie pattern."""
    return cookie_name.startswith("sb-") and "-auth-token" in cookie_name


def _split_cookie_name(cookie_name: str) -> tuple[str, Optional[str]]:
    """Split cookie name into base name and optional chunk suffix (e.g., .0, .1)."""
    if "." in cookie_name:
        base_name, chunk_suffix = cookie_name.split(".", 1)
        return base_name, chunk_suffix
    return cookie_name, None


def _assemble_chunked_cookie(chunks: list[tuple[int, str]]) -> str:
    """Join chunked cookie parts in order."""
    ordered_chunks = sorted(chunks, key=lambda item: item[0])
    return "".join(value for _, value in ordered_chunks)


def get_supabase_session_from_cookies(cookies: Mapping[str, str]) -> Optional[Dict[str, Any]]:
    """
    Extract and decode the Supabase session (auth token) stored in cookies.
    
    Handles both single-cookie and chunked-cookie formats. Chunked cookies are
    produced when the Supabase session payload exceeds the browser's cookie size
    limits (common for OAuth providers like Google).
    """
    cookie_groups: Dict[str, Dict[str, Any]] = {}
    
    for cookie_name, cookie_value in cookies.items():
        if not _is_supabase_cookie_name(cookie_name):
            continue
        
        base_name, chunk_suffix = _split_cookie_name(cookie_name)
        if not base_name.endswith("-auth-token"):
            continue
        
        group = cookie_groups.setdefault(base_name, {"single": None, "chunks": []})
        if chunk_suffix is None:
            group["single"] = cookie_value
        elif chunk_suffix.isdigit():
            group["chunks"].append((int(chunk_suffix), cookie_value))
    
    for base_name, group in cookie_groups.items():
        cookie_value = group["single"]
        if not cookie_value and group["chunks"]:
            cookie_value = _assemble_chunked_cookie(group["chunks"])
            logger.debug(
                "Reconstructed chunked Supabase auth cookie '%s' with %d chunk(s)",
                base_name,
                len(group["chunks"]),
            )
        
        if not cookie_value:
            continue
        
        try:
            encoded_data = cookie_value[7:] if cookie_value.startswith("base64-") else cookie_value
            missing_padding = len(encoded_data) % 4
            if missing_padding:
                encoded_data += "=" * (4 - missing_padding)
            
            decoded_data = base64.b64decode(encoded_data).decode("utf-8")
            return json.loads(decoded_data)
        except Exception as exc:
            logger.warning(f"Failed to decode Supabase auth cookie: {exc}")
            return None
    
    return None


def get_access_token_from_request(request: Request) -> Optional[str]:
    """
    Helper to pull the Supabase access token from the incoming request.
    Checks Authorization header first (Bearer token), then falls back to cookies.
    """
    # 1. Check Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ")[1]

    # 2. Fallback to cookies
    token_data = get_supabase_session_from_cookies(request.cookies)
    if not token_data:
        return None
    
    access_token = token_data.get("access_token")
    if not access_token:
        logger.warning("Access token not found in Supabase cookie data")
    return access_token


class AuthMiddleware:
    """Authentication middleware for Supabase token validation"""
    
    def __init__(self):
        # Use service role for auth validation (legitimate admin operation)
        self.supabase = get_supabase_client(use_service_role=True)
    
    async def get_current_user(self, request: Request) -> Optional[Dict[str, Any]]:
        """Get current user from Supabase auth token (Header or Cookie)"""
        try:
            access_token = get_access_token_from_request(request)
            
            if not access_token:
                return None

            try:
                user = self.supabase.auth.get_user(access_token)
                return user
            except Exception as exc:
                logger.warning("Supabase token validation failed: %s", exc)
                return None
        except Exception as exc:
            logger.error("Unexpected auth middleware error: %s", exc)
            return None


# Global auth middleware instance
auth_middleware = AuthMiddleware() 