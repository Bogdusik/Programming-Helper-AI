# API Documentation

Complete API documentation for Programming Helper AI project.

## Table of Contents

- [REST API Endpoints](#rest-api-endpoints)
- [Health & Status](#health--status)
- [User Management](#user-management)
- [tRPC API](#trpc-api)
- [Authentication](#authentication)
- [Usage Examples](#usage-examples)

---

## REST API Endpoints

### Base URL

- **Production**: `https://programming-helper-ai.vercel.app`
- **Local**: `http://localhost:3000`

---

## Health & Status

### GET /api/health

Health check endpoint for application and database status. Used for monitoring and load balancer health checks.

**Authentication**: Not required

**Parameters**: None

**Request Example:**

```bash
GET /api/health
```

**Success Response (200 OK):**

```json
{
  "status": "healthy",
  "timestamp": "2025-11-30T20:00:00.000Z",
  "services": {
    "database": "connected"
  }
}
```

**Error Response (503 Service Unavailable):**

```json
{
  "status": "unhealthy",
  "timestamp": "2025-11-30T20:00:00.000Z",
  "services": {
    "database": "disconnected"
  },
  "error": "Connection timeout" // only in development
}
```

---

## User Management

### GET /api/create-user

Creates a user in the database if they don't exist. Synchronizes user from Clerk with local database.

**Authentication**: Required (Clerk session cookie)

**Parameters**: None

**Request Example:**

```bash
GET /api/create-user
Cookie: __session=eyJhbGciOiJSUzI1NiIs...
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "User created successfully!",
  "user": {
    "id": "user_123",
    "role": "user",
    "email": "user@example.com",
    "isAdmin": false
  }
}
```

**Response if user already exists:**

```json
{
  "success": true,
  "message": "User already exists in database",
  "user": {
    "id": "user_123",
    "role": "admin",
    "email": "admin@example.com",
    "isAdmin": true
  }
}
```

**Error Responses:**

- `401 Unauthorized` - User is not authenticated
- `500 Internal Server Error` - Error creating user

---

### GET /api/check-blocked

Checks if the current user is blocked.

**Authentication**: Required (Clerk session cookie)

**Parameters**: None

**Request Example:**

```bash
GET /api/check-blocked
Cookie: __session=eyJhbGciOiJSUzI1NiIs...
```

**Response Example:**

```json
{
  "isBlocked": false
}
```

**If user is not authenticated:**

```json
{
  "isBlocked": false
}
```

---

## tRPC API

All main application endpoints use tRPC. tRPC provides:

- Automatic type safety
- Data validation
- Type-safe clients

### Base URL

`/api/trpc`

### Request Format

**GET requests:**

```
GET /api/trpc/{procedure}?input={JSON}
```

**POST requests:**

```
POST /api/trpc/{procedure}
Content-Type: application/json

{JSON data}
```

### Main Procedures

#### Chat

- `chat.createSession` - Create a new chat session
- `chat.getSessions` - Get all user sessions
- `chat.sendMessage` - Send a message
- `chat.getMessages` - Get session messages
- `chat.deleteSession` - Delete a session

#### Tasks

- `task.getTasks` - Get list of tasks (with filters)
- `task.getTask` - Get a specific task
- `task.completeTask` - Mark task as completed
- `task.getTaskProgress` - Get task progress

#### Stats

- `stats.getUserStats` - User statistics
- `stats.getGlobalStats` - Global statistics (public)

#### Profile

- `profile.getProfile` - Get user profile
- `profile.updateProfile` - Update profile
- `profile.getLanguageProgress` - Language learning progress

#### Assessment

- `assessment.getQuestions` - Get assessment questions
- `assessment.submitAssessment` - Submit assessment answers
- `assessment.getAssessments` - Get all user assessments
- `assessment.checkPostAssessmentEligibility` - Check post-assessment eligibility

#### Admin

- `admin.getDashboardStats` - Admin dashboard statistics
- `admin.getUsers` - List of users (with pagination)
- `admin.getAllTasks` - All tasks (with pagination)

#### Contact

- `contact.sendMessage` - Send contact form message (public)

---

## Authentication

### Clerk Authentication

The application uses [Clerk](https://clerk.com) for authentication. Authentication is done through **cookies**, not Bearer Token.

### How to Get Access

1. **In Browser**: Log in to the application - cookies will be set automatically
2. **In Postman**:
   - Use Postman Interceptor to sync cookies
   - Or copy the `__session` cookie from browser and add it to Postman

### Authentication Cookie

- **Name**: `__session` (single underscore)
- **Value**: JWT token from Clerk
- **Domain**: `programming-helper-ai.vercel.app`

### Usage in Postman

1. Open DevTools in browser → Application → Cookies
2. Copy the value of `__session` cookie
3. In Postman: Cookies → Manage Cookies → Add cookie for domain
4. Or add header:
   ```
   Cookie: __session=your_jwt_token
   ```

---

## Usage Examples

### Example 1: Health Check

```bash
curl https://programming-helper-ai.vercel.app/api/health
```

### Example 2: Create User

```bash
curl -X GET https://programming-helper-ai.vercel.app/api/create-user \
  -H "Cookie: __session=your_token"
```

### Example 3: Get Tasks List (tRPC)

```bash
curl "https://programming-helper-ai.vercel.app/api/trpc/task.getTasks?input=%7B%22language%22%3A%22javascript%22%2C%22difficulty%22%3A%22beginner%22%7D" \
  -H "Cookie: __session=your_token"
```

### Example 4: Send Message (tRPC)

```bash
curl -X POST https://programming-helper-ai.vercel.app/api/trpc/chat.sendMessage \
  -H "Content-Type: application/json" \
  -H "Cookie: __session=your_token" \
  -d '{
    "message": "How do I implement binary search?",
    "sessionId": "session-id-here"
  }'
```

---

## Response Codes

- `200 OK` - Successful request
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Internal server error
- `503 Service Unavailable` - Service unavailable

---

## Postman Collection

For convenient API testing, use the Postman collection:

- **Collection File**: `postman/Programming-Helper-AI.postman_collection.json`
- **Environment File**: `postman/Programming-Helper-AI-Production.postman_environment.json`

### Import to Postman

1. Open Postman
2. File → Import
3. Select collection and environment files
4. Select environment "Programming Helper AI - Production"
5. Configure cookies via Postman Interceptor or manually

---

## Additional Resources

- [Swagger/OpenAPI](https://swagger.io/) - Standard for REST API documentation
- [tRPC Documentation](https://trpc.io/) - tRPC documentation
- [Clerk Documentation](https://clerk.com/docs) - Clerk documentation

---

## Support

If you have questions about the API, create an issue in the repository or contact the development team.

---

**Last Updated**: May 12, 2026
