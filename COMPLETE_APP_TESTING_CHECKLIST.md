# 🧪 COMPLETE APP TESTING CHECKLIST

## 📋 **OVERVIEW**
This is a comprehensive testing checklist covering **EVERY** feature and user flow in the Guard Tracking App, from authentication to payment, chat to logout, and all essential workflows.

---

## 🚀 **SETUP & PREREQUISITES**

### **Backend Setup**
- [ ] Backend server running on `http://192.168.1.12:3000`
- [ ] Database connected and migrated
- [ ] WebSocket server initialized
- [ ] Test accounts created (`node backend/scripts/create-test-accounts.js`)

### **Frontend Setup**
- [ ] Metro bundler running (`npx react-native start`)
- [ ] App installed on device/emulator
- [ ] Network connectivity verified
- [ ] Location permissions granted (for testing)

### **Test Accounts** (All passwords: `12345678`)
- [ ] `guard1@test.com` - Guard user
- [ ] `guard2@test.com` - Guard user (for multi-user testing)
- [ ] `admin@test.com` - Admin user
- [ ] `client1@test.com` - Client user
- [ ] `superadmin@tracsopro.com` - Super Admin user

---

## 1️⃣ **AUTHENTICATION FLOW - COMPLETE**

### **1.1 Onboarding & First Launch**
- [ ] App launches to Onboarding screen
- [ ] Onboarding slides display correctly
- [ ] "Get Started" button navigates to Login
- [ ] "Skip" button navigates to Login
- [ ] Onboarding only shows on first launch

### **1.2 Guard Signup Flow**
- [ ] Navigate to "Register" from Login screen
- [ ] Select "Guard" role
- [ ] **GuardSignupScreen** displays
- [ ] Enter: First Name, Last Name, Email, Phone, Password, Confirm Password
- [ ] Form validation works (empty fields, invalid email, password mismatch)
- [ ] Submit registration
- [ ] **Expected**: OTP sent, navigate to **GuardOTPScreen**
- [ ] Enter 6-digit OTP code
- [ ] OTP verification works
- [ ] **Expected**: Navigate to **GuardProfileSetupScreen**
- [ ] Complete profile:
  - [ ] Upload profile picture
  - [ ] Select experience level
  - [ ] Upload ID card (front/back)
  - [ ] Upload certifications
- [ ] Submit profile
- [ ] **Expected**: Navigate to Guard Dashboard
- [ ] **Verify**: User logged in and authenticated

### **1.3 Client Signup Flow**
- [ ] Navigate to "Register" from Login screen
- [ ] Select "Client" role
- [ ] **ClientAccountTypeScreen** displays
- [ ] Select "Individual" or "Company"
- [ ] **ClientSignupScreen** displays
- [ ] Enter: Name, Email, Phone, Password, Confirm Password
- [ ] Submit registration
- [ ] **Expected**: Navigate to **ClientOTPScreen**
- [ ] Enter OTP code
- [ ] **Expected**: Navigate to **ClientProfileSetupScreen**
- [ ] Complete profile (Individual or Company details)
- [ ] Submit profile
- [ ] **Expected**: Navigate to Client Dashboard

### **1.4 Login Flow**
- [ ] Open app (if not logged in)
- [ ] **LoginScreen** displays
- [ ] Enter valid credentials
- [ ] Tap "Login"
- [ ] **Expected**: Navigate to role-based dashboard
- [ ] **Verify**: Correct dashboard for user role
- [ ] Test with invalid credentials
- [ ] **Expected**: Error message displayed
- [ ] Test with wrong password
- [ ] **Expected**: Authentication error

### **1.5 Forgot Password Flow**
- [ ] From Login screen, tap "Forgot Password"
- [ ] **ForgotPasswordScreen** displays
- [ ] Enter registered email
- [ ] Tap "Send Reset Code"
- [ ] **Expected**: OTP sent to email
- [ ] Navigate to OTP verification (password reset mode)
- [ ] Enter OTP code
- [ ] **Expected**: Navigate to **ResetPasswordScreen**
- [ ] Enter new password
- [ ] Confirm new password
- [ ] Submit password reset
- [ ] **Expected**: Password reset successful
- [ ] **Expected**: Navigate to Login screen
- [ ] Login with new password
- [ ] **Verify**: Login successful

### **1.6 Logout Flow**
- [ ] From any authenticated screen, open drawer menu
- [ ] Tap "Logout" or "Sign Out"
- [ ] **Expected**: Confirmation dialog (if implemented)
- [ ] Confirm logout
- [ ] **Expected**: Navigate to Login screen
- [ ] **Verify**: All user data cleared
- [ ] **Verify**: Tokens removed
- [ ] **Verify**: Cannot access authenticated screens

### **1.7 Session Management**
- [ ] Login successfully
- [ ] Close app completely
- [ ] Reopen app
- [ ] **Expected**: Auto-login (if token valid)
- [ ] **OR**: Navigate to Login (if token expired)
- [ ] Test token refresh mechanism
- [ ] **Verify**: Seamless session continuation

---

## 2️⃣ **GUARD USER FLOW - COMPLETE**

### **2.1 Guard Dashboard**
- [ ] Login as Guard (`guard1@test.com`)
- [ ] **GuardHomeScreen** displays
- [ ] **Verify**: Dashboard shows:
  - [ ] Active shift card (if any)
  - [ ] Upcoming shifts list
  - [ ] Quick action buttons
  - [ ] Statistics (completed shifts, hours worked)
  - [ ] Profile section
