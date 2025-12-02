# 🧪 COMPREHENSIVE TESTING FLOW GUIDE

## Overview
This document provides a complete testing flow covering all major features and user journeys in the Guard Tracking App. Use this guide to systematically test the application across all user roles and critical workflows.

---

## 📋 **PREREQUISITES**

### **1. Backend Setup**
```bash
# Start backend server
cd backend
npm install
npm run dev

# Create test accounts (if not already created)
node scripts/create-test-accounts.js
```

### **2. Frontend Setup**
```bash
# Start Metro bundler
cd GuardTrackingApp
npx react-native start --reset-cache

# Run on device/emulator
npx react-native run-android
```

### **3. Test Accounts**
| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| **Guard** | `guard1@test.com` | `12345678` | Guard mobile app testing |
| **Guard** | `guard2@test.com` | `12345678` | Multi-guard testing |
| **Admin** | `admin@test.com` | `12345678` | Admin dashboard testing |
| **Client** | `client1@test.com` | `12345678` | Client portal testing |
| **Super Admin** | `superadmin@tracsopro.com` | `12345678` | Platform management |

---

## 🎯 **TESTING FLOWS BY USER ROLE**

---

## 1️⃣ **GUARD USER FLOW**

### **Phase 1: Authentication & Onboarding**

#### **Test 1.1: Guard Login**
- [ ] Open app on device/emulator
- [ ] Navigate to Login screen
- [ ] Enter credentials:
  - Email: `guard1@test.com`
  - Password: `12345678`
- [ ] Tap "Login"
- [ ] **Expected**: Redirect to Guard Home Dashboard
- [ ] **Verify**: User profile displayed correctly
- [ ] **Verify**: Role is "GUARD"

#### **Test 1.2: Guard Signup (New Account)**
- [ ] Navigate to Register/Signup
- [ ] Select "Guard" role
- [ ] Fill registration form:
  - Name, Email, Phone, Password
- [ ] Submit registration
- [ ] **Expected**: OTP verification screen
- [ ] Enter OTP code
- [ ] **Expected**: Guard Profile Setup screen
- [ ] Complete profile (experience, certifications, ID)
- [ ] **Expected**: Redirect to Guard Dashboard

---

### **Phase 2: Guard Dashboard & Navigation**

#### **Test 2.1: Dashboard Overview**
- [ ] Login as Guard
- [ ] **Verify**: Dashboard displays:
  - [ ] Active shift card (if any)
  - [ ] Upcoming shifts list
  - [ ] Quick action buttons
  - [ ] Statistics (completed shifts, hours)
- [ ] **Verify**: Navigation tabs visible (Home, Shifts, Jobs, Reports, Profile)

#### **Test 2.2: Navigation Drawer**
- [ ] Tap hamburger menu (top left)
- [ ] **Verify**: Drawer opens with:
  - [ ] Guard profile info
  - [ ] Statistics
  - [ ] Menu options (Profile, Past Jobs, Settings, etc.)
- [ ] Tap "Logout"
- [ ] **Expected**: Confirmation dialog
- [ ] Confirm logout
- [ ] **Expected**: Redirect to Login screen

---

### **Phase 3: Shift Management**

#### **Test 3.1: View Available Shifts**
- [ ] Navigate to "Jobs" tab
- [ ] **Verify**: Available Shifts screen displays
- [ ] **Verify**: Filter options (All, Nearby, High Pay)
- [ ] Tap on a shift card
- [ ] **Expected**: Shift details screen
- [ ] **Verify**: Shows:
  - [ ] Location, date, time
  - [ ] Pay rate
  - [ ] Client information
  - [ ] Requirements
  - [ ] "Apply Now" button

#### **Test 3.2: Apply for Shift**
- [ ] From shift details, tap "Apply Now"
- [ ] **Expected**: Application screen
- [ ] Enter application message (optional)
- [ ] Tap "Submit Application"
- [ ] **Expected**: Success message
- [ ] **Expected**: Application status changes to "Pending"

#### **Test 3.3: View My Shifts**
- [ ] Navigate to "Shifts" tab
- [ ] **Verify**: Displays:
  - [ ] Active shift (if any)
  - [ ] Upcoming shifts
  - [ ] Past shifts
- [ ] Tap on an upcoming shift
- [ ] **Verify**: Shift details with:
  - [ ] Location map
  - [ ] Check-in instructions
  - [ ] Shift requirements

---

### **Phase 4: Check-In/Check-Out**

