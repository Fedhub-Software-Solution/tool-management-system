# Testing Guide - Project Endpoints

## Prerequisites

1. Make sure your backend server is running:
   ```bash
   npm run dev
   ```

2. Make sure you have a user in the database (or create one via API)

3. Get an authentication token by logging in first

## Testing Steps

### 1. Login to Get Authentication Token

```bash
# Using curl (PowerShell)
curl -X POST http://localhost:3000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"your-email@example.com\",\"password\":\"your-password\"}'

# Or using PowerShell Invoke-WebRequest
$loginBody = @{
  email = "your-email@example.com"
  password = "your-password"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $loginBody

$token = ($loginResponse.Content | ConvertFrom-Json).data.token
```

### 2. Test GET /api/projects (Get All Projects)

```bash
# Using curl
curl -X GET http://localhost:3000/api/projects `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Using PowerShell
$headers = @{
  Authorization = "Bearer $token"
}

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/projects" `
  -Method GET `
  -Headers $headers

$response.Content | ConvertFrom-Json
```

**With Query Parameters:**
```bash
# Filter by status
curl -X GET "http://localhost:3000/api/projects?status=Active" `
  -H "Authorization: Bearer YOUR_TOKEN"

# Search
curl -X GET "http://localhost:3000/api/projects?search=PO-123" `
  -H "Authorization: Bearer YOUR_TOKEN"

# Pagination
curl -X GET "http://localhost:3000/api/projects?page=1&limit=10" `
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Test POST /api/projects (Create Project) - Approver Only

```bash
# Using curl
curl -X POST http://localhost:3000/api/projects `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d "{\"customerPO\":\"PO-CUST-2024-001\",\"partNumber\":\"PN-12345\",\"toolNumber\":\"TN-9001\",\"price\":125000,\"targetDate\":\"2024-12-31\",\"status\":\"Active\",\"description\":\"Test project\"}"

# Using PowerShell
$projectBody = @{
  customerPO = "PO-CUST-2024-001"
  partNumber = "PN-12345"
  toolNumber = "TN-9001"
  price = 125000
  targetDate = "2024-12-31"
  status = "Active"
  description = "Test project"
} | ConvertTo-Json

$createResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/projects" `
  -Method POST `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $projectBody

$createResponse.Content | ConvertFrom-Json
```

**Expected Response:**
- Status: 201 Created
- Contains project data with auto-generated projectNumber

### 4. Test GET /api/projects/:id (Get Project by ID)

```bash
# Replace PROJECT_ID with actual ID from create response
curl -X GET http://localhost:3000/api/projects/PROJECT_ID `
  -H "Authorization: Bearer YOUR_TOKEN"

# Using PowerShell
$projectId = "YOUR_PROJECT_ID"
$getResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/projects/$projectId" `
  -Method GET `
  -Headers $headers

$getResponse.Content | ConvertFrom-Json
```

### 5. Test PUT /api/projects/:id (Update Project) - Approver Only

```bash
# Using curl
curl -X PUT http://localhost:3000/api/projects/PROJECT_ID `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d "{\"status\":\"Completed\",\"description\":\"Updated description\"}"

# Using PowerShell
$updateBody = @{
  status = "Completed"
  description = "Updated description"
} | ConvertTo-Json

$updateResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/projects/$projectId" `
  -Method PUT `
  -Headers $headers `
  -ContentType "application/json" `
  -Body $updateBody

$updateResponse.Content | ConvertFrom-Json
```

### 6. Test DELETE /api/projects/:id (Delete Project) - Approver Only

```bash
# Using curl
curl -X DELETE http://localhost:3000/api/projects/PROJECT_ID `
  -H "Authorization: Bearer YOUR_TOKEN"

# Using PowerShell
$deleteResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/projects/$projectId" `
  -Method DELETE `
  -Headers $headers

$deleteResponse.Content | ConvertFrom-Json
```

## Expected Results

### GET /api/projects
- Returns paginated list of projects
- Supports filtering by status
- Supports search across customer PO, part number, tool number
- Returns pagination metadata

### POST /api/projects
- Creates new project
- Auto-generates project number (format: PROJ-YYYY-XXX)
- Returns created project data
- Requires Approver role

### GET /api/projects/:id
- Returns single project by ID
- Includes creator information

### PUT /api/projects/:id
- Updates project
- Returns updated project data
- Requires Approver role

### DELETE /api/projects/:id
- Deletes project
- Returns success message
- Requires Approver role

## Error Testing

### Test Without Authentication
```bash
curl -X GET http://localhost:3000/api/projects
# Should return 401 Unauthorized
```

### Test With Invalid Token
```bash
curl -X GET http://localhost:3000/api/projects `
  -H "Authorization: Bearer invalid_token"
# Should return 401 Unauthorized
```

### Test Authorization (Non-Approver trying to create)
```bash
# Login with non-Approver user (e.g., NPD role)
# Then try to create project
# Should return 403 Forbidden
```

### Test Validation Errors
```bash
# Try to create project with missing required fields
curl -X POST http://localhost:3000/api/projects `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d "{\"customerPO\":\"PO-123\"}"
# Should return 400 Bad Request with validation errors
```

## Using Postman or Similar Tools

1. Create a new request
2. Set method (GET, POST, PUT, DELETE)
3. Set URL: `http://localhost:3000/api/projects` (or with ID)
4. In Headers tab, add:
   - Key: `Authorization`
   - Value: `Bearer YOUR_TOKEN_HERE`
5. For POST/PUT, in Body tab:
   - Select "raw" and "JSON"
   - Enter request body as JSON

## Notes

- All endpoints require authentication (Bearer token)
- Create, Update, Delete operations require Approver role
- Project numbers are auto-generated in format: PROJ-YYYY-XXX
- Date format should be YYYY-MM-DD
- Prices should be positive numbers

