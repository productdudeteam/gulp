# 📚 Postman Setup Guide for Gulp API

This guide will help you set up Postman to test the Gulp API endpoints efficiently.

## 🚀 Quick Start

### 1. Import Collection and Environment

1. **Download the files:**

    - `postman/Gulp_API.postman_collection.json` - API collection
    - `postman/Gulp_API.postman_environment.json` - Environment variables

2. **Import into Postman:**

    - Open Postman
    - Click **Import** button
    - Drag and drop both files or click **Upload Files**
    - Select both files and click **Import**

3. **Set up Environment:**
    - In the top-right corner, select **"Gulp API - Local Development"** environment
    - Verify the `base_url` is set to `http://localhost:8000`

## 🔧 Environment Configuration

### Default Variables

| Variable                | Value                           | Description              |
| ----------------------- | ------------------------------- | ------------------------ |
| `base_url`              | `http://localhost:8000`         | API base URL             |
| `api_version`           | `v1`                            | API version              |
| `test_email`            | `test@example.com`              | Test user email          |
| `test_password`         | `testpassword123`               | Test user password       |
| `user_id`               | (empty)                         | Will be set after signup |
| `access_token`          | (empty)                         | Will be set after signin |
| `confirmation_token`    | `#access_token=...&type=signup` | Email confirmation token |
| `rate_limit_per_minute` | `60`                            | Rate limit setting       |

### Customizing Environment

1. **Click the environment name** in the top-right corner
2. **Edit variables** as needed:
    - Change `base_url` for different environments (dev, staging, prod)
    - Update `test_email` and `test_password` for your test account
    - Modify `rate_limit_per_minute` to test rate limiting

## 🧪 Testing Workflow

### Step 1: Health Check

1. Run **Health Check** endpoint
2. Verify API is running and healthy
3. Expected response: `{"status": "healthy", "message": "API is running"}`

### Step 2: User Registration

1. **Update test data** in the request body:
    ```json
    {
        "email": "{{test_email}}",
        "password": "{{test_password}}"
    }
    ```
2. Run **User Sign Up** endpoint
3. **Save user_id** from response to environment variable

### Step 3: User Authentication

1. Run **User Sign In** endpoint with same credentials
2. **Check cookies** - `access_token` should be set automatically
3. Verify response contains user data and session

### Step 4: Test Protected Endpoints

1. Run **Get User Profile** - should work with authentication
2. Run **Get Current User Info** - should return user data
3. Test **User Sign Out** - should clear cookies

### Step 5: Password Management

1. Test **Reset Password** with your email
2. Test **Change Password** (requires authentication)

## 🔐 Authentication Flow

### Cookie-Based Authentication

The API uses **HttpOnly cookies** for authentication:

1. **Sign In** sets cookies automatically
2. **Protected endpoints** read cookies automatically
3. **Sign Out** clears cookies automatically

### Manual Token Management

If you need to use Bearer tokens:

1. **Extract token** from signin response
2. **Set Authorization header:**
    ```
    Authorization: Bearer <your-token>
    ```

## 📋 API Endpoints Overview

### Health & Status

-   `GET /health` - API health check
-   `GET /` - API information

### Authentication

-   `POST /api/v1/signup` - User registration
-   `POST /api/v1/signin` - User login
-   `GET /api/v1/logout` - User logout
-   `GET /api/v1/confirm{token}` - Email confirmation
-   `POST /api/v1/reset-password` - Password reset
-   `POST /api/v1/change-password` - Change password

### User Profile

-   `GET /api/v1/profile` - Get user profile (authenticated)
-   `GET /api/v1/me` - Get current user info (optional auth)

## 🧪 Testing Scenarios

### 1. Happy Path Testing

```bash
1. Health Check → Should return 200
2. Sign Up → Should return 200 with user data
3. Sign In → Should return 200 with session
4. Get Profile → Should return 200 with profile
5. Sign Out → Should return 200 and clear cookies
```

### 2. Error Testing

```bash
1. Sign Up with invalid email → Should return 400
2. Sign Up with weak password → Should return 400
3. Sign In with wrong credentials → Should return 401
4. Get Profile without auth → Should return 401
5. Change password without auth → Should return 401
```

### 3. Rate Limiting Testing

