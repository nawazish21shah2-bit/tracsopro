# Guard Tracking Application - Comprehensive Testing Plan

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: Testing Strategy & Planning  
**Purpose**: Complete testing strategy for Guard Tracking Application

---

## Table of Contents

1. [Testing Strategy Overview](#testing-strategy-overview)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [API Testing](#api-testing)
6. [Mobile Device Testing](#mobile-device-testing)
7. [Performance Testing](#performance-testing)
8. [Security Testing](#security-testing)
9. [Test Data Management](#test-data-management)
10. [Test Automation Strategy](#test-automation-strategy)

---

## Testing Strategy Overview

### Testing Pyramid

```
                    /\
                   /  \
                  / E2E \          (10% - Critical User Flows)
                 /______\
                /        \
               /Integration\      (20% - Feature Integration)
              /____________\
             /              \
            /   Unit Tests    \   (70% - Components & Services)
           /__________________\
```

### Testing Coverage Goals

- **Unit Tests**: 80% code coverage
- **Integration Tests**: 60% API endpoint coverage
- **E2E Tests**: 100% critical user flow coverage
- **Mobile Tests**: All supported devices and OS versions

### Testing Tools

#### Backend
- **Jest**: Unit and integration testing
- **Supertest**: API endpoint testing
- **Prisma Test Client**: Database testing
- **Postman/Newman**: API contract testing

#### Mobile App
- **Jest**: Unit testing
- **React Native Testing Library**: Component testing
- **Detox**: E2E testing
- **Flipper**: Debugging and inspection

---

## Unit Testing

### Backend Unit Tests

#### Test Structure
```
backend/
├── src/
│   ├── services/
│   │   └── __tests__/
│   │       ├── authService.test.ts
│   │       ├── shiftService.test.ts
│   │       └── ...
│   ├── controllers/
│   │   └── __tests__/
│   │       ├── authController.test.ts
│   │       └── ...
│   └── utils/
│       └── __tests__/
│           ├── jwt.test.ts
│           └── ...
```

#### Services to Test

**1. Auth Service** (`services/authService.ts`)
```typescript
describe('AuthService', () => {
  describe('register', () => {
    it('should create user and send OTP')
    it('should hash password before storing')
    it('should generate OTP and store with expiry')
    it('should handle duplicate email')
    it('should validate email format')
  })

  describe('login', () => {
    it('should authenticate valid credentials')
    it('should reject invalid password')
    it('should reject non-existent user')
    it('should check if email is verified')
  })

  describe('verifyOTP', () => {
    it('should verify valid OTP code')
    it('should reject expired OTP')
    it('should reject invalid OTP')
    it('should mark email as verified')
  })
})
```

**2. Shift Service** (`services/shiftService.ts`)
```typescript
describe('ShiftService', () => {
  describe('createShift', () => {
    it('should create shift with valid data')
    it('should assign guard to shift')
    it('should validate shift times')
    it('should handle guard unavailability')
  })

  describe('checkIn', () => {
    it('should check in guard with location')
    it('should validate geofence boundaries')
    it('should update shift status')
    it('should reject check-in outside geofence')
  })

  describe('checkOut', () => {
    it('should check out guard from shift')
    it('should calculate shift duration')
    it('should update shift status')
  })
})
```

**3. Tracking Service** (`services/trackingService.ts`)
```typescript
describe('TrackingService', () => {
  describe('recordLocation', () => {
    it('should store tracking record')
    it('should validate coordinates')
    it('should associate with active shift')
    it('should handle accuracy data')
  })

  describe('getCurrentLocation', () => {
    it('should return latest location')
    it('should handle no location data')
  })
})
```

#### Controllers to Test

**1. Auth Controller** (`controllers/authController.ts`)
```typescript
describe('AuthController', () => {
  describe('POST /auth/register', () => {
    it('should return 201 on successful registration')
    it('should return 400 on invalid data')
    it('should return 409 on duplicate email')
  })

  describe('POST /auth/login', () => {
    it('should return 200 with tokens on success')
    it('should return 401 on invalid credentials')
  })
})
```

#### Utilities to Test

**1. JWT Utils** (`utils/jwt.ts`)
```typescript
describe('JWT Utils', () => {
  describe('generateTokens', () => {
    it('should generate access and refresh tokens')
    it('should include user ID in token')
    it('should set correct expiration')
  })

  describe('verifyToken', () => {
    it('should verify valid token')
    it('should reject expired token')
    it('should reject invalid signature')
  })
})
```

### Mobile App Unit Tests

#### Test Structure
```
GuardTrackingApp/
├── src/
│   ├── services/
│   │   └── __tests__/
│   │       ├── api.test.ts
│   │       ├── locationService.test.ts
│   │       └── ...
│   ├── store/
│   │   ├── slices/
│   │   │   └── __tests__/
│   │   │       ├── authSlice.test.ts
│   │   │       └── ...
│   ├── components/
│   │   └── __tests__/
│   │       ├── Button.test.tsx
│   │       └── ...
│   └── utils/
│       └── __tests__/
│           ├── validation.test.ts
│           └── ...
```

#### Services to Test

**1. API Service** (`services/api.ts`)
```typescript
describe('ApiService', () => {
  describe('login', () => {
    it('should call login endpoint with credentials')
    it('should store tokens on success')
    it('should handle network errors')
    it('should handle invalid credentials')
  })

  describe('request interceptor', () => {
    it('should add auth token to headers')
    it('should refresh token if expired')
    it('should handle missing token')
  })
})
```

**2. Location Service** (`services/LocationService.ts`)
```typescript
describe('LocationService', () => {
  describe('getCurrentLocation', () => {
    it('should request location permission')
    it('should return coordinates')
    it('should handle permission denial')
    it('should handle location unavailable')
  })

  describe('startTracking', () => {
    it('should start background tracking')
    it('should call callback with location updates')
    it('should handle errors gracefully')
  })
})
```

#### Redux Slices to Test

**1. Auth Slice** (`store/slices/authSlice.ts`)
```typescript
describe('authSlice', () => {
  describe('login', () => {
    it('should set user and token on login')
    it('should set isAuthenticated to true')
    it('should handle login error')
  })

  describe('logout', () => {
    it('should clear user data')
    it('should set isAuthenticated to false')
  })
})
```

#### Components to Test

**1. Button Component** (`components/common/Button.tsx`)
```typescript
describe('Button', () => {
  it('should render with text')
  it('should call onPress when clicked')
  it('should show loading state')
  it('should be disabled when loading')
  it('should apply custom styles')
})
```

---

## Integration Testing

### Backend API Integration Tests

#### Test Structure
```
backend/
├── tests/
│   ├── integration/
│   │   ├── auth.integration.test.ts
│   │   ├── shifts.integration.test.ts
│   │   └── ...
│   └── setup/
│       ├── test-db.ts
│       └── test-server.ts
```

#### Authentication Flow Tests

```typescript
describe('Authentication Integration', () => {
  beforeEach(async () => {
    await setupTestDatabase()
  })

  describe('User Registration Flow', () => {
    it('should complete full registration flow', async () => {
      // 1. Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({ email, password, firstName, lastName })
      expect(registerResponse.status).toBe(201)
      expect(registerResponse.body.data.requiresOTP).toBe(true)

      // 2. Verify OTP
      const otpResponse = await request(app)
        .post('/api/auth/verify-otp')
        .send({ userId: registerResponse.body.data.userId, otp: '123456' })
      expect(otpResponse.status).toBe(200)
      expect(otpResponse.body.data.token).toBeDefined()

      // 3. Get user profile
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${otpResponse.body.data.token}`)
      expect(profileResponse.status).toBe(200)
      expect(profileResponse.body.data.isEmailVerified).toBe(true)
    })
  })

  describe('Login Flow', () => {
    it('should complete login and token refresh', async () => {
      // 1. Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password })
      expect(loginResponse.status).toBe(200)
      const { accessToken, refreshToken } = loginResponse.body.data

      // 2. Use access token
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(profileResponse.status).toBe(200)

      // 3. Refresh token
      const refreshResponse = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
      expect(refreshResponse.status).toBe(200)
      expect(refreshResponse.body.data.accessToken).toBeDefined()
    })
  })
})
```

#### Shift Management Flow Tests

```typescript
describe('Shift Management Integration', () => {
  let guardToken: string
  let clientToken: string

  beforeEach(async () => {
    guardToken = await getAuthToken('guard@test.com')
    clientToken = await getAuthToken('client@test.com')
  })

  describe('Shift Creation and Check-in Flow', () => {
    it('should complete full shift lifecycle', async () => {
      // 1. Client creates shift
      const shiftResponse = await request(app)
        .post('/api/shifts')
        .set('Authorization', `Bearer ${clientToken}`)
        .send({
          guardId: testGuard.id,
          locationName: 'Test Location',
          scheduledStartTime: futureTime,
          scheduledEndTime: futureTime + 8 * 3600000,
        })
      expect(shiftResponse.status).toBe(201)
      const shiftId = shiftResponse.body.data.id

      // 2. Guard checks in
      const checkInResponse = await request(app)
        .post(`/api/shifts/${shiftId}/check-in`)
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          latitude: 40.7128,
          longitude: -74.0060,
        })
      expect(checkInResponse.status).toBe(200)
      expect(checkInResponse.body.data.status).toBe('IN_PROGRESS')

      // 3. Guard checks out
      const checkOutResponse = await request(app)
        .post(`/api/shifts/${shiftId}/check-out`)
        .set('Authorization', `Bearer ${guardToken}`)
        .send({
          latitude: 40.7128,
          longitude: -74.0060,
        })
      expect(checkOutResponse.status).toBe(200)
      expect(checkOutResponse.body.data.status).toBe('COMPLETED')
    })
  })
})
```

### Database Integration Tests

```typescript
describe('Database Operations', () => {
  describe('Prisma Client', () => {
    it('should connect to test database')
    it('should perform CRUD operations')
    it('should handle transactions')
    it('should handle relationships correctly')
  })

  describe('Data Integrity', () => {
    it('should enforce foreign key constraints')
    it('should cascade deletes correctly')
    it('should enforce unique constraints')
  })
})
```

---

## End-to-End Testing

### Mobile App E2E Tests (Detox)

#### Test Structure
```
GuardTrackingApp/
├── e2e/
│   ├── auth.e2e.ts
│   ├── shifts.e2e.ts
│   ├── location.e2e.ts
│   └── ...
```

#### Critical User Flows to Test

**1. Guard Registration & Login Flow**
```typescript
describe('Guard Registration Flow', () => {
  beforeAll(async () => {
    await device.launchApp()
  })

  it('should complete guard registration and login', async () => {
    // 1. Navigate to registration
    await element(by.id('register-button')).tap()

    // 2. Select Guard role
    await element(by.id('role-guard')).tap()

    // 3. Fill registration form
    await element(by.id('email-input')).typeText('guard@test.com')
    await element(by.id('password-input')).typeText('Test1234!')
    await element(by.id('firstName-input')).typeText('John')
    await element(by.id('lastName-input')).typeText('Doe')
    await element(by.id('submit-button')).tap()

    // 4. Verify OTP screen appears
    await expect(element(by.id('otp-screen'))).toBeVisible()

    // 5. Enter OTP (mock OTP from test backend)
    await element(by.id('otp-input')).typeText('123456')
    await element(by.id('verify-button')).tap()

    // 6. Verify navigation to dashboard
    await expect(element(by.id('guard-dashboard'))).toBeVisible()
  })
})
```

**2. Guard Check-in Flow**
```typescript
describe('Guard Check-in Flow', () => {
  beforeEach(async () => {
    await loginAsGuard()
  })

  it('should check in to active shift', async () => {
    // 1. Navigate to shifts
    await element(by.id('shifts-tab')).tap()

    // 2. Tap on active shift
    await element(by.id('active-shift-card')).tap()

    // 3. Tap check-in button
    await element(by.id('check-in-button')).tap()

    // 4. Grant location permission
    await device.grantPermissions(['location'])

    // 5. Verify check-in success
    await expect(element(by.id('check-in-success'))).toBeVisible()

    // 6. Verify shift status updated
    await expect(element(by.id('shift-status-in-progress'))).toBeVisible()
  })
})
```

**3. Incident Reporting Flow**
```typescript
describe('Incident Reporting Flow', () => {
  beforeEach(async () => {
    await loginAsGuard()
    await checkInToShift()
  })

  it('should submit incident report with photo', async () => {
    // 1. Navigate to reports
    await element(by.id('reports-tab')).tap()

    // 2. Tap create report button
    await element(by.id('create-report-button')).tap()

    // 3. Fill incident details
    await element(by.id('incident-type-select')).tap()
    await element(by.text('SECURITY_BREACH')).tap()
    await element(by.id('description-input')).typeText('Test incident description')

    // 4. Take/select photo
    await element(by.id('add-photo-button')).tap()
    await element(by.text('Take Photo')).tap()
    // Photo capture handled by device

    // 5. Submit report
    await element(by.id('submit-button')).tap()

    // 6. Verify success message
    await expect(element(by.id('report-submitted-success'))).toBeVisible()
  })
})
```

### Web E2E Tests (If Admin Dashboard Exists)

**Tools**: Playwright or Cypress

```typescript
describe('Admin Dashboard E2E', () => {
  it('should manage guards', async () => {
    await page.goto('http://localhost:3000/admin')
    await page.fill('#email', 'admin@test.com')
    await page.fill('#password', 'password')
    await page.click('button[type="submit"]')
    await page.click('#guards-menu')
    // ... continue test
  })
})
```

---

## API Testing

### Contract Testing (Postman/Newman)

#### Test Collection Structure
```
postman/
├── collections/
│   ├── GuardTrackingApp.postman_collection.json
│   └── environments/
│       ├── development.json
│       └── production.json
├── scripts/
│   └── run-tests.sh
```

#### API Test Scenarios

**1. Authentication Endpoints**
- POST /auth/register - Valid registration
- POST /auth/register - Duplicate email
- POST /auth/login - Valid credentials
- POST /auth/login - Invalid credentials
- POST /auth/verify-otp - Valid OTP
- POST /auth/verify-otp - Expired OTP
- POST /auth/refresh - Valid refresh token
- POST /auth/refresh - Invalid refresh token

**2. Shift Endpoints**
- GET /shifts/active - With valid guard token
- POST /shifts - Create shift (client)
- POST /shifts/:id/check-in - Valid location
- POST /shifts/:id/check-in - Invalid geofence
- POST /shifts/:id/check-out - After check-in

**3. Location Tracking**
- POST /tracking/location - Valid coordinates
- GET /tracking/:guardId - Current location
- GET /tracking/:guardId/history - Location history

**4. Authorization Tests**
- Test role-based access control
- Test token expiration handling
- Test unauthorized access rejection

### Performance API Tests

```typescript
describe('API Performance', () => {
  it('should respond to health check in < 100ms', async () => {
    const start = Date.now()
    await request(app).get('/api/health')
    const duration = Date.now() - start
    expect(duration).toBeLessThan(100)
  })

  it('should handle 100 concurrent requests', async () => {
    const requests = Array(100).fill(null).map(() =>
      request(app).get('/api/shifts/active').set('Authorization', `Bearer ${token}`)
    )
    const responses = await Promise.all(requests)
    responses.forEach(res => expect(res.status).toBe(200))
  })
})
```

---

## Mobile Device Testing

### Device Matrix

#### Android
- **OS Versions**: Android 8.0 (API 26) to Android 14 (API 34)
- **Devices**: 
  - Pixel 7 Pro (Android 13)
  - Samsung Galaxy S23 (Android 13)
  - OnePlus 11 (Android 13)
  - Budget device (Android 10+)

#### iOS
- **OS Versions**: iOS 13.0 to iOS 17.0
- **Devices**:
  - iPhone 14 Pro (iOS 17)
  - iPhone 12 (iOS 16)
  - iPhone SE 2020 (iOS 15)

### Manual Testing Checklist

#### Authentication
- [ ] Registration with valid email
- [ ] Registration with invalid email format
- [ ] OTP verification (valid code)
- [ ] OTP verification (expired code)
- [ ] Login with valid credentials
- [ ] Login with invalid credentials
- [ ] Password reset flow
- [ ] Biometric login (if implemented)

#### Location Services
- [ ] Location permission request
- [ ] Location permission denial
- [ ] GPS accuracy in urban areas
- [ ] GPS accuracy in rural areas
- [ ] Indoor location handling
- [ ] Background location tracking
- [ ] Battery impact of location tracking

#### Shift Management
- [ ] View upcoming shifts
- [ ] Check-in to shift
- [ ] Check-out from shift
- [ ] Break start/end
- [ ] Shift completion

#### Incident Reporting
- [ ] Create incident report
- [ ] Attach photo from camera
- [ ] Attach photo from gallery
- [ ] Video attachment
- [ ] Report submission offline
- [ ] Report sync when online

#### Real-time Features
- [ ] WebSocket connection establishment
- [ ] Real-time location updates
- [ ] Push notification receipt
- [ ] Notification tap navigation
- [ ] Connection recovery after disconnect

#### Offline Functionality
- [ ] App launch offline
- [ ] View cached data
- [ ] Submit report offline
- [ ] Queue API requests
- [ ] Sync when back online
- [ ] Handle sync conflicts

#### Performance
- [ ] App startup time (< 3 seconds)
- [ ] Screen transition smoothness
- [ ] Memory usage during extended use
- [ ] Battery drain during background tracking
- [ ] Network usage optimization

### Device-Specific Testing

#### Android
- [ ] Background location restrictions (Android 10+)
- [ ] Battery optimization exemptions
- [ ] Deep sleep handling
- [ ] Notification channels
- [ ] Adaptive icons
- [ ] Dark mode support

#### iOS
- [ ] Background location updates
- [ ] Significant location changes
- [ ] Background app refresh
- [ ] Push notification handling
- [ ] Face ID / Touch ID
- [ ] Dark mode support

---

## Performance Testing

### Backend Performance Tests

**Load Testing (Artillery.io)**
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained load"
  scenarios:
    - name: "API Load Test"
      flow:
        - post:
            url: "/api/auth/login"
            json:
              email: "test@example.com"
              password: "password"
```