#### **Test 4.1: Check-In Process**
- [ ] Navigate to active shift or "Check In" tab
- [ ] **Verify**: Check-in screen displays:
  - [ ] Current time
  - [ ] Shift information
  - [ ] Location status
- [ ] Tap "Check In" button
- [ ] **Expected**: Location permission request (if first time)
- [ ] Grant location permission
- [ ] **Expected**: Location verification
- [ ] **Expected**: Check-in successful
- [ ] **Verify**: Active shift screen shows:
  - [ ] Timer running
  - [ ] Current location
  - [ ] Check-out button enabled

#### **Test 4.2: Active Shift Monitoring**
- [ ] After check-in, verify:
  - [ ] Timer displays elapsed time
  - [ ] Location updates in real-time
  - [ ] Emergency button visible
  - [ ] Report incident button available
- [ ] Move device (simulate patrol)
- [ ] **Verify**: Location updates on map

#### **Test 4.3: Check-Out Process**
- [ ] From active shift screen, tap "Check Out"
- [ ] **Expected**: Check-out confirmation
- [ ] Add check-out notes (optional)
- [ ] Tap "Confirm Check Out"
- [ ] **Expected**: Check-out successful
- [ ] **Expected**: Shift marked as completed
- [ ] **Verify**: Shift appears in "Past Shifts"

---

### **Phase 5: Live Location Tracking**

#### **Test 5.1: Start Location Tracking**
- [ ] Login as Guard
- [ ] Start an active shift (check-in)
- [ ] **Verify**: Location tracking starts automatically
- [ ] **Verify**: Location icon in status bar (if implemented)
- [ ] Open app settings
- [ ] **Verify**: Location permission granted

#### **Test 5.2: Background Tracking**
- [ ] With active shift running:
  - [ ] Minimize app (press home button)
  - [ ] Wait 30 seconds
  - [ ] Reopen app
- [ ] **Verify**: Location still tracking
- [ ] **Verify**: Timer still running
- [ ] **Verify**: Location updates received

#### **Test 5.3: Location Accuracy**
- [ ] Check current location on map
- [ ] Compare with actual GPS location
- [ ] **Verify**: Accuracy within acceptable range
- [ ] **Verify**: Location updates every 30-60 seconds

---

### **Phase 6: Incident Reporting**

#### **Test 6.1: Create Incident Report**
- [ ] During active shift, tap "Report Incident"
- [ ] **Expected**: Incident report form
- [ ] Fill form:
  - [ ] Incident type (select from dropdown)
  - [ ] Description
  - [ ] Severity level
  - [ ] Location (auto-filled)
- [ ] Add photo (optional):
  - [ ] Tap camera icon
  - [ ] Take photo or select from gallery
- [ ] Tap "Submit Report"
- [ ] **Expected**: Report submitted successfully
- [ ] **Expected**: Report appears in "Reports" tab

#### **Test 6.2: View Incident Reports**
- [ ] Navigate to "Reports" tab
- [ ] **Verify**: List of all reports
- [ ] **Verify**: Each report shows:
  - [ ] Date/time
  - [ ] Type
  - [ ] Status
  - [ ] Location
- [ ] Tap on a report
- [ ] **Expected**: Report details screen
- [ ] **Verify**: All details, photos visible

#### **Test 6.3: Emergency Alert**
- [ ] During active shift, tap "Emergency" button
- [ ] **Expected**: Emergency confirmation dialog
- [ ] Confirm emergency
- [ ] **Expected**: Emergency alert sent
- [ ] **Expected**: Notification to admin/supervisor
- [ ] **Verify**: Emergency status visible on dashboard

---

### **Phase 7: Profile & Settings**

#### **Test 7.1: View Profile**
- [ ] Navigate to "Profile" tab
- [ ] **Verify**: Profile displays:
  - [ ] Name, email, phone
  - [ ] Profile photo
  - [ ] Role
  - [ ] Statistics
- [ ] Tap "Edit Profile"
- [ ] **Expected**: Profile edit screen

#### **Test 7.2: Edit Profile**
- [ ] Update profile information
- [ ] Change profile photo
- [ ] Save changes
- [ ] **Expected**: Changes saved successfully
- [ ] **Verify**: Updated info reflected on profile

#### **Test 7.3: Settings**
- [ ] Open drawer menu
- [ ] Tap "Settings"
- [ ] **Verify**: Settings screen with:
  - [ ] Notification preferences
  - [ ] Location settings
  - [ ] Privacy settings
  - [ ] About/Support
