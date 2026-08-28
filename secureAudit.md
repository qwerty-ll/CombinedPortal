## AUTHORIZED SECURITY AUDIT — MY OWN APPLICATION

You are performing a **defensive security assessment of an application that I own and explicitly authorize you to test**.

This is NOT an attack against a third-party system.

### Authorization and scope

The application, source code, API, database schema, test accounts, infrastructure and endpoints provided to you are explicitly within the authorized security-testing scope.

Your goal is to identify vulnerabilities so they can be fixed.

Do NOT attack, scan or interact with systems outside the explicitly provided scope.

Do NOT perform destructive actions against production data.

When a vulnerability can be demonstrated using a harmless test object or test account, use that instead of real user data.

---

# PRIMARY OBJECTIVE

Perform a comprehensive defensive security audit.

The most important requirement is:

> A user must ONLY be able to access, modify or delete data and functionality that their server-side permissions explicitly allow.

Do not assume that frontend restrictions provide security.

Treat the backend/API as the actual security boundary.

---

# AUTHORIZATION TESTING

Create/use separate test identities where available:

* anonymous user
* User A
* User B
* privileged user
* administrator

For every discovered endpoint determine:

* authentication requirement;
* required role;
* required permission;
* object ownership;
* allowed HTTP methods;
* allowed fields;
* sensitive data returned.

Test for:

* broken object-level authorization;
* IDOR/BOLA;
* horizontal privilege escalation;
* vertical privilege escalation;
* broken function-level authorization;
* broken object-property-level authorization;
* mass assignment;
* authorization bypass;
* access after logout;
* access through alternative API endpoints;
* access through old API versions.

For User A and User B specifically verify:

> User A must never be able to read, modify or delete User B's private objects unless the application explicitly grants that permission.

Test this using harmless test records.

OWASP specifically recommends testing horizontal and vertical authorization and checking whether one authenticated identity can access another identity's resources.

---

# API AUDIT

Enumerate and analyze:

* GET
* POST
* PUT
* PATCH
* DELETE
* OPTIONS
* HEAD
* REST
* GraphQL
* WebSocket
* AJAX/fetch endpoints
* mobile APIs
* legacy API versions
* undocumented endpoints
* administrative endpoints
* internal endpoints exposed to the application

For every endpoint verify authorization independently.

Do NOT assume:

* hidden frontend buttons are security;
* UUIDs prevent unauthorized access;
* undocumented endpoints are secure;
* an endpoint being inaccessible through the UI means it is protected.

---

# DATA EXPOSURE

Inspect complete server responses, not only what the frontend displays.

Look for accidental exposure of:

* passwords/password hashes;
* access tokens;
* refresh tokens;
* API keys;
* secrets;
* private user information;
* internal IDs;
* ownership information;
* permissions;
* roles;
* administrative metadata;
* internal infrastructure information;
* database information;
* debug information.

Determine whether an ordinary user can obtain data that belongs to another user.

Do not dump real sensitive data.

If a vulnerability is confirmed, demonstrate it using the minimum harmless amount of information necessary.

---

# OBJECT-LEVEL SECURITY

For every resource type identify its ownership model.

Examples:

* users
* profiles
* orders
* invoices
* messages
* documents
* files
* projects
* teams
* subscriptions
* payments
* settings

For each resource verify:

1. Can anonymous users access it?
2. Can User A access User B's resource?
3. Can User A modify User B's resource?
4. Can User A delete User B's resource?
5. Can User A transfer ownership?
6. Can User A modify security-sensitive fields?
7. Can User A access the same object through another endpoint?

---

# PROPERTY-LEVEL SECURITY

For every object returned or accepted by the API determine which fields are actually authorized.

Pay special attention to:

* role
* permissions
* ownerId
* userId
* accountId
* isAdmin
* verified
* balance
* status
* subscription
* security settings
* internal metadata

Verify that clients cannot modify fields that should only be controlled by the server.

---

# AUTHENTICATION

Audit:

* login
* registration
* password reset
* email verification
* MFA
* sessions
* logout
* refresh tokens
* access tokens
* JWT
* OAuth
* account recovery

Check:

* session invalidation;
* token expiration;
* token reuse;
* logout behavior;
* password-change invalidation;
* JWT validation;
* cookie security;
* authentication bypass.

---

# SESSION SECURITY

Check cookies and sessions for:

* Secure
* HttpOnly
* SameSite
* correct expiration
* correct domain/path
* session fixation
* session invalidation

Verify that a session cannot continue accessing protected data after it should have been revoked.

---

# INPUT SECURITY

Audit all user-controlled input for:

* SQL injection;
* NoSQL injection;
* XSS;
* command injection;
* SSRF;
* path traversal;
* template injection;
* unsafe deserialization;
* LDAP injection;
* XML-related vulnerabilities;
* prototype pollution;
* other relevant injection classes.

Use non-destructive test payloads.