**Performance Metrics**:
- Response time: < 200ms (p95)
- Throughput: 1000 requests/second
- Error rate: < 1%
- Database query time: < 50ms

### Mobile App Performance Tests

**React Native Performance Profiler**
- Bundle size analysis
- Render performance
- Memory leak detection
- Network request optimization

**Key Metrics**:
- App startup: < 3 seconds
- Screen transition: 60 FPS
- Memory usage: < 200MB
- Battery drain: < 5% per hour (background)

---

## Security Testing

### Authentication Security

- [ ] JWT token expiration
- [ ] Token refresh mechanism
- [ ] Password hashing (bcrypt)
- [ ] OTP expiry validation
- [ ] Rate limiting on auth endpoints
- [ ] SQL injection prevention (Prisma)
- [ ] XSS prevention
- [ ] CSRF protection

### API Security

- [ ] Authorization checks on all endpoints
- [ ] Role-based access control
- [ ] Input validation and sanitization
- [ ] File upload validation
- [ ] CORS configuration
- [ ] HTTPS enforcement

### Mobile App Security

- [ ] Token storage security (Keychain/Keystore)
- [ ] Certificate pinning
- [ ] Root/Jailbreak detection
- [ ] Code obfuscation
- [ ] API key protection
- [ ] Secure storage for sensitive data