- [ ] Toggle notification settings
- [ ] **Verify**: Changes saved

---

## 2️⃣ **ADMIN USER FLOW**

### **Phase 1: Admin Authentication**

#### **Test 2.1: Admin Login**
- [ ] Open app
- [ ] Login with:
  - Email: `admin@test.com`
  - Password: `12345678`
- [ ] **Expected**: Redirect to Admin Dashboard
- [ ] **Verify**: Admin-specific navigation visible

---

### **Phase 2: Admin Dashboard**

#### **Test 2.2: Dashboard Overview**
- [ ] **Verify**: Dashboard displays:
  - [ ] Real-time metrics (guards, sites, incidents)
  - [ ] Quick action cards
  - [ ] Recent activity feed
  - [ ] Emergency alerts (if any)
- [ ] **Verify**: Tab navigation:
  - [ ] Operations
  - [ ] Management
  - [ ] Reports
  - [ ] Settings

---

### **Phase 3: Operations Center**

#### **Test 2.3: Live Operations Monitoring**
- [ ] Navigate to "Operations" tab
- [ ] **Verify**: Operations Center displays:
  - [ ] Active guards map view
  - [ ] Real-time guard locations
  - [ ] Active shifts list
  - [ ] Live alerts/notifications
- [ ] Tap on a guard marker
- [ ] **Expected**: Guard details popup
- [ ] **Verify**: Shows guard info, current shift, location

#### **Test 2.4: Real-Time Updates**
- [ ] Have a guard check-in (on another device)
- [ ] **Verify**: Guard appears on map in real-time
- [ ] **Verify**: Active shifts list updates
- [ ] Have guard move location
- [ ] **Verify**: Location updates on map

---

### **Phase 4: User Management**

#### **Test 2.5: View All Users**
- [ ] Navigate to "Management" tab
- [ ] Tap "User Management"
- [ ] **Verify**: User list displays:
  - [ ] Guards
  - [ ] Clients
  - [ ] Admins
- [ ] **Verify**: Filter/search functionality works
- [ ] Tap on a user
- [ ] **Expected**: User details screen

#### **Test 2.6: Create New User**
- [ ] From User Management, tap "Add User"
- [ ] Select user role (Guard/Client/Admin)
- [ ] Fill user form:
  - [ ] Name, email, phone
  - [ ] Role-specific fields
- [ ] Tap "Create User"
- [ ] **Expected**: User created successfully
- [ ] **Verify**: User appears in list

#### **Test 2.7: Edit User**
- [ ] Tap on existing user
- [ ] Tap "Edit"
- [ ] Update user information
- [ ] Save changes
- [ ] **Expected**: Changes saved
- [ ] **Verify**: Updated info reflected

#### **Test 2.8: Deactivate User**
- [ ] From user details, tap "Deactivate"
- [ ] Confirm deactivation
- [ ] **Expected**: User status changes to inactive
- [ ] **Verify**: User cannot login

---

### **Phase 5: Site Management**

#### **Test 2.9: View All Sites**
- [ ] Navigate to "Management" tab
- [ ] Tap "Site Management"
- [ ] **Verify**: Site list displays
- [ ] **Verify**: Each site shows:
  - [ ] Name, address
  - [ ] Status
  - [ ] Assigned guards
- [ ] Tap on a site
- [ ] **Expected**: Site details screen

#### **Test 2.10: Create New Site**
- [ ] Tap "Add Site"
- [ ] Fill site form:
  - [ ] Name, address
  - [ ] Location (map picker)
  - [ ] Geofence radius
  - [ ] Contact information
- [ ] Save site
- [ ] **Expected**: Site created
- [ ] **Verify**: Site appears on map

#### **Test 2.11: Edit Site**
- [ ] Open site details
- [ ] Tap "Edit"
- [ ] Update site information
- [ ] Save changes
- [ ] **Expected**: Changes saved

---

### **Phase 6: Shift Scheduling**

#### **Test 2.12: View Shifts**
- [ ] Navigate to "Operations" tab
- [ ] Tap "Shift Scheduling"
- [ ] **Verify**: Calendar view or list view
- [ ] **Verify**: Shows:
  - [ ] Scheduled shifts
  - [ ] Assigned guards
  - [ ] Shift status
- [ ] Filter by date/status
- [ ] **Verify**: Filters work correctly