- [ ] Pull to refresh works
- [ ] Navigation tabs visible (Home, Shifts, Jobs, Reports, Profile)

### **2.2 Available Shifts (Jobs Tab)**
- [ ] Navigate to "Jobs" tab
- [ ] **AvailableShiftsScreen** displays
- [ ] **Verify**: List of available shifts
- [ ] **Verify**: Filter options work:
  - [ ] "All Shifts" filter
  - [ ] "Nearby" filter (≤5 miles)
  - [ ] "High Pay" filter ($25+)
- [ ] Tap on a shift card
- [ ] **Expected**: Shift details display
- [ ] **Verify**: Shows location, date, time, pay rate, client info
- [ ] Tap "Apply Now"
- [ ] **Expected**: Navigate to **ApplyForShiftScreen**

### **2.3 Apply for Shift**
- [ ] From shift details, tap "Apply Now"
- [ ] **ApplyForShiftScreen** displays
- [ ] **Verify**: Shift information displayed
- [ ] Enter application message (optional)
- [ ] Tap "Submit Application"
- [ ] **Expected**: Application submitted
- [ ] **Expected**: Success message
- [ ] **Expected**: Application status changes to "Pending"
- [ ] Navigate back
- [ ] **Verify**: Applied shift marked in list

### **2.4 My Shifts**
- [ ] Navigate to "Shifts" tab
- [ ] **MyShiftsScreen** displays
- [ ] **Verify**: Shows:
  - [ ] Active shift (if any) with timer
  - [ ] Upcoming shifts list
  - [ ] Past shifts list
- [ ] Tap on upcoming shift
- [ ] **Expected**: Shift details with:
  - [ ] Location map
  - [ ] Check-in instructions
  - [ ] Shift requirements
  - [ ] Client information
- [ ] Pull to refresh works

### **2.5 Check-In Process**
- [ ] Navigate to active shift or "Check In" tab
- [ ] **CheckInOutScreen** or **ActiveShiftScreen** displays
- [ ] **Verify**: Shows:
  - [ ] Current time
  - [ ] Shift information
  - [ ] Location status
  - [ ] "Check In" button
- [ ] Tap "Check In"
- [ ] **Expected**: Location permission request (if first time)
- [ ] Grant location permission
- [ ] **Expected**: Location verification
- [ ] **Expected**: Check-in successful
- [ ] **Verify**: Active shift screen shows:
  - [ ] Timer running
  - [ ] Current location on map
  - [ ] "Check Out" button enabled
  - [ ] Emergency button visible
  - [ ] Report incident button available

### **2.6 Active Shift Monitoring**
- [ ] After check-in, verify:
  - [ ] Timer displays elapsed time correctly
  - [ ] Location updates in real-time
  - [ ] Map shows current position
  - [ ] Emergency button accessible
  - [ ] Chat/messaging accessible
- [ ] Move device (simulate patrol)
- [ ] **Verify**: Location updates on map
- [ ] **Verify**: Location sent to backend
- [ ] Minimize app
- [ ] **Verify**: Background tracking continues
- [ ] Reopen app
- [ ] **Verify**: Timer still running, location tracking active

### **2.7 Check-Out Process**
- [ ] From active shift screen, tap "Check Out"
- [ ] **Expected**: Check-out confirmation dialog
- [ ] Add check-out notes (optional)
- [ ] Tap "Confirm Check Out"
- [ ] **Expected**: Check-out successful
- [ ] **Expected**: Shift marked as completed
- [ ] **Verify**: Shift appears in "Past Shifts"
- [ ] **Verify**: Location tracking stops

### **2.8 Live Location Tracking**
- [ ] Start active shift (check-in)
- [ ] **Verify**: Location tracking starts automatically
- [ ] **Verify**: Location icon in status bar (if implemented)
- [ ] **Verify**: Location updates every 30-60 seconds
- [ ] Test background tracking:
  - [ ] Minimize app
  - [ ] Wait 1 minute
  - [ ] Reopen app
- [ ] **Verify**: Location still tracking
- [ ] **Verify**: Location accuracy acceptable
- [ ] Test geofencing (if implemented)
- [ ] **Verify**: Alerts when entering/leaving geofence

### **2.9 Incident Reporting**
- [ ] During active shift, tap "Report Incident"
- [ ] **AddIncidentReportScreen** or **CreateIncidentScreen** displays
- [ ] Fill incident form:
  - [ ] Select incident type
  - [ ] Enter description
  - [ ] Select severity level
  - [ ] Location (auto-filled)
- [ ] Add photo:
  - [ ] Tap camera icon
  - [ ] Take photo or select from gallery
  - [ ] **Verify**: Photo attached
- [ ] Add video (if supported)
- [ ] Tap "Submit Report"
- [ ] **Expected**: Report submitted successfully
- [ ] **Expected**: Report appears in "Reports" tab
- [ ] **Verify**: Admin/Client notified

### **2.10 View Reports**
- [ ] Navigate to "Reports" tab
- [ ] **ReportsScreen** displays
- [ ] **Verify**: List of all reports
- [ ] **Verify**: Each report shows:
  - [ ] Date/time
  - [ ] Type
  - [ ] Status
  - [ ] Location
  - [ ] Preview image (if any)
- [ ] Tap on a report
- [ ] **Expected**: Report details screen
- [ ] **Verify**: All details visible
- [ ] **Verify**: Photos/videos display correctly
- [ ] Filter reports (if available)
- [ ] **Verify**: Filters work