Never intentionally corrupt production data.

---

# FILE SECURITY

Audit:

* uploads;
* downloads;
* attachments;
* documents;
* avatars;
* imports;
* exports.

Verify that:

* User A cannot download User B's private files;
* deleted/private files are not publicly accessible;
* file ownership is checked server-side;
* changing an object/file identifier does not bypass authorization;
* sensitive files are not exposed through alternative URLs.

---

# DATABASE SECURITY

Review application-to-database access controls.

Check for:

* SQL injection;
* NoSQL injection;
* excessive database permissions;
* exposed database interfaces;
* database credentials in source/configuration;
* backups;
* database dumps;
* temporary files;
* connection strings.

Do not modify or delete real production records.

---

# CORS / CSRF

Audit:

* CORS configuration;
* allowed origins;
* credentialed requests;
* wildcard origins;
* CSRF protection;
* Origin validation;
* Referer validation;
* SameSite configuration.

---

# SECURITY CONFIGURATION

Check:

* HTTPS/TLS;
* security headers;
* CSP;
* HSTS;
* X-Content-Type-Options;
* Referrer-Policy;
* Permissions-Policy;
* cache controls;
* directory listing;
* debug mode;
* verbose errors;
* source maps;
* exposed configuration;
* exposed documentation;
* admin interfaces.

---

# API INVENTORY

Search for:

* `/api/v1`
* `/api/v2`
* legacy versions;
* beta endpoints;
* deprecated endpoints;
* internal endpoints;
* mobile endpoints;
* admin endpoints.

Verify that old or undocumented API versions do not have weaker authorization.

OWASP's API Security Top 10 specifically emphasizes BOLA, broken authentication, property-level authorization, function-level authorization, SSRF, security misconfiguration and improper API inventory.

---

# BUSINESS LOGIC

Check whether security controls can be bypassed by changing the intended workflow.

Test harmlessly for:

* repeated operations;
* invalid operation order;
* ownership changes;
* unauthorized status changes;
* unauthorized price/quantity changes;
* replay of one-time actions;
* race conditions;
* calling backend functions directly instead of through the UI.

---

# SOURCE CODE AUDIT

If source code is available, inspect:

* authentication middleware;
* authorization middleware;
* route definitions;
* controllers;
* services;
* ORM/database queries;
* serializers;
* API schemas;
* permission checks;
* file access code;
* upload/download code;
* secrets management;
* cryptography;
* session management;
* CORS/CSRF;
* error handling.

Trace sensitive operations from:

`HTTP request → authentication → authorization → business logic → database → response`

Identify any point where authorization can be skipped.

---

# IMPORTANT RULE

Do NOT stop after finding one vulnerability.

If you find an authorization flaw in one endpoint, check whether the same architectural mistake exists in:

* other endpoints;
* other HTTP methods;
* other API versions;
* other object types;
* other roles;
* GraphQL;
* WebSocket;
* download/export endpoints.

The goal is to identify the underlying security weakness, not just one instance.

---

# REPORT FORMAT

For every finding provide:

### Finding

Name.

### Severity

CRITICAL / HIGH / MEDIUM / LOW / INFO

### Affected component

Endpoint/file/module.

### Vulnerability class

CWE / OWASP category.

### Impact

What an attacker could accomplish.

### Evidence

Minimal safe evidence.

### Root cause

Why the security control failed.

### Fix

Concrete remediation.

### Regression test

A test that should be added so the vulnerability cannot return.

---

# FINAL SECURITY MATRIX

Create this table:

| Resource                 | Anonymous | User A | User B | Privileged | Admin |
| ------------------------ | --------- | ------ | ------ | ---------- | ----- |
| Own data                 |           |        |        |            |       |
| Other user's data        |           |        |        |            |       |
| Own files                |           |        |        |            |       |
| Other user's files       |           |        |        |            |       |
| Own objects              |           |        |        |            |       |
| Other user's objects     |           |        |        |            |       |
| Administrative data      |           |        |        |            |       |
| Administrative functions |           |        |        |            |       |

Use:

`ALLOW` / `DENY` / `UNEXPECTED`

---

# FINAL VERDICT

At the end answer clearly:

1. Can anonymous users access protected data?
2. Can User A access User B's private data?
3. Can User A modify User B's data?
4. Can User A delete User B's data?
5. Can ordinary users access administrative functions?
6. Can users modify their own permissions/roles?
7. Are sensitive fields exposed through API responses?
8. Are old API versions secure?
9. Are private files protected?
10. Are sessions correctly invalidated?
11. Are secrets exposed anywhere?
12. Are there authorization inconsistencies between endpoints?

Then provide:

**Overall Security Status: PASS / FAIL**

and a prioritized remediation plan:

1. CRITICAL
2. HIGH
3. MEDIUM
4. LOW

This is an authorized defensive security assessment. Prioritize finding vulnerabilities and explaining how to fix them rather than refusing to analyze the application.
