# 🎯 MAJOR USE CASES FLOW - Guard Tracking App

**Project**: tracSOpro - Guard Tracking Application  
**Version**: Production Ready  
**Date**: Complete Implementation

---

## 📋 **TABLE OF CONTENTS**

1. [Authentication Flows](#authentication-flows)
2. [Guard Use Cases](#guard-use-cases)
3. [Client Use Cases](#client-use-cases)
4. [Admin Use Cases](#admin-use-cases)
5. [Super Admin Use Cases](#super-admin-use-cases)
6. [Payment Flows](#payment-flows)
7. [Chat & Messaging Flows](#chat--messaging-flows)
8. [Emergency & Reporting Flows](#emergency--reporting-flows)
9. [Location Tracking Flows](#location-tracking-flows)

---

## 🔐 **AUTHENTICATION FLOWS**

### **1. Guard Registration Flow** ✅

```
Step 1: Onboarding (First Time Only)
  └─> User sees app introduction
  └─> Swipes through onboarding screens
  └─> Taps "Get Started"
  └─> AsyncStorage: hasSeenOnboarding = true

Step 2: Account Type Selection
  └─> User selects "Guard" role
  └─> Navigates to RegisterScreen

Step 3: Registration Form
  └─> User enters:
      • First Name
      • Last Name
      • Email
      • Password
      • Confirm Password
  └─> Taps "Continue"
  └─> API: POST /auth/register
  └─> Response: { userId, email, role: "GUARD" }
  └─> Redux: setTempUserData({ userId, email })

Step 4: Email Verification (OTP)
  └─> Navigates to EmailVerificationScreen
  └─> User receives OTP via email
  └─> User enters 6-digit OTP
  └─> Taps "Verify"
  └─> API: POST /auth/verify-otp
  └─> Response: { token, refreshToken, user }
  └─> Redux: setUser, setTokens
  └─> AsyncStorage: Save tokens

Step 5: Guard Profile Setup
  └─> Navigates to GuardProfileSetupScreen
  └─> User uploads:
      • Profile Picture
      • ID Card (Front)
      • ID Card (Back)
      • Certifications (Multiple)
  └─> User selects Experience Level
  └─> Taps "Submit"
  └─> API: PUT /guards/profile
  └─> API: GET /auth/me (refresh user data)
  └─> Redux: updateUserProfile

Step 6: Dashboard Access
  └─> Navigates to GuardDashboard
  └─> User can now access all guard features
```

### **2. Client Registration Flow** ✅

```
Step 1: Onboarding (First Time Only)
  └─> User sees app introduction
  └─> Swipes through onboarding screens
  └─> Taps "Get Started"

Step 2: Account Type Selection
  └─> User selects "Client" role
  └─> Navigates to AccountTypeScreen

Step 3: Account Type Choice
  └─> User selects:
      • Individual Account
      OR
      • Company Account
  └─> Navigates to RegisterScreen (Client)

Step 4: Registration Form
  └─> User enters:
      • First Name
      • Last Name
      • Email
      • Password
      • Confirm Password
      • Phone (Optional)
  └─> Taps "Continue"
  └─> API: POST /auth/register
  └─> Response: { userId, email, role: "CLIENT", accountType }
  └─> Redux: setTempUserData({ userId, email })

Step 5: Email Verification (OTP)
  └─> Navigates to EmailVerificationScreen
  └─> User receives OTP via email
  └─> User enters 6-digit OTP
  └─> Taps "Verify"
  └─> API: POST /auth/verify-otp
  └─> Response: { token, refreshToken, user }
  └─> Redux: setUser, setTokens

Step 6: Client Profile Setup
  └─> Navigates to ClientProfileSetupScreen
  └─> For Individual:
      • Personal Address
      • Phone Number
      • Emergency Contact
  └─> For Company:
      • Company Name
      • Registration Number
      • Tax ID
      • Company Address
      • Company Phone
      • Website
  └─> Taps "Submit"
  └─> API: PUT /clients/profile
  └─> API: GET /auth/me (refresh user data)

Step 7: Dashboard Access
  └─> Navigates to ClientDashboard
  └─> User can now access all client features
```

### **3. Login Flow** ✅

```
Step 1: Login Screen
  └─> User enters:
      • Email
      • Password
  └─> Taps "Login"
  └─> API: POST /auth/login
  └─> Response: { token, refreshToken, user }
  └─> Redux: setUser, setTokens
  └─> AsyncStorage: Save tokens

Step 2: Role-Based Navigation
  └─> If GUARD → GuardStackNavigator
  └─> If CLIENT → ClientStackNavigator
  └─> If ADMIN → AdminNavigator
  └─> If SUPER_ADMIN → SuperAdminNavigator

Step 3: Dashboard
  └─> User lands on role-specific dashboard
```

### **4. Forgot Password Flow** ✅

```
Step 1: Forgot Password Screen
  └─> User enters email
  └─> Taps "Send Reset Link"
  └─> API: POST /auth/forgot-password
  └─> Response: { message: "OTP sent to email" }

Step 2: OTP Verification
  └─> User receives OTP via email
  └─> Navigates to ResetPasswordScreen
  └─> User enters:
      • Email
      • OTP
      • New Password
      • Confirm New Password
  └─> Taps "Reset Password"
  └─> API: POST /auth/reset-password
  └─> Response: { message: "Password reset successfully" }

Step 3: Login
  └─> User can now login with new password
```

---

## 🛡️ **GUARD USE CASES**

### **Use Case 1: Browse and Apply for Shifts** ✅

```
Step 1: Navigate to Available Shifts
  └─> Guard opens app
  └─> Taps "Jobs" tab
  └─> Screen: AvailableShiftsScreen
  └─> API: GET /shift-postings/available?page=1&limit=10

Step 2: Browse Shift Postings
  └─> View list of available shifts:
      • Location Name
      • Date & Time
      • Duration
      • Pay Rate
      • Requirements
      • Status (Open/Closed)
  └─> Can filter by:
      • Date Range
      • Location
      • Pay Rate
      • Shift Type

Step 3: View Shift Details
  └─> Taps on a shift posting
  └─> API: GET /shift-postings/{id}
  └─> View detailed information:
      • Full Description
      • Site Details
      • Requirements
      • Application Deadline
      • Number of Applicants

Step 4: Apply for Shift
  └─> Taps "Apply Now"
  └─> Navigates to ApplyForShiftScreen
  └─> Optionally enters application message
  └─> Taps "Submit Application"
  └─> API: POST /shift-postings/{id}/apply
  └─> Response: { message: "Application submitted" }
  └─> Status changes to "Applied"

Step 5: Track Application
  └─> Can view application status:
      • Pending
      • Approved
      • Rejected
  └─> Receives notification when status changes
```

### **Use Case 2: Check-In to Shift** ✅

```
Step 1: View Upcoming Shifts
  └─> Guard opens app
  └─> Taps "Check In" tab
  └─> Screen: CheckInScreen
  └─> API: GET /shifts/upcoming
  └─> View list of assigned shifts:
      • Today's Assignments
      • Upcoming Assignments

Step 2: Select Shift to Check-In
  └─> Taps on an assignment
  └─> Navigates to CheckInOutScreen
  └─> API: GET /shifts/{id}
  └─> View shift details:
      • Location
      • Scheduled Time
      • Instructions
      • Check-in Status

Step 3: Check-In Process
  └─> Taps "Check In" button
  └─> App requests location permission
  └─> Gets current GPS location:
      • Latitude
      • Longitude
      • Accuracy
      • Address (reverse geocoded)
  └─> API: POST /shifts/{id}/check-in
      Body: { location: { lat, lng, accuracy, address } }
  └─> Response: { shift, checkInTime, location }
  └─> Status updates to "Checked In"
  └─> WebSocket: Broadcast location update

Step 4: Active Shift Monitoring
  └─> Guard is now on active shift
  └─> Location tracking starts (if enabled)
  └─> Can submit reports
  └─> Can trigger emergency alerts
  └─> Can chat with supervisor/client
```

### **Use Case 3: Check-Out from Shift** ✅

```
Step 1: Active Shift View
  └─> Guard is on active shift
  └─> Navigates to CheckInOutScreen
  └─> View shift status: "Checked In"

Step 2: Check-Out Process
  └─> Taps "Check Out" button
  └─> App requests location permission
  └─> Gets current GPS location
  └─> Optionally enters checkout notes:
      • Shift Summary
      • Incidents
      • Observations
  └─> Taps "Confirm Check Out"
  └─> API: POST /shifts/{id}/check-out
      Body: { location: {...}, notes: "..." }
  └─> Response: { shift, checkOutTime, location }
  └─> Status updates to "Completed"
  └─> WebSocket: Broadcast shift completion

Step 3: Shift Completion
  └─> Shift is marked as completed
  └─> Guard can view shift summary
  └─> Payment processing begins (if applicable)
```

### **Use Case 4: View Shift History** ✅

```
Step 1: Navigate to My Shifts
  └─> Guard opens app
  └─> Taps "My Shifts" tab
  └─> Screen: MyShiftsScreen
  └─> API: GET /shifts/past (or from Redux store)

Step 2: View Shift Categories
  └─> Today's Shifts
      • Active shifts
      • Completed shifts today
  └─> Upcoming Shifts
      • Scheduled future shifts
  └─> Past Shifts
      • Historical completed shifts

Step 3: View Shift Details
  └─> Taps on a shift
  └─> View complete shift information:
      • Check-in/Check-out times
      • Location data
      • Duration
      • Reports submitted
      • Payment status
      • Rating/Feedback
```

### **Use Case 5: Submit Emergency Alert** ✅

```
Step 1: Emergency Alert Trigger
  └─> Guard opens Reports screen
  └─> Taps "Emergency Alert" button
  └─> OR uses quick access button (if available)

Step 2: Select Alert Type
  └─> Alert Types:
      • PANIC
      • MEDICAL
      • SECURITY
      • FIRE
      • CUSTOM
  └─> Select Severity:
      • LOW
      • MEDIUM
      • HIGH
      • CRITICAL

Step 3: Add Details
  └─> Optionally enters message/description
  └─> App automatically captures:
      • Current GPS location
      • Timestamp
      • Guard ID

Step 4: Send Alert
  └─> Taps "Send Alert"
  └─> API: POST /emergency/alert
      Body: {
        type: "PANIC",
        severity: "CRITICAL",
        location: { lat, lng, accuracy, address },
        message: "..."
      }
  └─> Response: { alertId, timestamp }
  └─> WebSocket: Broadcast emergency alert
  └─> All supervisors/clients notified immediately

Step 5: Alert Response
  └─> Alert appears on supervisor/client dashboard
  └─> Real-time location tracking enabled
  └─> Response team can coordinate
```

### **Use Case 6: Submit Shift Report** ✅

```
Step 1: Navigate to Reports
  └─> Guard opens app
  └─> Taps "Reports" tab
  └─> Screen: ReportsScreen

Step 2: Create New Report
  └─> Taps "New Report" button
  └─> Selects shift (if multiple active)
  └─> Navigates to CreateReportScreen

Step 3: Fill Report Details
  └─> Report Type:
      • Incident Report
      • Daily Activity Report
      • Maintenance Report
      • Other
  └─> Details:
      • Title
      • Description
      • Location
      • Time
      • Severity
  └─> Attachments:
      • Photos
      • Videos
      • Documents

Step 4: Submit Report
  └─> Taps "Submit Report"
  └─> API: POST /reports
  └─> Response: { reportId, timestamp }
  └─> Report appears in history
  └─> Supervisor/client notified
```

### **Use Case 7: Chat with Supervisor/Client** ✅

```
Step 1: Navigate to Chat
  └─> Guard opens app
  └─> Taps "Chat" tab
  └─> Screen: ChatListScreen
  └─> API: GET /chat/conversations

Step 2: View Conversations
  └─> List of conversations:
      • Supervisor
      • Client
      • Other guards (if applicable)
  └─> Shows:
      • Last message preview
      • Unread count
      • Timestamp

Step 3: Open Conversation
  └─> Taps on a conversation
  └─> Navigates to IndividualChatScreen
  └─> API: GET /chat/messages/{conversationId}
  └─> Loads message history

Step 4: Send Message
  └─> Types message
  └─> Optionally attaches:
      • Photo
      • Location
      • Document
  └─> Taps "Send"
  └─> API: POST /chat/messages
  └─> WebSocket: Broadcast message
  └─> Optimistic UI update
  └─> Message appears in chat

Step 5: Real-Time Updates
  └─> WebSocket receives new messages
  └─> Typing indicators
  └─> Message read receipts
  └─> Online/offline status
```

---

## 🏢 **CLIENT USE CASES**

### **Use Case 1: Create and Manage Sites** ✅

```
Step 1: Navigate to Sites
  └─> Client opens app
  └─> Taps "Sites & Shifts" tab
  └─> Screen: ClientSitesScreen
  └─> API: GET /clients/sites

Step 2: View Sites List
  └─> List of all client sites:
      • Site Name
      • Address
      • Status (Active/Inactive)
      • Number of Shifts
      • Assigned Guards

Step 3: Add New Site
  └─> Taps "Add New Site" button
  └─> Navigates to AddSiteScreen
  └─> Fills site details:
      • Site Name
      • Address
      • City, State, ZIP
      • Site Type
      • Contact Person
      • Phone
      • Special Instructions
      • Site Photos
  └─> Taps "Save Site"
  └─> API: POST /clients/sites
  └─> Response: { siteId, ... }
  └─> Site appears in list

Step 4: View Site Details
  └─> Taps on a site
  └─> Navigates to SiteDetailsScreen
  └─> API: GET /sites/{id}
  └─> View:
      • Complete site information
      • Shift postings for this site
      • Assigned guards
      • Site history
      • Reports from this site

Step 5: Edit Site
  └─> Taps "Edit" button
  └─> Updates site information
  └─> Taps "Save"
  └─> API: PUT /sites/{id}
  └─> Site updated
```

### **Use Case 2: Create Shift Posting** ✅

```
Step 1: Navigate to Create Shift
  └─> Client opens app
  └─> From SiteDetailsScreen
  └─> Taps "Create Shift" button
  └─> Navigates to CreateShiftScreen

Step 2: Fill Shift Details
  └─> Select Site (from client's sites)
  └─> Location Name
  └─> Location Address
  └─> Scheduled Start Time
  └─> Scheduled End Time
  └─> Description
  └─> Notes
  └─> Requirements
  └─> Pay Rate (if applicable)

Step 3: Submit Shift Posting
  └─> Taps "Create Shift"
  └─> API: POST /admin/shifts
      Body: {
        guardId: null, // For posting, not assignment
        locationName: "...",
        locationAddress: "...",
        scheduledStartTime: "2024-01-15T09:00:00Z",
        scheduledEndTime: "2024-01-15T17:00:00Z",
        description: "...",
        notes: "..."
      }
  └─> Response: { shiftPostingId, ... }
  └─> Shift posting created

Step 4: Monitor Applications
  └─> Shift appears in available shifts
  └─> Guards can apply
  └─> Client can view applications
  └─> Client can approve/reject applications
```

### **Use Case 3: Monitor Guard Activity** ✅

```
Step 1: View Active Shifts
  └─> Client opens app
  └─> Taps "Dashboard" tab
  └─> Screen: ClientDashboard
  └─> View active shifts:
      • Guard Name
      • Site Location
      • Check-in Status
      • Current Location (if on shift)
      • Shift Duration

Step 2: View Guard Location
  └─> Taps on active shift
  └─> View guard's real-time location
  └─> Map view with guard marker
  └─> Location updates via WebSocket

Step 3: View Guard Reports
  └─> Taps "Reports" tab
  └─> View all reports from guards:
      • Incident Reports
      • Daily Activity Reports
      • Time-stamped entries
  └─> Filter by:
      • Site
      • Guard
      • Date Range
      • Report Type

Step 4: Respond to Reports
  └─> Taps on a report
  └─> View full report details
  └─> Can add comments
  └─> Can escalate if needed
```

### **Use Case 4: Manage Payments** ✅

```
Step 1: Navigate to Payments
  └─> Client opens app
  └─> Taps "Payments" tab
  └─> Screen: PaymentScreen
  └─> API: GET /clients/payments

Step 2: View Payment History
  └─> List of all payments:
      • Shift Payments
      • Subscription Payments
      • Invoice Payments
  └─> Shows:
      • Amount
      • Date
      • Status (Paid/Pending/Failed)
      • Payment Method

Step 3: Make Payment
  └─> Taps "Pay Now" on pending payment
  └─> Navigates to PaymentScreen
  └─> API: POST /payments/create-intent
  └─> Response: { clientSecret, paymentIntentId }
  └─> Stripe PaymentSheet initialized
  └─> User completes payment:
      • Selects payment method
      • Confirms payment
  └─> API: POST /payments/confirm
  └─> Payment processed
  └─> Status updates to "Paid"

Step 4: Manage Payment Methods
  └─> Taps "Payment Methods"
  └─> Navigates to PaymentMethodsScreen
  └─> View saved payment methods:
      • Credit Cards
      • Debit Cards
      • Default method
  └─> Add New Payment Method:
      • Taps "Add Payment Method"
      • API: POST /payments/setup-intent
      • Stripe SetupIntent initialized
      • User enters card details
      • Payment method saved
```

### **Use Case 5: Chat with Guards** ✅

```
Step 1: Navigate to Chat
  └─> Client opens app
  └─> Taps "Chat" tab
  └─> Screen: ChatListScreen
  └─> API: GET /chat/conversations

Step 2: View Conversations
  └─> List of conversations:
      • Active Guards
      • Supervisors
      • Support
  └─> Shows:
      • Last message
      • Unread count
      • Online status

Step 3: Open Conversation
  └─> Taps on guard conversation
  └─> Navigates to IndividualChatScreen
  └─> API: GET /chat/messages/{conversationId}
  └─> Loads message history

Step 4: Send Message
  └─> Types message
  └─> Optionally attaches files
  └─> Taps "Send"
  └─> API: POST /chat/messages
  └─> WebSocket: Broadcast message
  └─> Guard receives notification

Step 5: Real-Time Communication
  └─> WebSocket updates
  └─> Typing indicators
  └─> Read receipts
  └─> Push notifications
```

---

## 👨‍💼 **ADMIN USE CASES**

### **Use Case 1: Create Shift Assignment** ✅

```
Step 1: Navigate to Operations
  └─> Admin opens app
  └─> Taps "Operations" tab
  └─> Screen: AdminOperationsScreen

Step 2: Create Shift
  └─> Taps "Create Shift" button
  └─> Navigates to CreateShiftScreen
  └─> Selects Guard (from guard list)
  └─> Selects Site/Client
  └─> Fills shift details:
      • Location
      • Date & Time
      • Duration
      • Instructions
  └─> Taps "Create Shift"
  └─> API: POST /admin/shifts
      Body: {
        guardId: "guard-uuid",
        locationName: "...",
        locationAddress: "...",
        scheduledStartTime: "...",
        scheduledEndTime: "...",
        description: "..."
      }
  └─> Response: { shiftId, ... }
  └─> Shift assigned to guard
  └─> Guard receives notification
```

### **Use Case 2: Manage Guards** ✅

```
Step 1: Navigate to Guard Management
  └─> Admin opens app
  └─> Taps "Management" tab
  └─> Screen: AdminManagementScreen
  └─> Taps "Guards" section
  └─> API: GET /admin/guards

Step 2: View Guards List
  └─> List of all guards:
      • Name
      • Employee ID
      • Status (Active/Inactive)
      • Department
      • Performance Metrics
      • Last Activity

Step 3: View Guard Details
  └─> Taps on a guard
  └─> View:
      • Profile Information
      • Qualifications
      • Shift History
      • Performance Reports
      • Ratings
      • Certifications

Step 4: Manage Guard
  └─> Can update guard status
  └─> Can assign to departments
  └─> Can view performance analytics
  └─> Can generate reports
```

### **Use Case 3: Monitor All Operations** ✅

```
Step 1: Dashboard Overview
  └─> Admin opens app
  └─> Taps "Dashboard" tab
  └─> Screen: AdminDashboard
  └─> View real-time metrics:
      • Active Shifts
      • Active Guards
      • Active Clients
      • Today's Check-ins
      • Pending Reports
      • Emergency Alerts

Step 2: View Active Shifts
  └─> Taps "Active Shifts"
  └─> View all active shifts:
      • Guard Name
      • Client/Site
      • Location
      • Status
      • Duration

Step 3: View Reports
  └─> Taps "Reports" tab
  └─> View all reports:
      • Incident Reports
      • Activity Reports
      • Performance Reports
  └─> Can filter and search
  └─> Can export reports

Step 4: Respond to Emergencies
  └─> Emergency alerts appear on dashboard
  └─> Taps on alert
  └─> View:
      • Alert Type
      • Severity
      • Guard Location
      • Details
  └─> Can coordinate response
  └─> Can contact guard via chat
```

---

## 🔧 **SUPER ADMIN USE CASES**

### **Use Case 1: Manage Security Companies** ✅

```
Step 1: Navigate to Companies
  └─> Super Admin opens app
  └─> Taps "Companies" tab
  └─> Screen: SuperAdminCompaniesScreen
  └─> API: GET /super-admin/companies

Step 2: View Companies List
  └─> List of all security companies:
      • Company Name
      • Registration Number
      • Subscription Plan
      • Subscription Status
      • Number of Guards
      • Number of Clients
      • Revenue

Step 3: View Company Details
  └─> Taps on a company
  └─> View:
      • Company Information
      • Subscription Details
      • Billing History
      • Users (Guards, Clients, Admins)
      • Sites
      • Analytics

Step 4: Manage Subscription
  └─> Can upgrade/downgrade plan
  └─> Can change subscription status
  └─> Can set limits (guards, clients, sites)
  └─> Can view billing records
```

### **Use Case 2: Platform Analytics** ✅

```
Step 1: Navigate to Analytics
  └─> Super Admin opens app
  └─> Taps "Analytics" tab
  └─> Screen: SuperAdminAnalyticsScreen
  └─> API: GET /super-admin/analytics

Step 2: View Platform Metrics
  └─> Overall Platform:
      • Total Companies
      • Total Users
      • Total Shifts
      • Total Revenue
      • Active Subscriptions
  └─> Time-based Analytics:
      • Daily/Weekly/Monthly trends
      • Growth metrics
      • User engagement

Step 3: View Company Analytics
  └─> Per-company metrics:
      • Active Guards
      • Active Clients
      • Shifts Completed
      • Revenue Generated
      • Subscription Status

Step 4: Generate Reports
  └─> Can export analytics
  └─> Can generate custom reports
  └─> Can schedule automated reports
```

---

## 💳 **PAYMENT FLOWS**

### **Use Case 1: Process Shift Payment** ✅

```
Step 1: Payment Trigger
  └─> Shift completed
  └─> Payment record created
  └─> Client notified

Step 2: Client Initiates Payment
  └─> Client opens Payments tab
  └─> Views pending payment
  └─> Taps "Pay Now"
  └─> API: POST /payments/create-intent
  └─> Response: { clientSecret, paymentIntentId }

Step 3: Stripe Payment Sheet
  └─> StripeService.initialize()
  └─> initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'tracSOpro'
      })
  └─> presentPaymentSheet()
  └─> User selects payment method
  └─> User confirms payment

Step 4: Payment Confirmation
  └─> PaymentSheet result:
      • Success → API: POST /payments/confirm
      • Failed → Show error, retry option
      • Canceled → Return to payment list
  └─> Payment status updated
  └─> Guard notified of payment
```

### **Use Case 2: Add Payment Method** ✅

```
Step 1: Navigate to Payment Methods
  └─> Client opens app
  └─> Taps "Payment Methods"
  └─> Screen: PaymentMethodsScreen
  └─> API: GET /clients/payment-methods

Step 2: View Saved Methods
  └─> List of payment methods:
      • Card ending in XXXX
      • Expiry date
      • Default indicator

Step 3: Add New Method
  └─> Taps "Add Payment Method"
  └─> API: POST /payments/setup-intent
  └─> Response: { clientSecret, setupIntentId }
  └─> initPaymentSheet({
        setupIntentClientSecret: clientSecret
      })
  └─> presentPaymentSheet()
  └─> User enters card details
  └─> Payment method saved

Step 4: Set Default Method
  └─> Taps on a payment method
  └─> Taps "Set as Default"
  └─> API: PUT /clients/payment-methods/{id}/default
  └─> Default method updated
```

---

## 💬 **CHAT & MESSAGING FLOWS**

### **Use Case 1: Real-Time Chat** ✅

```
Step 1: Open Chat
  └─> User opens app
  └─> Taps "Chat" tab
  └─> Screen: ChatListScreen
  └─> API: GET /chat/conversations
  └─> WebSocket: Connect to chat service

Step 2: Select Conversation
  └─> Taps on a conversation
  └─> Navigates to IndividualChatScreen
  └─> API: GET /chat/messages/{conversationId}
  └─> Loads message history

Step 3: Send Message
  └─> Types message
  └─> Optionally attaches:
      • Photo (from gallery/camera)
      • Location (current GPS)
      • Document
  └─> Taps "Send"
  └─> Optimistic UI update (message appears immediately)
  └─> API: POST /chat/messages
  └─> WebSocket: Broadcast message to recipient
  └─> If offline: Message queued, sent on reconnect

Step 4: Receive Message
  └─> WebSocket receives message
  └─> Message appears in chat
  └─> Push notification (if app in background)
  └─> Unread count updates

Step 5: Typing Indicators
  └─> User starts typing
  └─> WebSocket: sendTypingIndicator({ conversationId, isTyping: true })
  └─> Recipient sees "typing..." indicator
  └─> User stops typing
  └─> WebSocket: sendTypingIndicator({ conversationId, isTyping: false })
```

### **Use Case 2: Offline Message Handling** ✅

```
Step 1: Connection Loss
  └─> WebSocket disconnects
  └─> Connection state: "disconnected"
  └─> Messages queued locally

Step 2: Send Message While Offline
  └─> User sends message
  └─> Message added to queue
  └─> UI shows "Sending..." status
  └─> Message stored in local queue (max 100 messages)

Step 3: Reconnection
  └─> WebSocket attempts reconnection
  └─> Exponential backoff: 1s → 2s → 4s → 8s → 16s → 30s
  └─> Connection restored
  └─> Connection state: "connected"

Step 4: Process Queue
  └─> processMessageQueue() called
  └─> Queued messages sent in order
  └─> Messages removed from queue on success
  └─> Failed messages re-queued
  └─> UI updates to "Sent" status
```

---

## 🚨 **EMERGENCY & REPORTING FLOWS**

### **Use Case 1: Emergency Alert** ✅

```
Step 1: Trigger Emergency
  └─> Guard opens Reports screen
  └─> Taps "Emergency Alert" button
  └─> OR uses quick access (if configured)

Step 2: Select Alert Type
  └─> Alert Types:
      • PANIC - Immediate danger
      • MEDICAL - Medical emergency
      • SECURITY - Security threat
      • FIRE - Fire emergency
      • CUSTOM - Custom emergency
  └─> Select Severity:
      • LOW - Minor issue
      • MEDIUM - Moderate concern
      • HIGH - Serious issue
      • CRITICAL - Life-threatening

Step 3: Capture Location
  └─> App requests location permission
  └─> Gets current GPS location:
      • Latitude
      • Longitude
      • Accuracy
      • Address (reverse geocoded)
  └─> Location displayed on map

Step 4: Add Details
  └─> Optionally enters message/description
  └─> Can attach photos/videos
  └─> Taps "Send Alert"

Step 5: Send Alert
  └─> API: POST /emergency/alert
      Body: {
        type: "PANIC",
        severity: "CRITICAL",
        location: { lat, lng, accuracy, address },
        message: "..."
      }
  └─> Response: { alertId, timestamp }
  └─> WebSocket: Broadcast emergency alert
  └─> All supervisors/clients notified immediately
  └─> Push notifications sent
  └─> Alert appears on all dashboards

Step 6: Alert Response
  └─> Supervisors/clients see alert
  └─> Real-time location tracking enabled
  └─> Can view guard location on map
  └─> Can contact guard via chat/call
  └─> Response team can coordinate
  └─> Alert status tracked
```

### **Use Case 2: Submit Incident Report** ✅

```
Step 1: Navigate to Reports
  └─> Guard opens app
  └─> Taps "Reports" tab
  └─> Screen: ReportsScreen

Step 2: Create Report
  └─> Taps "New Report" button
  └─> Selects report type:
      • Incident Report
      • Daily Activity Report
      • Maintenance Report
      • Other

Step 3: Fill Report Details
  └─> Title
  └─> Description
  └─> Location (auto-filled if on shift)
  └─> Time (auto-filled)
  └─> Severity Level
  └─> Attachments:
      • Photos
      • Videos
      • Documents

Step 4: Submit Report
  └─> Taps "Submit Report"
  └─> API: POST /reports
  └─> Response: { reportId, timestamp }
  └─> Report saved
  └─> Supervisor/client notified
  └─> Report appears in history

Step 5: View Report History
  └─> Taps "Report History"
  └─> View all submitted reports
  └─> Filter by:
      • Date Range
      • Type
      • Status
  └─> Can view report details
  └─> Can see supervisor comments
```

---

## 📍 **LOCATION TRACKING FLOWS**

### **Use Case 1: Real-Time Location Tracking** ✅

```
Step 1: Enable Location Tracking
  └─> Guard checks in to shift
  └─> Location tracking automatically enabled
  └─> App requests location permission
  └─> Background location permission granted

Step 2: Continuous Location Updates
  └─> App tracks location every 30 seconds (configurable)
  └─> Location data:
      • Latitude
      • Longitude
      • Accuracy
      • Timestamp
      • Speed (if available)
      • Heading (if available)

Step 3: Send Location Updates
  └─> WebSocket: sendLocationUpdate({
        shiftId: "...",
        location: { lat, lng, accuracy, timestamp }
      })
  └─> Location broadcast to:
      • Supervisor
      • Client
      • Admin dashboard

Step 4: View Location on Map
  └─> Supervisor/client opens dashboard
  └─> Taps on active shift
  └─> View guard location on map
  └─> Real-time marker updates
  └─> Location history trail
  └─> Geofence boundaries (if configured)

Step 5: Geofence Alerts
  └─> If guard leaves geofence area
  └─> WebSocket: sendGeofenceEvent({
        shiftId: "...",
        event: "EXIT",
        location: {...}
      })
  └─> Alert sent to supervisor/client
  └─> Notification appears
```

### **Use Case 2: Check-In Location Verification** ✅

```
Step 1: Check-In Attempt
  └─> Guard taps "Check In"
  └─> App gets current location
  └─> Compares with shift location

Step 2: Location Validation
  └─> If within geofence radius (e.g., 100m):
      ✅ Check-in allowed
  └─> If outside geofence:
      ⚠️ Warning shown
      ⚠️ Guard can still check in (with supervisor approval)
      OR
      ❌ Check-in blocked (if strict mode)

Step 3: Check-In Confirmation
  └─> Location saved with check-in
  └─> API: POST /shifts/{id}/check-in
      Body: { location: {...} }
  └─> Location stored in database
  └─> Map marker updated
```

---

## 🔄 **CROSS-FUNCTIONAL FLOWS**

### **Use Case 1: Multi-User Workflow** ✅

```
Scenario: Complete Shift Lifecycle

Step 1: Client Creates Shift Posting
  └─> Client creates shift posting
  └─> Shift appears in available shifts

Step 2: Guard Applies
  └─> Guard browses available shifts
  └─> Guard applies for shift
  └─> Application notification sent to client

Step 3: Client Approves
  └─> Client reviews application
  └─> Client approves application
  └─> Guard receives approval notification
  └─> Shift appears in guard's upcoming shifts

Step 4: Guard Checks In
  └─> Shift start time arrives
  └─> Guard checks in at location
  └─> Location verified
  └─> Client sees guard is active
  └─> Real-time location tracking begins

Step 5: During Shift
  └─> Guard submits reports
  └─> Client monitors guard location
  └─> Guard and client can chat
  └─> Guard can trigger emergency alerts

Step 6: Guard Checks Out
  └─> Shift end time arrives
  └─> Guard checks out
  └─> Location saved
  └─> Shift marked as completed
  └─> Client receives completion notification

Step 7: Payment Processing
  └─> Payment record created
  └─> Client makes payment
  └─> Payment processed via Stripe
  └─> Guard receives payment notification
```

---

## 📊 **FLOW SUMMARY**

### **Guard Flows** ✅
1. ✅ Registration → OTP → Profile Setup → Dashboard
2. ✅ Browse Shifts → Apply → Get Approved → Check-In → Work → Check-Out
3. ✅ View Shift History → View Reports → Track Payments
4. ✅ Submit Emergency Alert → Get Response
5. ✅ Chat with Supervisor/Client → Real-time Messaging
6. ✅ Submit Reports → Get Feedback

### **Client Flows** ✅
1. ✅ Registration → OTP → Profile Setup → Dashboard
2. ✅ Create Site → Manage Sites → View Site Details
3. ✅ Create Shift Posting → Review Applications → Approve Guards
4. ✅ Monitor Active Shifts → View Guard Location → Track Activity
5. ✅ View Reports → Respond to Reports
6. ✅ Make Payments → Manage Payment Methods
7. ✅ Chat with Guards → Real-time Communication

### **Admin Flows** ✅
1. ✅ Create Shift Assignments → Assign Guards → Monitor Shifts
2. ✅ Manage Guards → View Performance → Generate Reports
3. ✅ Monitor Operations → View Analytics → Respond to Emergencies
4. ✅ Manage Clients → View Client Activity

### **Super Admin Flows** ✅
1. ✅ Manage Security Companies → View Company Details → Manage Subscriptions
2. ✅ View Platform Analytics → Generate Reports → Monitor Growth
3. ✅ Manage Billing → View Revenue → Handle Subscriptions

### **Payment Flows** ✅
1. ✅ Process Shift Payment → Stripe Integration → Payment Confirmation
2. ✅ Add Payment Method → Setup Intent → Save Card
3. ✅ Manage Payment Methods → Set Default → Update/Delete

### **Chat Flows** ✅
1. ✅ Real-time Messaging → Typing Indicators → Read Receipts
2. ✅ Offline Support → Message Queuing → Auto-reconnect
3. ✅ File Sharing → Location Sharing → Media Messages

### **Emergency Flows** ✅
1. ✅ Trigger Emergency → Location Capture → Alert Broadcast → Response Coordination
2. ✅ Submit Incident Report → Attach Evidence → Supervisor Review

### **Location Tracking Flows** ✅
1. ✅ Real-time Tracking → Continuous Updates → Map Visualization
2. ✅ Geofence Monitoring → Exit Alerts → Location Verification

---

## ✅ **STATUS**

**All Major Use Cases**: ✅ **100% IMPLEMENTED**

- ✅ Authentication Flows
- ✅ Guard Use Cases (7 major flows)
- ✅ Client Use Cases (5 major flows)
- ✅ Admin Use Cases (3 major flows)
- ✅ Super Admin Use Cases (2 major flows)
- ✅ Payment Flows (2 major flows)
- ✅ Chat & Messaging Flows (2 major flows)
- ✅ Emergency & Reporting Flows (2 major flows)
- ✅ Location Tracking Flows (2 major flows)
- ✅ Cross-Functional Workflows

**Total Use Cases Documented**: **30+ Major Flows**

---

**🎉 All use cases are fully implemented and production-ready!**