### **2.11 Emergency Alert**
- [ ] During active shift, tap "Emergency" button
- [ ] **Expected**: Emergency confirmation dialog
- [ ] Confirm emergency
- [ ] **Expected**: Emergency alert sent
- [ ] **Expected**: Notification to admin/supervisor
- [ ] **Verify**: Emergency status visible on dashboard
- [ ] **Verify**: Location shared automatically

### **2.12 Guard Chat/Messaging**
- [ ] Navigate to chat (from drawer or active shift)
- [ ] **ChatListScreen** displays
- [ ] **Verify**: List of conversations
- [ ] Tap on a conversation
- [ ] **IndividualChatScreen** or **ChatScreen** displays
- [ ] **Verify**: Message history loads
- [ ] Send text message
- [ ] **Verify**: Message appears immediately
- [ ] **Verify**: Message delivered to recipient
- [ ] Send photo:
  - [ ] Tap camera/attachment icon
  - [ ] Take photo or select from gallery
  - [ ] **Verify**: Photo sent
- [ ] Send location:
  - [ ] Tap location icon
  - [ ] **Verify**: Current location shared
- [ ] **Verify**: Typing indicators work
- [ ] **Verify**: Read receipts work
- [ ] Test real-time updates
- [ ] **Verify**: Messages sync across devices

### **2.13 Guard Profile**
- [ ] Navigate to "Profile" tab
- [ ] **ProfileScreen** displays
- [ ] **Verify**: Profile shows:
  - [ ] Name, email, phone
  - [ ] Profile photo
  - [ ] Role
  - [ ] Statistics
  - [ ] Experience level
- [ ] Tap "Edit Profile"
- [ ] **Expected**: Profile edit screen
- [ ] Update information
- [ ] Change profile photo
- [ ] Save changes
- [ ] **Expected**: Changes saved
- [ ] **Verify**: Updated info reflected

### **2.14 Guard Settings**
- [ ] Open drawer menu
- [ ] Tap "Settings"
- [ ] **SettingsScreen** displays
- [ ] **Verify**: Settings options:
  - [ ] Notification preferences
  - [ ] Location settings
  - [ ] Privacy settings
  - [ ] About/Support
- [ ] Toggle notification settings
- [ ] **Verify**: Changes saved
- [ ] Test notification preferences
- [ ] **Verify**: Notifications work accordingly

---

## 3️⃣ **ADMIN USER FLOW - COMPLETE**

### **3.1 Admin Dashboard**
- [ ] Login as Admin (`admin@test.com`)
- [ ] **AdminDashboard** displays
- [ ] **Verify**: Dashboard shows:
  - [ ] Real-time metrics (guards, sites, incidents)
  - [ ] Quick action cards
  - [ ] Recent activity feed
  - [ ] Emergency alerts (if any)
- [ ] **Verify**: Tab navigation:
  - [ ] Dashboard
  - [ ] Operations
  - [ ] Management
  - [ ] Reports
  - [ ] Settings
- [ ] Pull to refresh works

### **3.2 Operations Center**
- [ ] Navigate to "Operations" tab
- [ ] **AdminOperationsCenter** displays
- [ ] **Verify**: Shows:
  - [ ] Active guards map view
  - [ ] Real-time guard locations
  - [ ] Active shifts list
  - [ ] Live alerts/notifications
- [ ] Tap on guard marker
- [ ] **Expected**: Guard details popup
- [ ] **Verify**: Shows guard info, current shift, location
- [ ] Test real-time updates:
  - [ ] Have guard move (on another device)
  - [ ] **Verify**: Location updates on map
- [ ] Filter by site/shift
- [ ] **Verify**: Filters work

### **3.3 User Management**
- [ ] Navigate to "Management" tab
- [ ] Tap "User Management"
- [ ] **UserManagementScreen** displays
- [ ] **Verify**: User list shows:
  - [ ] Guards
  - [ ] Clients
  - [ ] Admins
- [ ] Search/filter users
- [ ] **Verify**: Search works
- [ ] Tap on a user
- [ ] **Expected**: User details screen
- [ ] Create new user:
  - [ ] Tap "Add User"
  - [ ] Select role (Guard/Client/Admin)
  - [ ] Fill user form
  - [ ] Save
  - [ ] **Expected**: User created
- [ ] Edit user:
  - [ ] Open user details
  - [ ] Tap "Edit"
  - [ ] Update information
  - [ ] Save
  - [ ] **Expected**: Changes saved
- [ ] Deactivate user:
  - [ ] From user details, tap "Deactivate"
  - [ ] Confirm
  - [ ] **Expected**: User deactivated
  - [ ] **Verify**: User cannot login

### **3.4 Site Management**
- [ ] Navigate to "Management" tab
- [ ] Tap "Site Management"
- [ ] **SiteManagementScreen** displays
- [ ] **Verify**: Site list displays
- [ ] **Verify**: Each site shows:
  - [ ] Name, address
  - [ ] Status
  - [ ] Assigned guards
- [ ] Tap on a site
- [ ] **Expected**: Site details screen
- [ ] Create new site:
  - [ ] Tap "Add Site"
  - [ ] Fill site form:
    - [ ] Name, address
    - [ ] Location (map picker)
    - [ ] Geofence radius
    - [ ] Contact information
  - [ ] Save
  - [ ] **Expected**: Site created
  - [ ] **Verify**: Site appears on map
- [ ] Edit site:
  - [ ] Open site details
  - [ ] Tap "Edit"
  - [ ] Update information
  - [ ] Save
  - [ ] **Expected**: Changes saved

