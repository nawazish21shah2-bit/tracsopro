# Guard Tracking API Documentation Guide

## 🎯 Overview

This guide explains the automated API documentation system implemented using Swagger/OpenAPI 3.0 for the Guard Tracking backend.

## 📚 Documentation Access

### Interactive Documentation (Swagger UI)
```
http://localhost:3000/api-docs
```
- **Features**:
  - Interactive API testing
  - Request/response examples
  - Authentication testing with JWT tokens
  - Schema validation
  - Try-it-out functionality

### JSON Specification
```
http://localhost:3000/api-docs.json
```
- Raw OpenAPI 3.0 specification in JSON format
- Can be imported into Postman, Insomnia, or other API clients

## 🚀 Quick Start

### 1. Start the Server
```bash
cd backend
npm run dev:db
```

### 2. Access Documentation
Open your browser and navigate to:
```
http://localhost:3000/api-docs
```

### 3. Test Authentication Endpoints

#### Register a New User
1. Click on **POST /auth/register**
2. Click **"Try it out"**
3. Modify the request body:
```json
{
  "email": "test@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "GUARD"
}
```
4. Click **"Execute"**
5. Copy the `token` from the response

#### Authenticate Requests
1. Click the **"Authorize"** button at the top
2. Enter: `Bearer YOUR_TOKEN_HERE`
3. Click **"Authorize"**
4. Now you can test protected endpoints

## 📖 Documentation Structure

### Components

#### 1. **Schemas**
Reusable data models:
- `User`: User profile structure
- `AuthResponse`: Authentication response format
- `Error`: Standard error response format

#### 2. **Security Schemes**
- `BearerAuth`: JWT token authentication

#### 3. **Tags**
Organized endpoint categories:
- **Authentication**: Login, register, token management
- **Users**: User management
- **Guards**: Guard-specific operations
- **Shifts**: Shift management
- **Reports**: Report handling

## 🔧 Adding New Endpoints

### Step 1: Add JSDoc Comments

Add Swagger annotations above your route definition:

```typescript
/**
 * @swagger
 * /your-endpoint:
 *   post:
 *     summary: Brief description
 *     description: Detailed description
 *     tags: [YourTag]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field1:
 *                 type: string
 *                 example: value1
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 */
router.post('/your-endpoint', controller.method);
```

### Step 2: Restart Server

The documentation updates automatically when you restart the server.

## 🎨 Customization

### Modify Swagger Configuration

Edit `src/app.ts`:

```typescript
const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Your API Title',
      version: '1.0.0',
      description: 'Your API Description',
    },
    // ... more configuration
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};
```

### Add Custom Schemas

Add new schemas in the `components.schemas` section:

```typescript
schemas: {
  YourModel: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
    },
  },
}
```

## 📊 Current Documented Endpoints

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Authenticate user | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | Logout user | Yes |
| GET | `/auth/me` | Get current user profile | Yes |
| POST | `/auth/change-password` | Change password | Yes |

## 🔐 Security Features

### JWT Authentication
- **Format**: `Bearer <token>`
- **Header**: `Authorization`
- **Expiration**: 30 minutes (access token)
- **Refresh**: 7 days (refresh token)

### Testing Protected Endpoints
1. Login or register to get a token
2. Click **"Authorize"** button
3. Enter: `Bearer YOUR_TOKEN`
4. Test protected endpoints

## 📝 Best Practices

### 1. **Comprehensive Descriptions**
- Use clear, concise summaries
- Provide detailed descriptions
- Include usage examples

### 2. **Request/Response Examples**
- Always include example values
- Show realistic data
- Document edge cases

### 3. **Error Responses**
- Document all possible error codes
- Explain error conditions
- Provide resolution steps

### 4. **Schema Reusability**
- Use `$ref` for common schemas
- Define reusable components
- Maintain consistency

## 🛠️ Troubleshooting

### Documentation Not Updating
1. Restart the server
2. Clear browser cache
3. Check for syntax errors in JSDoc comments

### Endpoints Not Appearing
1. Verify JSDoc syntax
2. Check file paths in `apis` configuration
3. Ensure route is properly registered

### Authentication Not Working
1. Verify token format: `Bearer <token>`
2. Check token expiration
3. Ensure proper authorization header

## 📦 Export Options

### Postman Collection
1. Visit `/api-docs.json`
2. Copy the JSON
3. Import into Postman: File → Import → Raw Text

### OpenAPI Clients
Generate client SDKs using:
```bash
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3000/api-docs.json \
  -g typescript-axios \
  -o ./generated-client
```

## 🌐 Production Deployment

### Update Server URLs

Edit `src/app.ts`:

```typescript
servers: [
  {
    url: 'https://api.yourproduction.com/api',
    description: 'Production server',
  },
  {
    url: 'http://localhost:3000/api',
    description: 'Development server',
  },
],
```

### Disable in Production (Optional)

```typescript
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
```

## 📚 Additional Resources

- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [swagger-ui-express Documentation](https://github.com/scottie1984/swagger-ui-express)

## ✅ Checklist for New Endpoints

- [ ] Add JSDoc comments with `@swagger` tag
- [ ] Include summary and description
- [ ] Document request body schema
- [ ] Document all response codes
- [ ] Add examples for request/response
- [ ] Specify authentication requirements
- [ ] Test in Swagger UI
- [ ] Verify in `/api-docs.json`

## 🎯 Next Steps

1. **Add More Endpoints**: Document remaining routes (users, guards, shifts, reports)
2. **Enhance Schemas**: Add more detailed data models
3. **Add Examples**: Include more realistic request/response examples
4. **Security**: Document rate limiting and other security measures
5. **Versioning**: Implement API versioning strategy

---

**Last Updated**: October 29, 2025  
**Version**: 1.0.0  
**Maintained By**: Development Team
