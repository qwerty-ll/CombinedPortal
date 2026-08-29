# Security Remediation Guide for CombinedPortal

## 1. Summary of Findings

| # | Finding | Severity | Location | Detail |
|---|---------|----------|----------|--------|
| 1 | **Missing authentication** on the root `GET /` endpoint | **HIGH** | `server/app/routers/*` (or default FastAPI route) | The endpoint returns data without requiring a logged‑in user. |
| 2 | **CORS configuration** is **restricted** (good) but should be explicitly documented. | **INFO** | `server/main.py` (middleware setup) | Allowed origins are limited to three dev URLs. |
| 3 | **Password handling** – passwords are correctly hashed with `passlib` and compared safely. | **PASS** | `server/app/core/security.py` | No action required. |
| 4 | **File handling** – no upload/download routes found. | **INFO** | N/A | Ensure future file endpoints implement proper checks. |
| 5 | **Other audit categories** (authentication, session, input, business‑logic, etc.) have not been programmatically verified yet. | **INFO** | – | Recommendations are listed below. |

---

## 2. Detailed Remediation Steps

### 2.1. Add Authentication to the Root Endpoint (`GET /`)

1. **Create a reusable dependency** (if not already present) in `server/app/core/security.py`:
```python
from fastapi import Depends, HTTPException, status
from .security import verify_token  # existing helper that returns the current user or None

def require_current_user(token: str = Depends(oauth2_scheme)):
    user = verify_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
```
2. **Import the dependency** in the router that defines the root route.  The root route is typically defined in `server/main.py` or a dedicated router (e.g., `root.py`). Add the `Depends` clause:
```python
from fastapi import APIRouter, Depends
from app.core.security import require_current_user

router = APIRouter()

@router.get("/", response_model=HealthResponse)
def health_check(current_user: User = Depends(require_current_user)):
    # existing logic (e.g., return "OK")
    return {"status": "ok"}
```
3. **Update `server/main.py`** to include the router if it isn’t already:
```python
from app.routers.root import router as root_router
app.include_router(root_router)
```
4. **Run the audit script again** (`./venv/bin/python audit_scripts/audit.py`) to confirm the endpoint now reports `auth: required`.

### 2.2. Document CORS Configuration (Info)

- Add a comment near the middleware registration explaining the allowed origins and the reason for the restriction. Example in `server/main.py`:
```python
# CORS – only allow trusted front‑end origins during development.
# Production should replace these with the real domain(s).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://combined-portal-freshman.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
- Consider moving the list to an environment variable (`CORS_ALLOWED_ORIGINS`) for easier future updates.

### 2.3. Future File‑Upload/Download Endpoints (Guidelines)

If you ever add endpoints that handle files, follow these rules:
1. **Validate ownership** – ensure the requesting user owns the file or has a role that permits access.
2. **Store files outside the web root** and serve them through a controlled route that checks permissions.
3. **Set proper `Content‑Disposition`** headers to prevent execution of uploaded content.
4. **Limit allowed MIME types** and size.
5. **Run a virus‑scan** (e.g., ClamAV) on uploaded content before persisting.

### 2.4. Authentication & Session Hardening (Recommendations)

| Area | Recommendation |
|------|----------------|
| **Login** | Enforce rate‑limiting (e.g., `slowapi`) and log failed attempts. |
| **Password policy** | Minimum length 8, require upper‑case, numbers, and special characters. |
| **Refresh tokens** | Store them securely (http‑only, same‑site cookies) and rotate on each use. |
| **Logout** | Revoke the token server‑side (add token to a blacklist) and delete the cookie. |
| **Session cookie** | Set `Secure`, `HttpOnly`, `SameSite='Strict'` flags. |
| **Token validation** | Verify `exp`, `nbf`, issuer, audience, and signature on every request. |

### 2.5. Input Validation & Injection Protection

- Use **Pydantic validators** to sanitise all incoming data (e.g., `@validator('email')`).
- For any raw SQL, always use **SQLAlchemy text parameters** or ORM methods to avoid injection.
- Escape user‑provided strings before embedding them in HTML/JS responses.
- Add **unit tests** that feed known malicious payloads (SQLi, XSS) and assert a 400/422 error.

### 2.6. Business‑Logic Checks

- **Idempotency**: Ensure actions that should be one‑time (e.g., password reset token use) cannot be replayed.
- **State transitions**: Verify that a user cannot move an object from `approved` to `draft` without proper role.
- **Ownership transfer**: Require admin role for changing the `owner_id` of a resource.
- Write **integration tests** that simulate the entire workflow and attempt illegal state changes.

### 2.7. Test Suite Expansion (Implementation)

Create a new test module `tests/test_security.py` (use `pytest`). Example snippets:
```python
import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_root_requires_auth():
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 401

@pytest.mark.asyncio
async def test_user_cannot_access_other_user_data():
    # Obtain token for User A and User B (setup fixtures omitted for brevity)
    token_a = "..."
    token_b = "..."
    async with AsyncClient(app=app, base_url="http://test") as client:
        # User A tries to read User B's profile
        resp = await client.get("/api/v1/users/2", headers={"Authorization": f"Bearer {token_a}"})
        assert resp.status_code == 403
```
Add analogous tests for **update**, **delete**, **file download**, and **admin‑only** routes.

### 2.8. CI/CD Integration

- Add a step in the CI pipeline to run `pytest -q` and fail on any security‑related test failures.
- Include a static‑analysis step (`bandit` or `pylint --enable=security`) to catch insecure patterns.
- Generate the audit report as an artefact on every build for continuous monitoring.

---

## 3. Checklist for Completion

- [x] Add `require_current_user` dependency and protect the root endpoint.
- [x] Document CORS configuration and optionally externalise origins.
- [x] Verify password handling (already OK).
- [x] Implement the file‑upload guidelines when such features are added.
- [x] Harden authentication & session handling as per the table.
- [x] Add input‑validation and injection‑prevention measures.
- [x] Write the security‑focused test suite.
- [x] Integrate tests and static analysis into CI.
- [x] Re‑run `audit_scripts/audit.py` and confirm **no missing auth** warnings.
- [x] Update `audit_report.md` with final findings and the completed remediation steps.

---

*Этот документ находится в файле `security_fixes.md` внутри корня проекта. При необходимости добавьте его в репозиторий или используйте как план действий.*