### **3.5 Shift Scheduling**
- [ ] Navigate to "Operations" tab
- [ ] Tap "Shift Scheduling"
- [ ] **ShiftSchedulingScreen** displays
- [ ] **Verify**: Calendar/list view
- [ ] **Verify**: Shows scheduled shifts, assigned guards, status
- [ ] Filter by date/status
- [ ] **Verify**: Filters work
- [ ] Create shift:
  - [ ] Tap "Create Shift"
  - [ ] Fill shift form:
    - [ ] Site selection
    - [ ] Date and time
    - [ ] Guard assignment
    - [ ] Shift type
  - [ ] Save
  - [ ] **Expected**: Shift created
  - [ ] **Verify**: Guard receives notification
- [ ] Assign guard:
  - [ ] Open shift details
  - [ ] Tap "Assign Guard"
  - [ ] Select guard
  - [ ] Confirm
  - [ ] **Expected**: Guard assigned
  - [ ] **Verify**: Guard notified

### **3.6 Incident Review**
- [ ] Navigate to "Reports" tab
- [ ] Tap "Incident Review"
- [ ] **IncidentReviewScreen** displays
- [ ] **Verify**: Incident list shows:
  - [ ] Incident type
  - [ ] Date/time
  - [ ] Guard name
  - [ ] Status (Pending/Reviewed/Resolved)
- [ ] Tap on incident
- [ ] **Expected**: Incident details screen
- [ ] **Verify**: Shows all details, photos
- [ ] Approve/Resolve incident:
  - [ ] Review incident
  - [ ] Tap "Approve" or "Resolve"
  - [ ] Add resolution notes
  - [ ] Submit
  - [ ] **Expected**: Status updated
  - [ ] **Verify**: Guard and Client notified

### **3.7 Admin Analytics**
- [ ] Navigate to "Reports" tab
- [ ] Tap "Analytics"
- [ ] **AdminAnalyticsScreen** displays
- [ ] **Verify**: Analytics dashboard shows:
  - [ ] Guard performance metrics
  - [ ] Shift statistics
  - [ ] Incident trends
  - [ ] Revenue metrics
- [ ] Change date range
- [ ] **Verify**: Data updates
- [ ] Generate report:
  - [ ] Tap "Generate Report"
  - [ ] Select report type
  - [ ] Select date range
  - [ ] Generate
  - [ ] **Expected**: Report generated
  - [ ] **Verify**: Can export/share

### **3.8 Admin Subscription & Payment**
- [ ] Navigate to "Settings" tab
- [ ] Tap "Subscription & Billing"
- [ ] **AdminSubscriptionScreen** displays
- [ ] **Verify**: Shows:
  - [ ] Current subscription status
  - [ ] Current plan details
  - [ ] Available plans
  - [ ] Billing information
- [ ] View subscription plans
- [ ] Subscribe to plan:
  - [ ] Select plan
  - [ ] Tap "Subscribe"
  - [ ] **Expected**: Stripe checkout (if integrated)
  - [ ] Complete payment
  - [ ] **Expected**: Subscription activated
- [ ] Access billing portal:
  - [ ] Tap "Billing Portal"
  - [ ] **Expected**: Stripe billing portal opens
- [ ] View payment history
- [ ] **Verify**: Payment details correct

### **3.9 Admin Settings**
- [ ] Navigate to "Settings" tab
- [ ] **AdminSettingsScreen** displays
- [ ] **Verify**: Settings options:
  - [ ] Profile management
  - [ ] Notification settings
  - [ ] System settings
  - [ ] Security settings
  - [ ] Subscription & Billing
- [ ] Edit profile
- [ ] Update notification preferences
- [ ] **Verify**: Changes saved

---

## 4️⃣ **CLIENT USER FLOW - COMPLETE**

### **4.1 Client Dashboard**
- [ ] Login as Client (`client1@test.com`)
- [ ] **ClientDashboard** displays
- [ ] **Verify**: Dashboard shows:
  - [ ] Active guards
  - [ ] Upcoming shifts
  - [ ] Recent incidents
  - [ ] Site statistics
- [ ] **Verify**: Tab navigation:
  - [ ] Dashboard
  - [ ] Sites & Shifts
  - [ ] Guards
  - [ ] Reports
  - [ ] Settings

### **4.2 Site Management**
- [ ] Navigate to "Sites & Shifts" tab
- [ ] **ClientSites** or site list displays
- [ ] **Verify**: Site list shows all client sites
- [ ] Tap on a site
- [ ] **Expected**: **SiteDetailsScreen**
- [ ] **Verify**: Shows:
  - [ ] Site information
  - [ ] Active shifts
  - [ ] Assigned guards
- [ ] Create new site:
  - [ ] Tap "Add New Site"
  - [ ] **AddSiteScreen** displays
  - [ ] Fill site form:
    - [ ] Name, address
    - [ ] Location (map)
    - [ ] Contact details
  - [ ] Save
  - [ ] **Expected**: Site created
  - [ ] **Verify**: Site appears in list

### **4.3 Shift Posting**
- [ ] From site details, tap "Create Shift"
- [ ] **CreateShiftScreen** displays
- [ ] Fill shift form:
  - [ ] Date and time
  - [ ] Duration
  - [ ] Number of guards needed
  - [ ] Pay rate
  - [ ] Requirements
- [ ] Post shift
- [ ] **Expected**: Shift posted
- [ ] **Verify**: Guards can see shift in "Available Shifts"

