# Postman Collection Guide

This guide shows how to build and export a Postman collection for the Regional Scholarship Portal API, including both unauthenticated and authenticated requests.

## 1. Start the backend

Run the Django backend locally:

```bash
python backend/manage.py runserver
```

Expected base URL:

```text
http://localhost:8000
```

All API routes in this project are under:

```text
/api/...
```

## 2. Create the Postman collection

1. Open Postman.
2. Click New > Collection.
3. Name it:
   - `Regional Scholarship Portal API`
4. Add two folders inside it:
   - `01 - Public / Unauthenticated`
   - `02 - Protected / Authenticated`

## 3. Add the shared environment variables

Create a Postman environment named `Regional Scholarship Portal Local` with these variables:

```text
base_url = http://localhost:8000
access_token =
```

Use the variables in requests as:

```text
{{base_url}}/api/auth/login
{{base_url}}/api/auth/profile
```

## 4. Add unauthenticated requests

Create these requests in the `01 - Public / Unauthenticated` folder:

### A. Register a user

- Method: POST
- URL: `{{base_url}}/api/auth/register`
- Body (JSON):

```json
{
  "email": "student@example.com",
  "password": "StrongPassword123!",
  "first_name": "Test",
  "last_name": "Student"
}
```

### B. Login

- Method: POST
- URL: `{{base_url}}/api/auth/login`
- Body (JSON):

```json
{
  "email": "student@example.com",
  "password": "StrongPassword123!"
}
```

After you run this request, copy the returned `access` token into the `access_token` environment variable.

### C. Refresh token

- Method: POST
- URL: `{{base_url}}/api/auth/refresh`
- Body (JSON):

```json
{
  "refresh": "<refresh-token-from-login-response>"
}
```

### D. Password reset request

- Method: POST
- URL: `{{base_url}}/api/auth/password-reset`
- Body (JSON):

```json
{
  "email": "student@example.com"
}
```

## 5. Add authenticated requests

Create these requests in the `02 - Protected / Authenticated` folder:

### A. Get profile

- Method: GET
- URL: `{{base_url}}/api/auth/profile`
- Header:
  - `Authorization: Bearer {{access_token}}`

### B. Update profile

- Method: PUT
- URL: `{{base_url}}/api/auth/profile`
- Header:
  - `Authorization: Bearer {{access_token}}`
- Body (JSON):

```json
{
  "first_name": "Updated",
  "last_name": "Student"
}
```

### C. Change password

- Method: POST
- URL: `{{base_url}}/api/auth/change-password`
- Header:
  - `Authorization: Bearer {{access_token}}`
- Body (JSON):

```json
{
  "old_password": "StrongPassword123!",
  "new_password": "NewStrongPassword123!"
}
```

### D. Student dashboard stats

- Method: GET
- URL: `{{base_url}}/api/student/stats/`
- Header:
  - `Authorization: Bearer {{access_token}}`

### E. Coordinator applications list

- Method: GET
- URL: `{{base_url}}/api/dashboard/applications/`
- Header:
  - `Authorization: Bearer {{access_token}}`

## 6. Save the collection for reuse

To keep the test requests for future use:

1. Click the collection name.
2. Select `Save`.
3. Verify the requests, folders, and environment variables are all present.

## 7. Export the collection to a .json file

1. Right-click the collection.
2. Choose `Export`.
3. Select format `Collection v2.1` (recommended).
4. Save the file as:

```text
docs/postman/RegionalScholarshipPortal.postman_collection.json
```

If the folder does not exist yet, create it first:

```bash
mkdir docs\postman
```

## 8. Recommended structure

Keep the exported file in:

```text
docs/postman/RegionalScholarshipPortal.postman_collection.json
```

This gives you a reusable API test bundle with:

- unauthenticated requests for login, register, and password reset
- authenticated requests for profile, dashboard, and protected actions
- a clean exportable `.json` file for sharing or version control

## 9. Useful notes

- The backend uses JWT authentication, so protected requests must send the access token in the `Authorization` header.
- The main API namespaces in this project are:
  - `/api/auth/`
  - `/api/applications/`
  - `/api/education/`
  - `/api/documents/`
  - `/api/student/`
  - `/api/dashboard/`
  - `/api/core/`
  - `/api/`