```bash
1. Make 60+ requests in 1 minute
2. Should return 429 (Too Many Requests)
3. Wait 1 minute and retry
4. Should work again
```

### 4. Cookie Testing

```bash
1. Sign In → Check cookies are set
2. Make authenticated request → Should work
3. Clear cookies manually → Should fail
4. Sign Out → Check cookies are cleared
```

## 🔧 Advanced Testing

### Automated Tests

The collection includes **automated tests** that run on every request:

-   **Status code validation** - Ensures valid HTTP status codes
-   **JSON response validation** - Verifies response format
-   **Response time validation** - Checks performance (< 5 seconds)
-   **Rate limit detection** - Identifies rate limiting responses

### Custom Test Scripts

Add custom tests to specific endpoints:

```javascript
// Example: Test user signup
pm.test("User signup successful", function () {
    pm.expect(pm.response.code).to.equal(200);
    pm.expect(pm.response.json()).to.have.property("status", "success");
    pm.expect(pm.response.json().data).to.have.property("user");
});

// Save user ID to environment
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.data && response.data.user) {
        pm.environment.set("user_id", response.data.user.id);
    }
}
```

### Pre-request Scripts

Add setup logic before requests:

```javascript
// Example: Set dynamic timestamp
pm.environment.set("timestamp", new Date().toISOString());

// Example: Generate random email
const randomId = Math.random().toString(36).substring(7);
pm.environment.set("random_email", `test-${randomId}@example.com`);
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:8000
```

**Solution:** Ensure the FastAPI server is running on port 8000

#### 2. CORS Errors

```
Error: CORS policy: No 'Access-Control-Allow-Origin' header
```

**Solution:** Check CORS configuration in your `.env` file

#### 3. Authentication Failures

```
Error: Authentication required
```

**Solution:**

-   Ensure you've signed in first
-   Check that cookies are being sent
-   Verify the access token is valid

#### 4. Rate Limiting

```
Error: Rate limit exceeded
```

**Solution:** Wait 1 minute before making more requests

### Debug Mode

Enable debug logging in Postman:

1. **Open Postman Console** (View → Show Postman Console)
2. **Check request/response logs**
3. **Verify environment variables**
4. **Test individual components**

## 📊 Performance Testing

### Load Testing Setup

1. **Use Postman Runner** for bulk testing
2. **Set iterations** to test multiple requests
3. **Monitor response times** and error rates
4. **Test rate limiting** with high request volumes

### Example Runner Configuration

```
Iterations: 100
Delay: 100ms
Data File: test-data.csv
```

## 🔄 Environment Switching

### Development Environment

```json
{
    "base_url": "http://localhost:8000",
    "test_email": "dev@example.com"
}
```

### Staging Environment

```json
{
    "base_url": "https://staging-api.gulp.com",
    "test_email": "staging@example.com"
}
```

### Production Environment

```json
{
    "base_url": "https://api.gulp.com",
    "test_email": "prod@example.com"
}
```

## 📝 Best Practices

### 1. Environment Management

-   **Use separate environments** for different stages
-   **Never commit sensitive data** to version control
-   **Use environment variables** for dynamic values

### 2. Testing Strategy

-   **Test happy path first** - ensure basic functionality works
-   **Test error scenarios** - verify proper error handling
-   **Test edge cases** - boundary conditions and limits
-   **Test authentication flows** - login, logout, token refresh

### 3. Data Management

-   **Use unique test data** for each test run
-   **Clean up test data** after testing
-   **Avoid hardcoded values** in requests

### 4. Documentation

-   **Update collection descriptions** when APIs change
-   **Add examples** for complex requests
-   **Document test scenarios** and expected results

## 🎯 Next Steps

1. **Import the collection** and environment
2. **Start the FastAPI server** on localhost:8000
3. **Run through the testing workflow**
4. **Customize environment variables** for your needs
5. **Add custom tests** for your specific requirements
6. **Set up automated testing** with Postman Runner

## 📞 Support

If you encounter issues:

1. **Check the troubleshooting section** above
2. **Verify server configuration** and environment variables
3. **Review API documentation** in the collection
4. **Check Postman Console** for detailed error messages
5. **Refer to the main README** for server setup instructions

---

**Happy Testing! 🚀**
