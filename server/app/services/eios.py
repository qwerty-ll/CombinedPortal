"""Client for the KSU EIOS REST API (https://eios.kosgos.ru/api)."""
import logging
from dataclasses import dataclass
from typing import Any, Optional

import httpx

from app.core.config import settings

logger = logging.getLogger("ivitsh_portal.eios")


class EiosUnavailable(Exception):
    """EIOS did not answer or answered with something unusable."""


class EiosVpnBlocked(Exception):
    """EIOS rejected the connection because the request came through a VPN."""


@dataclass
class EiosIdentity:
    eios_id: Optional[str]
    full_name: Optional[str]
    group: Optional[str]
    avatar_url: Optional[str]


def _first(source: dict, *keys: str) -> Any:
    for key in keys:
        value = source.get(key)
        if value not in (None, ""):
            return value
    return None


def _is_vpn_block(resp: httpx.Response) -> bool:
    return resp.status_code == 451 or "отключите vpn" in resp.text.lower()


def parse_auth_response(payload: Any) -> Optional[EiosIdentity]:
    """Return the identity for a successful /tokenauth answer, or None when EIOS rejected the login.

    Documented success shape: {"state": 1, "accessToken": "...", "data": {"user": {"userID": 1, "shortFIO": "..."}}}.
    """
    if not isinstance(payload, dict):
        return None
    inner = payload.get("data") if isinstance(payload.get("data"), dict) else {}
    user = _first(inner, "user", "data")
    if not isinstance(user, dict):
        user = payload.get("user") if isinstance(payload.get("user"), dict) else inner

    token = _first(payload, "accessToken", "token") or _first(inner, "accessToken", "token") or _first(user, "accessToken", "token")
    eios_id = _first(user, "userID", "userId", "id")
    display = _first(user, "fullName", "full_name", "fio", "shortFIO", "lastName", "userName", "login")
    state = payload.get("state", inner.get("state"))

    # state == 1 is EIOS' explicit success flag; any other explicit state is a failure.
    if state is not None and state != 1:
        return None
    if state is None and not token:
        return None
    if not (token or eios_id or display):
        return None

    combined_fio = " ".join(
        part for part in (
            _first(user, "lastName", "lastname"),
            _first(user, "firstName", "firstname"),
            _first(user, "middleName", "patronymic"),
        ) if part
    )
    full_name = _first(user, "fullName", "full_name", "fio", "shortFIO", "name") or combined_fio or None
    return EiosIdentity(
        eios_id=str(eios_id) if eios_id is not None else None,
        full_name=str(full_name).strip() if full_name else None,
        group=_first(user, "groupName", "group") or None,
        avatar_url=_first(user, "avatar", "photo", "userpictureurl", "profileimageurl") or None,
    )


async def authenticate(username: str, password: str) -> Optional[EiosIdentity]:
    """Check credentials against EIOS. Returns None for wrong credentials."""
    url = f"{settings.EIOS_BASE_URL}/tokenauth"
    try:
        async with httpx.AsyncClient(verify=settings.VERIFY_SSL, timeout=12.0) as client:
            resp = await client.post(url, json={"userName": username, "password": password})
    except httpx.HTTPError as exc:
        logger.error("EIOS tokenauth unavailable: %s", exc)
        raise EiosUnavailable() from exc

    if _is_vpn_block(resp):
        raise EiosVpnBlocked()
    if resp.status_code >= 500:
        logger.error("EIOS tokenauth returned HTTP %s", resp.status_code)
        raise EiosUnavailable()
    if resp.status_code != 200:
        return None
    try:
        payload = resp.json()
    except ValueError as exc:
        raise EiosUnavailable() from exc
    return parse_auth_response(payload)


async def fetch_json(endpoint: str, params: dict, timeout: float = 5.0) -> Optional[Any]:
    """GET a public EIOS endpoint; returns None on any failure."""
    url = f"{settings.EIOS_BASE_URL}/{endpoint}"
    try:
        async with httpx.AsyncClient(verify=settings.VERIFY_SSL, timeout=timeout) as client:
            resp = await client.get(url, params=params)
    except httpx.HTTPError as exc:
        logger.warning("EIOS request to %s failed: %s", endpoint, exc)
        return None
    if _is_vpn_block(resp):
        logger.warning("EIOS blocked request to %s (VPN)", endpoint)
        return None
    if resp.status_code != 200:
        logger.warning("EIOS %s returned HTTP %s", endpoint, resp.status_code)
        return None
    try:
        return resp.json()
    except ValueError:
        return None
