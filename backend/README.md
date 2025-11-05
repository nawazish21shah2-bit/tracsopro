# Guard Tracking Backend

Local development API server for the Guard Tracking mobile app.

## Tech Stack

- **Node.js** v20+
- **Express** 4.x
- **TypeScript** 5.x
- **JWT** for authentication
- **In-memory** data store (no database required)

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (auto-reload on changes)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Server runs on **http://localhost:3000**

## Verify Server

Open in browser:
- http://localhost:3000/api/health

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "time": "2025-10-26T07:05:00.000Z"
  }
}
```

## Pre-seeded Test Users

### Guard Account
- **Email**: guard1@example.com
- **Password**: Passw0rd!
- **Role**: guard

### Supervisor Account
- **Email**: supervisor1@example.com
- **Password**: Passw0rd!
- **Role**: supervisor

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/register` - Register new user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (requires auth)
- `GET /api/auth/me` - Get current user (requires auth)

### Guards
- `GET /api/guards` - List all guards (requires auth)
- `GET /api/guards/:id` - Get guard by ID (requires auth)
- `POST /api/guards` - Create guard (requires auth)
- `PUT /api/guards/:id` - Update guard (requires auth)
- `DELETE /api/guards/:id` - Delete guard (requires auth)

### Locations
- `GET /api/locations` - List all locations (requires auth)
- `PUT /api/locations/:id` - Update location (requires auth)

### Tracking
- `POST /api/tracking/location` - Submit location update (requires auth)
- `GET /api/tracking/:guardId` - Get tracking history (requires auth)

### Incidents
- `GET /api/incidents` - List all incidents (requires auth)
- `POST /api/incidents` - Create incident (requires auth)
- `PUT /api/incidents/:id` - Update incident (requires auth)

### Messages
- `GET /api/messages` - List messages (requires auth)
  - Query param: `?conversationId=<id>` to filter
- `POST /api/messages` - Send message (requires auth)

### Notifications
- `GET /api/notifications` - List notifications (requires auth)
- `PUT /api/notifications/:id/read` - Mark as read (requires auth)

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

### Login Response
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc...",
    "user": {
      "id": "u-1",
      "email": "guard1@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "guard",
      "isActive": true
    },
    "expiresIn": 1800
  }
}
```

## Authentication

Protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens expire after 30 minutes. Use the refresh endpoint to get a new token.

## Android Emulator Setup

The React Native app is configured to use:
- **Android Emulator**: `http://10.0.2.2:3000/api`
- **iOS Simulator**: `http://localhost:3000/api`

No changes needed - the app automatically detects the platform.

## Environment Variables

Create a `.env` file (optional):

```env
PORT=3000
JWT_SECRET=your-secret-key-here
```

Defaults:
- PORT: 3000
- JWT_SECRET: "dev-secret-change-me"

## Data Storage

All data is stored **in-memory**. Restarting the server will reset all data except the pre-seeded test users.

## Troubleshooting

### Port 3000 already in use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /F /PID <PID>

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Cannot connect from Android emulator

1. Ensure backend is running: http://localhost:3000/api/health
2. Verify app uses `10.0.2.2` in dev mode
3. Check firewall allows Node.js connections

## Development Notes

- Auto-reload enabled via `tsx watch`
- CORS enabled for all origins in dev
- No database required
- JWT tokens use HS256 algorithm
- Refresh tokens valid for 7 days

## Production Deployment

For production, you should:
1. Use a real database (PostgreSQL, MongoDB, etc.)
2. Set strong JWT_SECRET
3. Configure CORS for specific origins
4. Add rate limiting
5. Enable HTTPS
6. Add request validation
7. Implement proper logging

This is a **development server** only. Do not use in production as-is.
