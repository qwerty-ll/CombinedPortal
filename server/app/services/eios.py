"""Client for the KSU EIOS REST API (https://eios.kosgos.ru/api)."""
import base64
import json
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
    # EIOS idGroup of the student's group: what the timetable is requested by.
    group_id: Optional[int] = None


@dataclass
class StudentProfile:
    full_name: Optional[str]
    group: Optional[str]
    group_id: Optional[int]


def _first(source: dict, *keys: str) -> Any:
    for key in keys:
        value = source.get(key)
        if value not in (None, ""):
            return value
    return None


def _is_vpn_block(resp: httpx.Response) -> bool:
    return resp.status_code == 451 or "отключите vpn" in resp.text.lower()


def _text(value: Any, limit: int) -> Optional[str]:
    """A trimmed, length-capped string, or None for anything else."""
    if not isinstance(value, str):
        return None
    value = " ".join(value.split())
    return value[:limit] or None


def _auth_parts(payload: Any) -> tuple:
    """Split a /tokenauth answer into (outer data, user dict, access token)."""
    if not isinstance(payload, dict):
        return {}, {}, None
    inner = payload.get("data") if isinstance(payload.get("data"), dict) else {}
    user = _first(inner, "user", "data")
    if not isinstance(user, dict):
        user = payload.get("user") if isinstance(payload.get("user"), dict) else inner
    token = _first(payload, "accessToken", "token") or _first(inner, "accessToken", "token") or _first(user, "accessToken", "token")
    return inner, user, token if isinstance(token, str) else None


def parse_auth_response(payload: Any) -> Optional[EiosIdentity]:
    """Return the identity for a successful /tokenauth answer, or None when EIOS rejected the login.

    KSU answers {"state": 1, "data": {"data": {"userName", "accessToken", "refreshToken", "id", "expiresIn"}}}:
    no name and no group, those come from UserInfo/Student (see fetch_student_profile).
    """
    if not isinstance(payload, dict):
        return None
    inner, user, token = _auth_parts(payload)
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


def jwt_claims(token: Optional[str]) -> dict:
    """The payload of an EIOS access token, read without checking the signature.

    Only used for display fields of a token EIOS itself has just handed us over TLS; never for access decisions.
    """
    if not isinstance(token, str):
        return {}
    try:
        part = token.split(".")[1]
        claims = json.loads(base64.urlsafe_b64decode(part + "=" * (-len(part) % 4)))
    except (IndexError, ValueError):
        return {}
    return claims if isinstance(claims, dict) else {}


def _claim(claims: dict, name: str) -> Any:
    """Claims come as full URIs (".../identity/claims/surname"); match on the last segment."""
    for key, value in claims.items():
        if key == name or key.endswith("/" + name):
            return value
    return None


def _user_id(identity: EiosIdentity, claims: dict) -> Optional[int]:
    """The (negative) EIOS userID that UserInfo/Student is asked for."""
    for raw in (identity.eios_id, _claim(claims, "sid")):
        try:
            value = int(str(raw).strip())
        except (TypeError, ValueError):
            continue
        if value:
            return -abs(value)
    return None


def _group_id(value: Any) -> Optional[int]:
    if isinstance(value, bool):
        return None
    try:
        value = int(str(value).strip())
    except (TypeError, ValueError):
        return None
    return value if 0 < value < 2**31 else None  # fits the INTEGER column


def parse_student_profile(payload: Any) -> Optional[StudentProfile]:
    """Name and group from a UserInfo/Student answer: {"state": 1, "data": {"fullName", "group": {"item1": name, "item2": idGroup}}}."""
    if not isinstance(payload, dict) or payload.get("state") != 1:
        return None
    data = payload.get("data")
    if not isinstance(data, dict):
        return None

    full_name = _text(data.get("fullName"), 200) or _text(
        " ".join(part for part in (data.get("surname"), data.get("name"), data.get("middleName")) if isinstance(part, str)),
        200,
    )
    group = data.get("group")
    group_name = group_id = None
    if isinstance(group, dict):
        group_name = _text(_first(group, "item1", "name"), 50)
        group_id = _group_id(_first(group, "item2", "idGroup", "id"))
    elif isinstance(group, str):
        group_name = _text(group, 50)
    if not (full_name or group_name):
        return None
    return StudentProfile(full_name=full_name, group=group_name, group_id=group_id)


async def fetch_student_profile(client: httpx.AsyncClient, token: str, user_id: int) -> Optional[StudentProfile]:
    """The student's card from EIOS. Any failure returns None: the login itself has already succeeded."""
    url = f"{settings.EIOS_BASE_URL}/UserInfo/Student"
    # The EIOS web app sends "Bearer <token>"; the bare token is a fallback in case this installation expects it.
    for authorization in (f"Bearer {token}", token):
        try:
            resp = await client.get(url, params={"studentID": user_id}, headers={"Authorization": authorization}, timeout=6.0)
        except httpx.HTTPError as exc:
            logger.warning("EIOS UserInfo/Student unavailable: %s", exc)
            return None
        if resp.status_code != 401:
            break
    if resp.status_code != 200 or _is_vpn_block(resp):
        logger.warning("EIOS UserInfo/Student returned HTTP %s", resp.status_code)
        return None
    try:
        profile = parse_student_profile(resp.json())
    except ValueError:
        profile = None
    if profile is None:
        logger.warning("EIOS UserInfo/Student gave no usable profile")
    return profile


async def _complete_identity(client: httpx.AsyncClient, identity: EiosIdentity, token: Optional[str]) -> EiosIdentity:
    """tokenauth answers with ids only; fill in the real name and group."""
    claims = jwt_claims(token)
    user_id = _user_id(identity, claims)
    profile = await fetch_student_profile(client, token, user_id) if token and user_id else None
    if profile is not None:
        identity.full_name = profile.full_name or identity.full_name
        if profile.group:
            identity.group = profile.group
            identity.group_id = profile.group_id
    if profile is None or not profile.full_name:
        # Short form ("Иванов И. И.") carried by the token itself
        identity.full_name = _text(_claim(claims, "surname"), 200) or identity.full_name
    return identity


async def authenticate(username: str, password: str) -> Optional[EiosIdentity]:
    """Check credentials against EIOS. Returns None for wrong credentials.

    The EIOS token is used only for the profile request right here and is never stored.
    """
    url = f"{settings.EIOS_BASE_URL}/tokenauth"
    async with httpx.AsyncClient(verify=settings.VERIFY_SSL, timeout=12.0) as client:
        try:
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

        identity = parse_auth_response(payload)
        if identity is None:
            return None
        return await _complete_identity(client, identity, _auth_parts(payload)[2])


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