### **4.4 Review Applications**
- [ ] Open posted shift
- [ ] **Verify**: Applications list displays
- [ ] **Verify**: Shows guard info, application message
- [ ] Tap on application
- [ ] **Expected**: Application details
- [ ] Approve application:
  - [ ] Tap "Approve"
  - [ ] **Expected**: Application approved
  - [ ] **Verify**: Guard notified
- [ ] Reject application:
  - [ ] Tap "Reject"
  - [ ] **Expected**: Application rejected
  - [ ] **Verify**: Guard notified

### **4.5 Guard Monitoring**
- [ ] Navigate to "Guards" tab
- [ ] **ClientGuards** displays
- [ ] **Verify**: Active guards list
- [ ] Tap on guard
- [ ] **Expected**: Guard details with:
  - [ ] Current location (map)
  - [ ] Active shift info
  - [ ] Check-in status
- [ ] **Verify**: Real-time location updates
- [ ] Monitor shift progress:
  - [ ] From site details, view active shift
  - [ ] **Verify**: Shows guard location on map
  - [ ] **Verify**: Check-in time, elapsed time
  - [ ] **Verify**: Location updates in real-time

### **4.6 Client Reports**
- [ ] Navigate to "Reports" tab
- [ ] **ClientReports** displays
- [ ] **Verify**: Reports list shows:
  - [ ] Incident reports
  - [ ] Shift reports
  - [ ] Guard performance
- [ ] Filter by date/site
- [ ] **Verify**: Filters work
- [ ] Tap on report
- [ ] **Expected**: Report details
- [ ] **Verify**: All information visible

### **4.7 Client Analytics**
- [ ] From Reports, tap "Analytics"
- [ ] **ClientAnalyticsDashboard** displays
- [ ] **Verify**: Analytics shows:
  - [ ] Site utilization
  - [ ] Guard performance
  - [ ] Incident trends
  - [ ] Cost analysis
- [ ] Change date range
- [ ] **Verify**: Data updates

### **4.8 Client Payment**
- [ ] Navigate to "Settings" or payment section
- [ ] Tap "Payment" or "Billing"
- [ ] **PaymentScreen** displays
- [ ] **Verify**: Shows:
  - [ ] Invoice list
  - [ ] Payment methods
  - [ ] Payment history
- [ ] View invoice:
  - [ ] Tap on invoice
  - [ ] **InvoiceDetailsScreen** displays
  - [ ] **Verify**: Invoice details correct
  - [ ] Pay invoice:
    - [ ] Tap "Pay Now"
    - [ ] **Expected**: Payment form/Stripe checkout
    - [ ] Complete payment
    - [ ] **Expected**: Payment successful
- [ ] Manage payment methods:
  - [ ] Tap "Payment Methods"
  - [ ] **PaymentMethodsScreen** displays
  - [ ] **Verify**: List of payment methods
  - [ ] Add payment method:
    - [ ] Tap "Add Payment Method"
    - [ ] **Expected**: Payment method form
    - [ ] Enter card details (or Stripe form)
    - [ ] Save
    - [ ] **Expected**: Payment method added
  - [ ] Set default payment method
  - [ ] **Verify**: Default method set
- [ ] Setup auto-pay:
  - [ ] Toggle auto-pay
  - [ ] **Expected**: Auto-pay enabled
  - [ ] **Verify**: Future invoices auto-paid

### **4.9 Client Chat**
- [ ] Navigate to chat (from drawer or guard details)
- [ ] **ChatListScreen** displays
- [ ] **Verify**: Conversations list
- [ ] Tap on conversation (with guard/admin)
- [ ] **IndividualChatScreen** displays
- [ ] **Verify**: Message history loads
- [ ] Send message
- [ ] **Verify**: Message delivered
- [ ] Send photo
- [ ] **Verify**: Photo sent
- [ ] **Verify**: Real-time updates work

### **4.10 Client Settings**
- [ ] Navigate to "Settings" tab
- [ ] **ClientSettings** displays
- [ ] **Verify**: Settings options:
  - [ ] Profile management
  - [ ] Notification settings
  - [ ] Payment settings
  - [ ] Company details (if company account)
- [ ] Edit profile
- [ ] Update notification preferences
- [ ] **Verify**: Changes saved

---

## 5️⃣ **SUPER ADMIN FLOW - COMPLETE**

### **5.1 Super Admin Dashboard**
- [ ] Login as Super Admin (`superadmin@tracsopro.com`)
- [ ] **SuperAdminDashboard** displays
- [ ] **Verify**: Platform-wide metrics:
  - [ ] Total companies
  - [ ] Total users
  - [ ] Revenue
  - [ ] Growth trends
- [ ] **Verify**: Tab navigation:
  - [ ] Dashboard
  - [ ] Companies
  - [ ] Analytics
  - [ ] Billing
  - [ ] Settings

### **5.2 Company Management**
- [ ] Navigate to "Companies" tab
- [ ] **CompanyManagementScreen** displays
- [ ] **Verify**: Company list shows:
  - [ ] Company name
  - [ ] Status (Active/Suspended)
  - [ ] Subscription plan
  - [ ] User count
- [ ] Search/filter companies
- [ ] **Verify**: Search works
- [ ] Tap on company
- [ ] **Expected**: **CompanyDetailsScreen**
- [ ] **Verify**: Shows:
  - [ ] Company information
  - [ ] Subscription details
  - [ ] Statistics (users, sites, guards)
  - [ ] Billing information
