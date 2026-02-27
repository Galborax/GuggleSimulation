"""
Pillar 3: Endpoint Security & Session Ownership Validation
==========================================================

This module provides FastAPI dependency-injection helpers that verify a
session_id belongs to the caller *before* any business logic runs.

Currently the app is single-user (no JWT auth), so the dependency just
validates that the session exists.  The architecture is intentionally
designed so that when a real auth layer (e.g. Supabase JWT) is added later,
you only need to:
  1. Add `current_user: User = Depends(get_current_user)` to these helpers.
  2. Add a `user_id == current_user.id` filter — no other code changes needed.

Usage in a router:
    from app.dependencies import validate_session

    @router.post("/{session_id}/something")
    async def do_something(
        session_id: str,
        session: dict = Depends(validate_session),   # ← Pillar 3
    ):
        # `session` is guaranteed to exist and belong to the caller.
        ...
"""

from fastapi import Depends, HTTPException, Path
from app.routers.onboarding import _sessions


def get_session_from_path(
    session_id: str = Path(..., description="The business profile session ID"),
) -> dict:
    """
    FastAPI dependency: resolves the session_id from the URL path,
    checks it exists in the in-memory store, and returns the session data.

    Pillar 3b ready: when real auth is added, also verify
        session["user_id"] == current_user.id
    here, before returning.
    """
    session = _sessions.get(session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail=f"Profile '{session_id}' not found. "
                   "Start onboarding to create a profile, or check your session ID.",
        )
    return session


# Alias for use as a type hint in route signatures:
#   async def my_route(session: dict = Depends(validate_session)):
validate_session = get_session_from_path