#### **Test 2.13: Create Shift**
- [ ] Tap "Create Shift"
- [ ] Fill shift form:
  - [ ] Site selection
  - [ ] Date and time
  - [ ] Guard assignment
  - [ ] Shift type
- [ ] Save shift
- [ ] **Expected**: Shift created
- [ ] **Verify**: Guard receives notification

#### **Test 2.14: Assign Guard to Shift**
- [ ] Open shift details
- [ ] Tap "Assign Guard"
- [ ] Select guard from list
- [ ] Confirm assignment
- [ ] **Expected**: Guard assigned
- [ ] **Verify**: Guard receives notification

---

### **Phase 7: Incident Review**

#### **Test 2.15: Review Incidents**
- [ ] Navigate to "Reports" tab
- [ ] **Verify**: Incident list displays
- [ ] **Verify**: Shows:
  - [ ] Incident type
  - [ ] Date/time
  - [ ] Guard name
  - [ ] Status (Pending/Reviewed/Resolved)
- [ ] Tap on incident
- [ ] **Expected**: Incident details screen

#### **Test 2.16: Approve/Resolve Incident**
- [ ] Open incident details
- [ ] Review incident information
- [ ] View photos/attachments
- [ ] Tap "Approve" or "Resolve"
- [ ] Add resolution notes
- [ ] Submit
- [ ] **Expected**: Incident status updated
- [ ] **Verify**: Guard notified

---

### **Phase 8: Analytics & Reports**

#### **Test 2.17: View Analytics**
- [ ] Navigate to "Reports" tab
- [ ] Tap "Analytics"
- [ ] **Verify**: Analytics dashboard shows:
  - [ ] Guard performance metrics
  - [ ] Shift statistics
  - [ ] Incident trends
  - [ ] Revenue metrics
- [ ] Change date range
- [ ] **Verify**: Data updates

#### **Test 2.18: Generate Reports**
- [ ] From Analytics, tap "Generate Report"
- [ ] Select report type
- [ ] Select date range
- [ ] Tap "Generate"
- [ ] **Expected**: Report generated
- [ ] **Verify**: Can export/share report

---

## 3️⃣ **CLIENT USER FLOW**

### **Phase 1: Client Authentication**

#### **Test 3.1: Client Login**
- [ ] Login with:
  - Email: `client1@test.com`
  - Password: `12345678`
- [ ] **Expected**: Redirect to Client Dashboard
- [ ] **Verify**: Client-specific navigation

---

### **Phase 2: Client Dashboard**

#### **Test 3.2: Dashboard Overview**
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

---

### **Phase 3: Site Management**

#### **Test 3.3: View Sites**
- [ ] Navigate to "Sites & Shifts" tab
- [ ] **Verify**: Site list displays
- [ ] Tap on a site
- [ ] **Expected**: Site details screen
- [ ] **Verify**: Shows:
  - [ ] Site information
  - [ ] Active shifts
  - [ ] Assigned guards

#### **Test 3.4: Create Site**
- [ ] Tap "Add New Site"
- [ ] Fill site form:
  - [ ] Name, address
  - [ ] Location (map)
  - [ ] Contact details
- [ ] Save site
- [ ] **Expected**: Site created
- [ ] **Verify**: Site appears in list

---

### **Phase 4: Shift Posting**

#### **Test 3.5: Post Shift**
- [ ] From site details, tap "Create Shift"
- [ ] Fill shift form:
  - [ ] Date and time
  - [ ] Duration
  - [ ] Number of guards needed
  - [ ] Pay rate
  - [ ] Requirements
- [ ] Post shift
- [ ] **Expected**: Shift posted
- [ ] **Verify**: Guards can see shift in "Available Shifts"

#### **Test 3.6: Review Applications**
- [ ] Open posted shift
- [ ] **Verify**: Applications list displays
- [ ] **Verify**: Shows guard info, application message
- [ ] Tap on application
- [ ] **Expected**: Application details
- [ ] Approve or reject application
- [ ] **Expected**: Guard notified

---

### **Phase 5: Guard Monitoring**

#### **Test 3.7: View Active Guards**
- [ ] Navigate to "Guards" tab
- [ ] **Verify**: Active guards list
- [ ] Tap on guard
- [ ] **Expected**: Guard details with:
  - [ ] Current location (map)
  - [ ] Active shift info
  - [ ] Check-in status
- [ ] **Verify**: Real-time location updates