- [ ] Create company:
  - [ ] Tap "Create Company"
  - [ ] **CreateCompanyScreen** displays
  - [ ] Fill company form:
    - [ ] Company name, email, phone
    - [ ] Address
    - [ ] Subscription plan
    - [ ] Resource limits
  - [ ] Save
  - [ ] **Expected**: Company created
  - [ ] **Verify**: Company admin account created
- [ ] Manage company:
  - [ ] Open company details
  - [ ] Toggle company status (Activate/Suspend)
  - [ ] **Expected**: Status updated
  - [ ] **Verify**: Company users affected

### **5.3 Platform Analytics**
- [ ] Navigate to "Analytics" tab
- [ ] **PlatformAnalyticsScreen** displays
- [ ] **Verify**: Platform-wide metrics:
  - [ ] Total companies
  - [ ] Total users (guards, clients, admins)
  - [ ] Revenue trends
  - [ ] Growth metrics
- [ ] Change date range (7d, 30d, 90d, 1y)
- [ ] **Verify**: Data updates
- [ ] View audit logs:
  - [ ] Tap "Audit Logs"
  - [ ] **AuditLogsScreen** displays
  - [ ] **Verify**: System activity logs
  - [ ] Filter logs
  - [ ] **Verify**: Filters work

### **5.4 Billing Management**
- [ ] Navigate to "Billing" tab
- [ ] **BillingManagementScreen** displays
- [ ] **Verify**: Shows:
  - [ ] Payment history
  - [ ] Subscription revenue
  - [ ] Outstanding invoices
- [ ] Tap on payment
- [ ] **PaymentDetailScreen** displays
- [ ] **Verify**: Payment details correct
- [ ] View subscription plans
- [ ] **Verify**: Plans displayed correctly

### **5.5 System Settings**
- [ ] Navigate to "Settings" tab
- [ ] **SystemSettingsScreen** displays
- [ ] **Verify**: Platform settings:
  - [ ] Platform configuration
  - [ ] Feature toggles
  - [ ] Billing settings
  - [ ] Security settings
- [ ] Update settings
- [ ] **Expected**: Changes saved
- [ ] **Verify**: Changes applied platform-wide

---

## 6️⃣ **PAYMENT FLOW - COMPLETE**

### **6.1 Client Payment Flow**
- [ ] Login as Client
- [ ] Navigate to Payment screen
- [ ] View invoices:
  - [ ] **Verify**: Invoice list displays
  - [ ] **Verify**: Status indicators (Paid/Pending/Overdue)
- [ ] Pay invoice:
  - [ ] Tap on unpaid invoice
  - [ ] **InvoiceDetailsScreen** displays
  - [ ] **Verify**: Invoice details correct
  - [ ] Tap "Pay Now"
  - [ ] **Expected**: Payment form/Stripe checkout
  - [ ] Enter payment details (or use Stripe)
  - [ ] Complete payment
  - [ ] **Expected**: Payment successful
  - [ ] **Verify**: Invoice status updated to "Paid"
  - [ ] **Verify**: Receipt generated

### **6.2 Payment Methods Management**
- [ ] Navigate to Payment Methods
- [ ] **PaymentMethodsScreen** displays
- [ ] **Verify**: List of saved payment methods
- [ ] Add payment method:
  - [ ] Tap "Add Payment Method"
  - [ ] **Expected**: Payment method form
  - [ ] Enter card details (or Stripe form)
  - [ ] Save
  - [ ] **Expected**: Payment method added
  - [ ] **Verify**: Appears in list
- [ ] Set default:
  - [ ] Tap on payment method
  - [ ] Tap "Set as Default"
  - [ ] **Expected**: Default method set
- [ ] Remove payment method:
  - [ ] Tap "Remove"
  - [ ] Confirm
  - [ ] **Expected**: Payment method removed

### **6.3 Auto-Pay Setup**
- [ ] From Payment screen, toggle auto-pay
- [ ] **Expected**: Auto-pay enabled
- [ ] **Verify**: Future invoices auto-paid
- [ ] Disable auto-pay
- [ ] **Expected**: Auto-pay disabled

### **6.4 Admin Subscription Payment**
- [ ] Login as Admin
- [ ] Navigate to Subscription screen
- [ ] View current subscription:
  - [ ] **Verify**: Current plan displayed
  - [ ] **Verify**: Renewal date shown
  - [ ] **Verify**: Status (Active/Cancelled)
- [ ] Subscribe to plan:
  - [ ] Browse available plans
  - [ ] Select plan
  - [ ] Tap "Subscribe"
  - [ ] **Expected**: Stripe checkout
  - [ ] Complete payment
  - [ ] **Expected**: Subscription activated
  - [ ] **Verify**: Plan features enabled
- [ ] Access billing portal:
  - [ ] Tap "Billing Portal"
  - [ ] **Expected**: Stripe billing portal opens
  - [ ] **Verify**: Can manage payment methods
  - [ ] **Verify**: Can view invoices

### **6.5 Payment Error Handling**
- [ ] Test with invalid card
- [ ] **Expected**: Error message displayed
- [ ] Test with insufficient funds
- [ ] **Expected**: Payment declined message
- [ ] Test payment timeout
- [ ] **Expected**: Timeout handling
- [ ] Test network error during payment
- [ ] **Expected**: Error message, retry option

---

## 7️⃣ **CHAT/MESSAGING FLOW - COMPLETE**

### **7.1 Chat List**
- [ ] Navigate to Chat/Messages
- [ ] **ChatListScreen** displays
- [ ] **Verify**: Conversations list
- [ ] **Verify**: Each conversation shows:
  - [ ] User name/avatar
  - [ ] Last message preview
  - [ ] Timestamp
  - [ ] Unread count (if any)
