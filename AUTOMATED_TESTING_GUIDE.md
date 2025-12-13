# Automated Testing Guide

This guide explains how to run automated tests for the Guard Tracking App's critical flows.

## 📋 Prerequisites

1. **Backend server running** on port 3000
2. **Node.js** installed (v14+)
3. **Test accounts** created in the database

## 🚀 Quick Start

### 1. Start Backend Server

```bash
cd backend
npm run dev
```

The server should be running on `http://localhost:3000`

### 2. Run Automated Tests

```bash
# From project root
node test-complete-flows-automated.js
```

Or with custom base URL:

```bash
BASE_URL=http://192.168.1.12:3000 node test-complete-flows-automated.js
```

## 📊 What Gets Tested

### ✅ Authentication Flow
- Admin login
- Client login
- Guard login
- Token validation

### ✅ Invitation System
- Send guard invitation
- Send client invitation
- Get invitation details
- List invitations
- Accept invitation (register with code)
- Role assignment verification
- Cancel invitation

### ✅ Shift Management Flow
- Create site (client)
- Post shift (client)
- Get available shifts (guard)
- Apply for shift (guard)
- Get shift applications (client)
- Assign guard to shift (client)
- Accept shift assignment (guard)
- Get my shifts (guard)
- Start shift (guard)
- Get active shift
- End shift (guard)
- Get shift history

### ✅ Location Tracking
- Update location
- Get latest location
- Get location history

### ✅ Incident Reporting
- Create incident
- Get incident details
- Update incident status

### ✅ WebSocket Connection
- WebSocket connection
- Authentication via WebSocket
- Real-time communication

## 📈 Test Output

The test script provides detailed output:

```
🚀 COMPREHENSIVE AUTOMATED TEST SUITE
   Testing Invitation, Shift, and Other Flows
============================================================

📍 Testing against: http://localhost:3000/api
⏰ Started at: 2025-01-15T10:30:00.000Z

============================================================
🔍 HEALTH CHECK
============================================================
✅ PASS: API Health Check

============================================================
🔍 AUTHENTICATION
============================================================
✅ PASS: Admin Login - Token: eyJhbGciOiJIUzI1NiIs...
✅ PASS: Client Login
✅ PASS: Guard Login

============================================================
🔍 INVITATION SYSTEM
============================================================
✅ PASS: Send Guard Invitation - Invitation ID: abc123
✅ PASS: Get Invitation Details
✅ PASS: List Invitations - Found 5 invitations
✅ PASS: Accept Invitation (Register) - User registered with invitation
✅ PASS: Invitation Role Assignment - User assigned GUARD role
...

============================================================
🔍 TEST RESULTS SUMMARY
============================================================

📊 Total Tests: 35
✅ Passed: 33
❌ Failed: 2
📈 Success Rate: 94.3%

⏰ Completed at: 2025-01-15T10:35:00.000Z

============================================================
🎉 ALL TESTS PASSED!
============================================================
```

## 🔧 Configuration

### Test Accounts

The test script uses these default accounts:

```javascript
{
  admin: {
    email: 'admin@test.com',
    password: 'password123'
  },
  client: {
    email: 'client@test.com',
    password: 'password123'
  },
  guard: {
    email: 'guard@test.com',
    password: 'password123'
  }
}
```

**Important:** Make sure these accounts exist in your database before running tests.

### Environment Variables

- `BASE_URL`: Base URL for the API (default: `http://localhost:3000`)

Example:
```bash
BASE_URL=https://staging-api.tracsopro.com node test-complete-flows-automated.js
```

## 🐛 Troubleshooting

### Issue: "No admin token" or "Authentication failed"

**Solution:**
1. Verify backend server is running
2. Check test accounts exist in database
3. Verify account credentials are correct
4. Check API URL is correct

### Issue: "Invitation endpoint not found"

**Solution:**
1. Verify invitation routes are implemented in backend
2. Check API endpoint paths match
3. Verify authentication middleware is working

### Issue: "Shift creation failed"

**Solution:**
1. Check client token is valid
2. Verify site creation works first
3. Check shift data format is correct
4. Verify database schema supports shifts

### Issue: "WebSocket connection failed"

**Solution:**
1. Verify WebSocket server is running
2. Check Socket.IO is configured
3. Verify authentication token is valid
4. Check network connectivity

## 📝 Test Structure

The test file is organized into sections:

1. **Utility Functions**: Helper functions for making requests, logging, etc.
2. **Authentication Tests**: Login and token validation
3. **Invitation System Tests**: Complete invitation flow
4. **Shift Management Tests**: Full shift lifecycle
5. **Location Tracking Tests**: GPS tracking functionality
6. **Incident Reporting Tests**: Incident creation and management
7. **WebSocket Tests**: Real-time communication
8. **Main Test Runner**: Orchestrates all tests

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
name: Automated Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend
          npm install
      
      - name: Start backend
        run: |
          cd backend
          npm run dev &
          sleep 5
      
      - name: Run tests
        run: node test-complete-flows-automated.js
```

## 📊 Test Metrics

The test script tracks:
- Total tests run
- Passed tests
- Failed tests
- Success rate
- Individual test results with timestamps

## 🎯 Best Practices

1. **Run tests before committing:**
   ```bash
   node test-complete-flows-automated.js
   ```

2. **Run tests after backend changes:**
   - Always test after API modifications
   - Verify new endpoints work
   - Check backward compatibility

3. **Run tests in CI/CD:**
   - Automate test execution
   - Fail builds on test failures
   - Track test metrics over time

4. **Keep test accounts updated:**
   - Use dedicated test accounts
   - Don't use production accounts
   - Reset test data regularly

## 📚 Additional Resources

- **Development Testing Guide**: `DEVELOPMENT_TESTING_GUIDE.md`
- **Backend API Docs**: `backend/README.md`
- **Test Plan**: `TESTING_PLAN.md`

## 🆘 Need Help?

If tests are failing:
1. Check backend logs for errors
2. Verify database is accessible
3. Check network connectivity
4. Review test output for specific error messages
5. Ensure all required services are running

---

**Last Updated:** January 2025
**Test File:** `test-complete-flows-automated.js`



