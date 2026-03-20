import re
import httpx
import json5
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from auth import get_current_user
from audit import log_action
from database import get_db
import models

router = APIRouter(prefix="/games-library", tags=["games-library"])

GAMES_JS_URL = "https://raw.githubusercontent.com/kira-502/saudideck-site/main/games.js"


def _get_db():
    yield from get_db()


def _extract_array(content: str, var_name: str) -> str:
    match = re.search(rf'(?:const|let|var)\s+{var_name}\s*=\s*\[', content)
    if not match:
        return "[]"
    start = match.end() - 1
    depth = 0
    i = start
    in_string = False
    string_char = None
    while i < len(content):
        c = content[i]
        if in_string:
            if c == '\\':
                i += 2
                continue
            if c == string_char:
                in_string = False
        else:
            if c in ('"', "'", '`'):
                in_string = True
                string_char = c
            elif c == '[':
                depth += 1
            elif c == ']':
                depth -= 1
                if depth == 0:
                    return content[start:i+1]
        i += 1
    return "[]"


@router.get("")
async def get_games_library(
    request: Request,
    db: Session = Depends(_get_db),
    current_user: models.User = Depends(get_current_user),
):
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(GAMES_JS_URL)
            resp.raise_for_status()
            content = resp.text
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Failed to fetch games data: {e}")

    try:
        batches_raw = _extract_array(content, "batches")
        coming_soon_raw = _extract_array(content, "comingSoonGames")
        base_library_raw = _extract_array(content, "baseLibrary")

        batches = json5.loads(batches_raw)
        coming_soon = json5.loads(coming_soon_raw)
        base_library = json5.loads(base_library_raw)
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Failed to parse games data: {e}")

    # Count all games
    batch_games_count = sum(len(b.get("list", [])) for b in batches)
    total_games = batch_games_count + len(base_library)

    # Count verified
    verified_count = 0
    for b in batches:
        for g in b.get("list", []):
            if g.get("verified"):
                verified_count += 1
    for g in base_library:
        if g.get("verified"):
            verified_count += 1

    # Most recent batch
    recent_batch_date = None
    recent_batch_count = 0
    recent_additions = []
    if batches:
        # Sort batches by date descending, take the most recent
        sorted_batches = sorted(batches, key=lambda b: b.get("date", ""), reverse=True)
        latest = sorted_batches[0]
        recent_batch_date = latest.get("date")
        recent_additions = latest.get("list", [])
        recent_batch_count = len(recent_additions)

    # Sort coming soon by release_info date (DD/MM/YYYY)
    def parse_release_date(game):
        ri = game.get("release_info", "")
        try:
            parts = ri.split("/")
            if len(parts) == 3:
                return (int(parts[2]), int(parts[1]), int(parts[0]))
        except Exception:
            pass
        return (9999, 99, 99)

    coming_soon_sorted = sorted(coming_soon, key=parse_release_date)

    log_action(
        db,
        user_id=current_user.id,
        username=current_user.username,
        action="view_games_library",
        ip=request.client.host if request.client else None,
    )

    return {
        "stats": {
            "total_games": total_games,
            "coming_soon": len(coming_soon),
            "verified_count": verified_count,
            "recent_batch_date": recent_batch_date,
            "recent_batch_count": recent_batch_count,
        },
        "recent_additions": recent_additions,
        "coming_soon": coming_soon_sorted,
    }