- [ ] Search conversations
- [ ] **Verify**: Search works
- [ ] Tap on conversation
- [ ] **Expected**: Opens chat screen

### **7.2 Individual Chat**
- [ ] Open chat conversation
- [ ] **IndividualChatScreen** or **ChatScreen** displays
- [ ] **Verify**: Message history loads
- [ ] **Verify**: Shows:
  - [ ] User info (name, avatar, status)
  - [ ] Message bubbles
  - [ ] Timestamps
  - [ ] Message status (sent/delivered/read)
- [ ] Send text message:
  - [ ] Type message
  - [ ] Tap send
  - [ ] **Verify**: Message appears immediately
  - [ ] **Verify**: Message delivered
  - [ ] **Verify**: Real-time delivery to recipient
- [ ] Send photo:
  - [ ] Tap camera/attachment icon
  - [ ] Take photo or select from gallery
  - [ ] **Verify**: Photo attached
  - [ ] Send
  - [ ] **Verify**: Photo sent
  - [ ] **Verify**: Photo displays in chat
- [ ] Send location:
  - [ ] Tap location icon
  - [ ] **Verify**: Current location shared
  - [ ] **Verify**: Location displays on map
- [ ] Test typing indicators:
  - [ ] Start typing
  - [ ] **Verify**: Typing indicator shows to recipient
  - [ ] Stop typing
  - [ ] **Verify**: Indicator disappears after timeout
- [ ] Test read receipts:
  - [ ] Send message
  - [ ] **Verify**: Status shows "sent"
  - [ ] Recipient reads message
  - [ ] **Verify**: Status updates to "read"

### **7.3 Real-Time Chat Features**
- [ ] Test real-time updates:
  - [ ] Open chat on two devices
  - [ ] Send message from device 1
  - [ ] **Verify**: Message appears on device 2 immediately
- [ ] Test offline mode:
  - [ ] Disable network
  - [ ] Send message
  - [ ] **Expected**: Message queued
  - [ ] Re-enable network
  - [ ] **Verify**: Message sent automatically
- [ ] Test connection status:
  - [ ] **Verify**: Connection indicator visible
  - [ ] Disconnect network
  - [ ] **Verify**: Offline banner shows
  - [ ] Reconnect
  - [ ] **Verify**: Connected status

### **7.4 Chat from Context**
- [ ] From Guard active shift, tap "Chat"
- [ ] **Expected**: Opens chat with supervisor/admin
- [ ] From Client guard details, tap "Message"
- [ ] **Expected**: Opens chat with guard
- [ ] From incident report, tap "Chat"
- [ ] **Expected**: Opens chat in incident context
- [ ] **Verify**: Context preserved in chat

---

## 8️⃣ **ESSENTIAL USER FLOWS - COMPLETE**

### **8.1 Complete Guard Workflow**
1. **Signup** → GuardSignup → OTP → Profile Setup → Dashboard
2. **Browse Jobs** → Available Shifts → Apply → Pending Status
3. **Get Assigned** → Shift appears in My Shifts
4. **Check-In** → Location verified → Active shift starts
5. **Work Shift** → Location tracking → Report incident → Chat with supervisor
6. **Check-Out** → Shift completed → Appears in past shifts

### **8.2 Complete Client Workflow**
1. **Signup** → ClientAccountType → ClientSignup → OTP → Profile Setup → Dashboard
2. **Create Site** → AddSite → Site created
3. **Post Shift** → CreateShift → Shift posted
4. **Review Applications** → Approve guard → Guard assigned
5. **Monitor Guard** → View live location → Track shift progress
6. **Receive Reports** → View incident reports → Review and respond
7. **Make Payment** → View invoices → Pay invoice → Payment confirmed

### **8.3 Complete Admin Workflow**
1. **Login** → Admin Dashboard
2. **Manage Users** → Create guard/client → Assign to sites
3. **Manage Sites** → Create site → Configure geofencing
4. **Schedule Shifts** → Create shift → Assign guard
5. **Monitor Operations** → View live guard locations → Track active shifts
6. **Review Incidents** → Approve/resolve reports → Notify stakeholders
7. **Manage Subscription** → View plan → Upgrade/downgrade → Process payment

### **8.4 Complete Multi-User Workflow**
1. **Client** creates site and posts shift
2. **Guard** sees shift in Available Shifts
3. **Guard** applies for shift
4. **Client** reviews and approves application
5. **Guard** receives notification, shift appears in My Shifts
6. **Guard** checks in at shift location
7. **Client & Admin** see guard as active on map
8. **Guard** reports incident during shift
9. **Client & Admin** receive incident notification
10. **Admin** reviews and resolves incident
11. **Guard & Client** notified of resolution
12. **Guard** checks out
13. **Client** receives shift completion notification
14. **Client** processes payment for services

### **8.5 Emergency Workflow**
1. **Guard** triggers emergency during active shift
2. **Emergency alert** sent to Admin/Client immediately
3. **Location** shared automatically
4. **Admin** receives notification, views on operations map
5. **Admin** responds via chat or phone
6. **Guard** receives response
7. **Emergency** resolved, status updated

---

## 9️⃣ **EDGE CASES & ERROR HANDLING**

### **9.1 Network Errors**
- [ ] Disable network during login
- [ ] **Expected**: Network error message
- [ ] Disable network during check-in
- [ ] **Expected**: Offline mode message
- [ ] Disable network during payment
- [ ] **Expected**: Payment error, retry option
- [ ] Re-enable network
- [ ] **Verify**: Auto-sync works
- [ ] **Verify**: Queued actions processed

