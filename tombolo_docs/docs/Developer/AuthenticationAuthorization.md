---
sidebar_position: -95
title: Authentication & Authorization
---

# Authentication & Authorization

This document provides a **super detailed** explanation of how authentication and authorization are implemented in Tombolo, including all technologies used, middleware flow, and step-by-step Azure AD setup for local and production environments.

---

## 1. **Authentication Overview**

Tombolo supports two authentication methods:

- **Local authentication** (username/email + password, with JWT)
- **Azure Active Directory (Azure AD) authentication** (OAuth 2.0/OpenID Connect, with JWT)

Both methods issue a JWT token, which is stored in a secure, HTTP-only cookie and used for subsequent API requests.

---

## 2. **Technologies Used**

- **JWT (jsonwebtoken)**: For stateless authentication tokens.
- **bcrypt**: For password hashing.
- **Azure AD (passport-azure-ad or @azure/msal-node)**: For enterprise SSO.
- **Express middleware**: For token validation and RBAC.
- **Cookies**: For storing JWT tokens securely.
- **dotenv**: For managing environment variables.

---

## 3. **Local Authentication Flow**

1. **User submits credentials** to `/loginBasicUser`.
2. **Backend verifies** credentials:
   - Looks up user by email/username.
   - Compares password using bcrypt.
3. **If valid**, backend generates a JWT token:
   - Encodes user ID, roles, and other claims.
   - Signs with `JWT_SECRET` from `.env`.
4. **Token is set** in an HTTP-only, Secure cookie (`token`).
5. **On each request**, `tokenValidationMiddleware`:
   - Reads and verifies the JWT from the cookie.
   - Attaches user info to `req.user`.
   - Rejects if token is missing/invalid/expired.

---

## 4. **Azure AD Authentication Flow**

1. **User clicks "Sign in with Microsoft"**.
2. **Frontend redirects** to Azure AD login page.
3. **User authenticates** with corporate credentials.
4. **Azure AD redirects** back to Tombolo with an authorization code.
5. **Backend exchanges** code for an ID token and access token using Azure AD endpoints.
6. **Backend verifies** the ID token (JWT), extracts user info.
7. **If user exists** in the Tombolo DB, issues a Tombolo JWT token (as above).
8. **If user does not exist**, creates a new user using their Azure profile information, then issues a Tombolo JWT token.
9. **JWT token is set** in HTTP-only, Secure cookie.
10. **Subsequent requests** use the same `tokenValidationMiddleware`.

---

## 5. **Password Management**

- **Passwords are hashed** with bcrypt before storage.
- **Password reset**:
  - User requests reset; receives a secure, time-limited token via email.
  - User submits new password with token to `/resetPasswordWithToken`.
  - Backend verifies token, updates password (hashed).
- **Password change**:
  - Authenticated user submits old and new password.
  - Backend verifies old password, updates to new (hashed).

---

## 6. **Authorization (RBAC) Flow**

- **Roles**: Each user has one or more roles (e.g., `OWNER`, `ADMIN`, `USER`).
- **JWT token** encodes roles.
- **`validateUserRole` middleware**:
  - Checks `req.user.roles` against allowed roles for each route.
  - Returns 403 Forbidden if user lacks required role.
- **Example**:
  ```js
  // Only OWNER and ADMIN can access
  router.use(validateUserRole([role.OWNER, role.ADMIN]));
  ```

---

## 7. **Key Middleware and Files**

- `server/middlewares/tokenValidationMiddleware.js`:  
  Validates JWT, attaches user to request.
- `server/middlewares/rbacMiddleware.js`:  
  Checks user roles for route access.
- `server/routes/authRoutes.js`:  
  Handles login, logout, Azure AD callback, password reset.
- `server/controllers/authController.js`:  
  Implements authentication logic.
- `server/utils/authUtil.js`:  
  Utility functions for JWT and password handling.

---

## 8. **Environment Variables**

Set these in your `.env` file:

```env
# JWT
JWT_SECRET=

# Azure AD
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=
AZURE_AD_REDIRECT_URI=
AZURE_AD_AUTHORITY=
```

---

## 9. **Azure AD Setup (Step-by-Step)**

### **A. Register an Application in Azure**

Follow the official [Azure documentation for registering an application](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app).  
The Azure portal UI and steps may change, so always refer to their instructions as the source of truth.

### **B. Configure Application**

Get the required values (client secret, API permissions, client ID, tenant ID) from the Azure portal after registering your application, and update your `.env` file accordingly.

### **C. Update `.env`**

Add the values from Azure to your `.env` file as shown above.

---

## 10. **How to Test Authentication**

- **Local login**:  
  Use `/loginBasicUser` with email/password.
- **Azure login**:  
  Use `/auth/azure` endpoint; follow Microsoft login flow.
- **Check cookies**:  
  After login, browser should have a `token` cookie.
- **Test protected routes**:  
  Try accessing routes with and without valid tokens/roles.

---

## 11. **Troubleshooting**

- **401 Unauthorized**:
  - Token missing, invalid, or expired.
  - Azure AD misconfiguration (check client ID/secret/redirect URI).
- **403 Forbidden**:
  - User lacks required role.
- **Azure login fails**:
  - Check Azure app registration, redirect URI, and permissions.

---

## 12. **References**

- [Azure AD Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/)
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js)

---