#### **Test 3.8: Monitor Shift Progress**
- [ ] From site details, view active shift
- [ ] **Verify**: Shows:
  - [ ] Guard location on map
  - [ ] Check-in time
  - [ ] Elapsed time
  - [ ] Patrol status
- [ ] **Verify**: Location updates in real-time

---

### **Phase 6: Reports & Analytics**

#### **Test 3.9: View Reports**
- [ ] Navigate to "Reports" tab
- [ ] **Verify**: Reports list shows:
  - [ ] Incident reports
  - [ ] Shift reports
  - [ ] Guard performance
- [ ] Filter by date/site
- [ ] **Verify**: Filters work

#### **Test 3.10: View Analytics**
- [ ] From Reports, tap "Analytics"
- [ ] **Verify**: Client analytics dashboard:
  - [ ] Site utilization
  - [ ] Guard performance
  - [ ] Incident trends
  - [ ] Cost analysis

---

## 4️⃣ **SUPER ADMIN FLOW**

### **Phase 1: Super Admin Authentication**

#### **Test 4.1: Super Admin Login**
- [ ] Login with:
  - Email: `superadmin@tracsopro.com`
  - Password: `12345678`
- [ ] **Expected**: Redirect to Super Admin Dashboard
- [ ] **Verify**: Platform-level navigation

---

### **Phase 2: Company Management**

#### **Test 4.2: View Companies**
- [ ] Navigate to "Companies"
- [ ] **Verify**: Company list displays
- [ ] **Verify**: Shows:
  - [ ] Company name
  - [ ] Status (Active/Suspended)
  - [ ] Subscription plan
  - [ ] User count
- [ ] Tap on company
- [ ] **Expected**: Company details screen

#### **Test 4.3: Create Company**
- [ ] Tap "Create Company"
- [ ] Fill company form:
  - [ ] Company name, email, phone
  - [ ] Address
  - [ ] Subscription plan
  - [ ] Resource limits
- [ ] Save company
- [ ] **Expected**: Company created
- [ ] **Verify**: Company admin account created

#### **Test 4.4: Manage Company**
- [ ] Open company details
- [ ] **Verify**: Shows:
  - [ ] Company information
  - [ ] Subscription details
  - [ ] Statistics (users, sites, guards)
  - [ ] Billing information
- [ ] Toggle company status
- [ ] **Expected**: Status updated
- [ ] **Verify**: Company users affected

---

### **Phase 3: Platform Analytics**

#### **Test 4.5: View Platform Analytics**
- [ ] Navigate to "Analytics"
- [ ] **Verify**: Platform-wide metrics:
  - [ ] Total companies
  - [ ] Total users
  - [ ] Revenue
  - [ ] Growth trends
- [ ] Change date range
- [ ] **Verify**: Data updates

---

### **Phase 4: System Settings**

#### **Test 4.6: System Configuration**
- [ ] Navigate to "Settings"
- [ ] **Verify**: System settings:
  - [ ] Platform configuration
  - [ ] Feature toggles
  - [ ] Billing settings
  - [ ] Security settings
- [ ] Update settings
- [ ] **Expected**: Changes saved

---

## 🔄 **CROSS-ROLE TESTING**

### **Test 5.1: Multi-User Workflow**
1. **Setup**:
   - [ ] Login as Client on Device 1
   - [ ] Login as Guard on Device 2
   - [ ] Login as Admin on Device 3 (or browser)

2. **Client Posts Shift**:
   - [ ] Client creates site
   - [ ] Client posts shift
   - [ ] **Verify**: Shift appears in Guard's "Available Shifts"

3. **Guard Applies**:
   - [ ] Guard applies for shift
   - [ ] **Verify**: Application appears in Client's shift details

4. **Client Approves**:
   - [ ] Client approves application
   - [ ] **Verify**: Guard receives notification
   - [ ] **Verify**: Shift appears in Guard's "My Shifts"

5. **Guard Checks In**:
   - [ ] Guard checks in at shift location
   - [ ] **Verify**: Client sees guard as active
   - [ ] **Verify**: Admin sees guard on operations map

6. **Guard Reports Incident**:
   - [ ] Guard creates incident report
   - [ ] **Verify**: Client sees incident in reports
   - [ ] **Verify**: Admin sees incident in review queue

7. **Admin Reviews**:
   - [ ] Admin reviews and resolves incident
   - [ ] **Verify**: Guard and Client notified

---

## 🐛 **ERROR HANDLING TESTS**

