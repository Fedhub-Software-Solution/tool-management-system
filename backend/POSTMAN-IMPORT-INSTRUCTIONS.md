# Postman Collection Import Instructions

## Quick Import Guide

### Step 1: Import Collection
1. Open Postman
2. Click **Import** button (top left)
3. Click **Upload Files**
4. Select `Tool-Maintenance-System.postman_collection.json`
5. Click **Import**

### Step 2: Import Environment (Optional but Recommended)
1. Click **Import** again
2. Select `Tool-Maintenance-System.postman_environment.json`
3. Click **Import**
4. Select the environment from the dropdown (top right)
5. Make sure it's set to "Tool Maintenance System - Local"

### Step 3: Update Environment Variables
1. Click the **Environments** icon (left sidebar)
2. Select "Tool Maintenance System - Local"
3. Update `baseUrl` if your server runs on a different port
4. The other variables (`accessToken`, `userId`, etc.) will be auto-populated when you run requests

## Using the Collection

### 1. Start with Authentication
1. Go to **Authentication** folder
2. Run **Login** request
   - Update email/password in the request body if needed
   - After successful login, `accessToken` and `refreshToken` will be automatically saved to environment

### 2. Test Projects
1. Go to **Projects** folder
2. Run **Get All Projects** to see existing projects
3. Run **Create Project** to create a new project (requires Approver role)
   - After creation, `projectId` will be automatically saved
4. Use **Get Project by ID** to fetch the created project
5. Use **Update Project** to modify the project
6. Use **Delete Project** to delete it

### 3. Test Users (if you have Approver role)
1. Go to **Users** folder
2. Run **Get All Users** to see all users
3. Run **Create User** to create a new user

## Environment Variables

The collection uses these environment variables:

- `baseUrl` - API base URL (default: http://localhost:3000)
- `accessToken` - JWT access token (auto-set after login)
- `refreshToken` - JWT refresh token (auto-set after login)
- `userId` - Current user ID (auto-set after login)
- `projectId` - Project ID (auto-set after creating/getting a project)
- `projectNumber` - Project number (auto-set after creating a project)

## Notes

- All authenticated endpoints automatically use the `accessToken` from environment
- The Login request automatically saves tokens to environment
- Create Project request automatically saves project ID for use in other requests
- Make sure your backend server is running before testing
- Update the email/password in Login request to match your database users

## Troubleshooting

### 401 Unauthorized
- Make sure you've run the Login request first
- Check that the token is saved in environment variables
- Try refreshing the token using Refresh Token request

### 403 Forbidden
- Check that your user has the required role (e.g., Approver for creating projects)
- Verify the token contains the correct role

### 404 Not Found
- Check that the server is running
- Verify the `baseUrl` is correct in environment
- Make sure the endpoint path is correct

### Connection Refused
- Make sure the backend server is running (`npm run dev`)
- Check that the port matches your environment variable (default: 3000)

