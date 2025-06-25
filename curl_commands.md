# CURL Commands for Testing /api/auth/login

## 1. Test Login Thành Công

```bash
curl -X POST http://localhost:5024/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

## 2. Test Login với Sai Password

```bash
curl -X POST http://localhost:5024/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "WrongPassword123!"
  }'
```

## 3. Test Login với Email Không Tồn Tại

```bash
curl -X POST http://localhost:5024/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@example.com",
    "password": "Test123!"
  }'
```

## 4. Test Login với Dữ Liệu Rỗng

```bash
curl -X POST http://localhost:5024/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "",
    "password": ""
  }'
```

## 5. Test Login với Thiếu Email

```bash
curl -X POST http://localhost:5024/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "password": "Test123!"
  }'
```

## 6. Test Login với Thiếu Password

```bash
curl -X POST http://localhost:5024/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

## 7. Test với User Khác (Admin)

```bash
curl -X POST http://localhost:5024/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

## 8. Test với User Sample

```bash
curl -X POST http://localhost:5024/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sarah@example.com",
    "password": "User123!"
  }'
```

## PowerShell Commands (Alternative)

### Test Login Thành Công
```powershell
$loginData = @{
    email = "test@example.com"
    password = "Test123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5024/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
```

### Test với Error Handling
```powershell
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5024/api/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    Write-Host "Login successful: $($response.username)"
} catch {
    Write-Host "Login failed: $($_.Exception.Message)"
}
```

## Expected Responses

### Success Response (200 OK)
```json
{
  "id": "be778d7f-ba39-43b8-be53-14a2318912c2",
  "username": "testuser",
  "displayName": "testuser",
  "email": "test@example.com",
  "avatarUrl": "https://api.dicebear.com/6.x/initials/svg?seed=testuser",
  "isOnline": true,
  "lastActive": "2025-06-18T08:25:21.9934498Z",
  "bio": null,
  "token": "eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9...",
  "role": "User"
}
```

### Error Response (401 Unauthorized)
```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.2",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid email or password"
}
```

### Validation Error (400 Bad Request)
```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "Email": ["The Email field is required."],
    "Password": ["The Password field is required."]
  }
}
```

## Notes

- Server must be running on `http://localhost:5024`
- Content-Type must be `application/json`
- Email and password are required fields
- Token is returned on successful login for authentication
- User status is updated to online on successful login 