### **Test 6.1: Network Errors**
- [ ] Disable network/WiFi
- [ ] Try to login
- [ ] **Expected**: Network error message
- [ ] Try to check-in
- [ ] **Expected**: Offline mode message
- [ ] Re-enable network
- [ ] **Verify**: Data syncs automatically

### **Test 6.2: Invalid Credentials**
- [ ] Enter wrong password
- [ ] **Expected**: Error message
- [ ] Enter non-existent email
- [ ] **Expected**: User not found message

### **Test 6.3: Permission Denials**
- [ ] Deny location permission
- [ ] Try to check-in
- [ ] **Expected**: Permission request with explanation
- [ ] Deny camera permission
- [ ] Try to add photo to report
- [ ] **Expected**: Permission request

### **Test 6.4: Session Expiry**
- [ ] Login successfully
- [ ] Wait for token expiry (or manually expire)
- [ ] Try to perform action
- [ ] **Expected**: Auto-logout or token refresh
- [ ] **Expected**: Redirect to login

---

## 📱 **DEVICE-SPECIFIC TESTS**

### **Test 7.1: Physical Device**
- [ ] Install app on physical Android device
- [ ] Test all major flows
- [ ] **Verify**: GPS accuracy
- [ ] **Verify**: Background location tracking
- [ ] **Verify**: Battery usage acceptable

### **Test 7.2: Emulator**
- [ ] Test on Android emulator
- [ ] **Verify**: All features work
- [ ] **Verify**: Location simulation works

### **Test 7.3: Multiple Devices**
- [ ] Run app on multiple devices simultaneously
- [ ] **Verify**: Real-time updates sync across devices
- [ ] **Verify**: No conflicts or data issues

---

## ⚡ **PERFORMANCE TESTS**

### **Test 8.1: App Launch**
- [ ] Measure app launch time
- [ ] **Expected**: < 3 seconds
- [ ] **Verify**: Smooth transition to login/dashboard

### **Test 8.2: Map Performance**
- [ ] Open map with multiple guards
- [ ] **Verify**: Smooth scrolling/zooming
- [ ] **Verify**: No lag with 10+ markers

### **Test 8.3: List Performance**
- [ ] Open shifts list with 100+ items
- [ ] **Verify**: Smooth scrolling
- [ ] **Verify**: Pagination works

### **Test 8.4: Battery Usage**
- [ ] Run app with active tracking for 1 hour
- [ ] **Verify**: Battery drain acceptable
- [ ] **Verify**: Background tracking efficient

---

## 🔒 **SECURITY TESTS**

### **Test 9.1: Authentication**
- [ ] Verify JWT tokens used
- [ ] Verify tokens expire correctly
- [ ] Verify refresh token mechanism

### **Test 9.2: Authorization**
- [ ] Login as Guard
- [ ] Try to access Admin routes
- [ ] **Expected**: Access denied
- [ ] Login as Client
- [ ] Try to access Guard features
- [ ] **Expected**: Access denied

### **Test 9.3: Data Protection**
- [ ] Verify sensitive data encrypted
- [ ] Verify API calls use HTTPS
- [ ] Verify tokens stored securely

---

## 📊 **TESTING CHECKLIST SUMMARY**

### **Critical Flows** ✅
- [ ] Guard login and dashboard
- [ ] Guard check-in/check-out
- [ ] Live location tracking
- [ ] Incident reporting
- [ ] Admin dashboard access
- [ ] User management
- [ ] Site management
- [ ] Shift scheduling
- [ ] Client shift posting
- [ ] Multi-user workflow

### **Edge Cases** ✅
- [ ] Network errors
- [ ] Permission denials
- [ ] Session expiry
- [ ] Invalid data input
- [ ] Concurrent operations

### **Performance** ✅
- [ ] App launch time
- [ ] Map performance
- [ ] List scrolling
- [ ] Battery usage

### **Security** ✅
- [ ] Authentication
- [ ] Authorization
- [ ] Data protection

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

### **Reporting Bugs**
When reporting issues, include:
- User role and test case number
- Steps to reproduce
- Expected vs actual behavior
- Device/OS version
- Screenshots/logs if available

---

## 🎯 **NEXT STEPS AFTER TESTING**

1. **Document Findings**: Record all bugs and issues
2. **Prioritize Fixes**: Critical → High → Medium → Low
3. **Re-test**: After fixes, re-run affected test cases
4. **Performance Optimization**: Address any performance issues
5. **User Acceptance**: Get feedback from actual users

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Maintained By**: Development Team