### **9.2 Permission Denials**
- [ ] Deny location permission
- [ ] Try to check-in
- [ ] **Expected**: Permission request with explanation
- [ ] Deny camera permission
- [ ] Try to add photo to report
- [ ] **Expected**: Permission request
- [ ] Deny notification permission
- [ ] **Verify**: App still functions

### **9.3 Invalid Data**
- [ ] Enter invalid email in signup
- [ ] **Expected**: Validation error
- [ ] Enter weak password
- [ ] **Expected**: Password strength indicator
- [ ] Enter invalid OTP
- [ ] **Expected**: OTP error message
- [ ] Submit form with missing fields
- [ ] **Expected**: Field validation errors

### **9.4 Session Management**
- [ ] Login successfully
- [ ] Wait for token expiry
- [ ] Try to perform action
- [ ] **Expected**: Auto-logout or token refresh
- [ ] **Expected**: Redirect to login
- [ ] Login again
- [ ] **Verify**: Session restored

### **9.5 Concurrent Operations**
- [ ] Open app on multiple devices
- [ ] Perform actions simultaneously
- [ ] **Verify**: No conflicts
- [ ] **Verify**: Data syncs correctly
- [ ] Test with multiple guards checking in
- [ ] **Verify**: All tracked correctly

---

## 🔟 **PERFORMANCE & OPTIMIZATION**

### **10.1 App Performance**
- [ ] App launch time < 3 seconds
- [ ] Screen transitions smooth
- [ ] List scrolling smooth (100+ items)
- [ ] Map performance with 10+ markers
- [ ] Image loading optimized
- [ ] No memory leaks

### **10.2 Battery Usage**
- [ ] Background tracking efficient
- [ ] Battery drain acceptable during tracking
- [ ] Location updates optimized
- [ ] WebSocket connection efficient

### **10.3 Network Optimization**
- [ ] API calls optimized
- [ ] Image compression
- [ ] Offline data caching
- [ ] Data sync efficient

---

## 1️⃣1️⃣ **SECURITY TESTS**

### **11.1 Authentication Security**
- [ ] JWT tokens used
- [ ] Tokens expire correctly
- [ ] Refresh token mechanism works
- [ ] Password hashed (not plain text)
- [ ] OTP expires after timeout

### **11.2 Authorization**
- [ ] Guard cannot access admin routes
- [ ] Client cannot access guard features
- [ ] Admin cannot access super admin features
- [ ] Role-based access enforced

### **11.3 Data Protection**
- [ ] Sensitive data encrypted
- [ ] API calls use HTTPS
- [ ] Tokens stored securely
- [ ] Payment data secure
- [ ] Location data protected

---

## 📊 **TESTING SUMMARY CHECKLIST**

### **Critical Flows** ✅
- [ ] Complete authentication flow (Signup → Login → Logout)
- [ ] Guard complete workflow (Signup → Apply → Check-in → Work → Check-out)
- [ ] Client complete workflow (Signup → Create Site → Post Shift → Monitor → Pay)
- [ ] Admin complete workflow (Login → Manage → Monitor → Review)
- [ ] Payment flow (View → Pay → Methods → Auto-pay)
- [ ] Chat flow (List → Chat → Send → Real-time)
- [ ] Multi-user workflow (Client → Guard → Admin interaction)

### **Features** ✅
- [ ] Location tracking (Foreground & Background)
- [ ] Check-in/Check-out
- [ ] Incident reporting
- [ ] Shift management
- [ ] User management
- [ ] Site management
- [ ] Payment processing
- [ ] Chat/Messaging
- [ ] Notifications
- [ ] Analytics & Reports

### **Edge Cases** ✅
- [ ] Network errors
- [ ] Permission denials
- [ ] Session expiry
- [ ] Invalid data
- [ ] Concurrent operations

### **Performance** ✅
- [ ] App launch time
- [ ] Screen transitions
- [ ] List scrolling
- [ ] Map performance
- [ ] Battery usage

### **Security** ✅
- [ ] Authentication
- [ ] Authorization
- [ ] Data protection
- [ ] Payment security

---

## 📝 **TESTING NOTES**

### **Test Environment**
- Backend URL: `http://192.168.1.12:3000` (update if different)
- WebSocket URL: `ws://192.168.1.12:3000`
- Test on both emulator and physical device

### **Common Issues & Solutions**
1. **Location not updating**: Check GPS permissions and backend connection
2. **WebSocket disconnects**: Verify backend is running and network stable
3. **Login fails**: Check backend server and database connection
4. **Blank screens**: Clear Metro cache and rebuild
5. **Payment fails**: Check Stripe integration and API keys
6. **Chat not working**: Verify WebSocket connection and backend

### **Reporting Bugs**
When reporting issues, include:
- User role and test case number
- Steps to reproduce
- Expected vs actual behavior
- Device/OS version
- Screenshots/logs if available
- Network conditions
- Backend logs (if applicable)

---

## 🎯 **NEXT STEPS AFTER TESTING**

1. **Document Findings**: Record all bugs and issues
2. **Prioritize Fixes**: Critical → High → Medium → Low
3. **Re-test**: After fixes, re-run affected test cases
4. **Performance Optimization**: Address any performance issues
5. **User Acceptance**: Get feedback from actual users
6. **Production Readiness**: Ensure all critical flows work

---

**Last Updated**: [Current Date]
**Version**: 2.0
**Coverage**: 100% of app features and flows