---

## Test Data Management

### Test Data Strategy

**Development Database**
- Separate test database
- Seed script with test data
- Database reset between test runs

**Test Users**
- Guard users: guard1@test.com, guard2@test.com
- Client users: client1@test.com, client2@test.com
- Admin users: admin@test.com
- Super admin: superadmin@test.com

**Test Scenarios**
- Valid data scenarios
- Edge cases
- Error conditions
- Boundary values

### Test Data Cleanup

```typescript
afterEach(async () => {
  await cleanupTestData()
})

afterAll(async () => {
  await resetTestDatabase()
})
```

---

## Test Automation Strategy

### CI/CD Integration

**GitHub Actions / GitLab CI**

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: cd backend && npm install
      - name: Run tests
        run: cd backend && npm test
      - name: Generate coverage
        run: cd backend && npm run test:coverage

  mobile-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: cd GuardTrackingApp && npm install
      - name: Run tests
        run: cd GuardTrackingApp && npm test
```

### Test Execution Schedule

- **Pre-commit**: Run linting and quick unit tests
- **Pull Request**: Run full test suite
- **Nightly**: Run E2E tests and performance tests
- **Before Release**: Complete test suite including security tests

---

## Test Reporting

### Coverage Reports

- **Backend**: Jest coverage reports (HTML + JSON)
- **Mobile**: Jest coverage reports
- **Target**: 80% code coverage

### Test Results

- Test execution reports
- Failed test notifications
- Performance metrics
- Security scan results

---

## Next Steps

1. ✅ Review this testing plan
2. ⏳ Set up test infrastructure
3. ⏳ Implement unit tests (priority: services and utilities)
4. ⏳ Implement integration tests (priority: authentication and shifts)
5. ⏳ Implement E2E tests (priority: critical user flows)
6. ⏳ Set up CI/CD test automation
7. ⏳ Perform manual device testing

---

**Status**: Testing strategy defined. Ready for implementation.  
**Maintained By**: Primary Development Agent  
**Last Review**: January 2025


