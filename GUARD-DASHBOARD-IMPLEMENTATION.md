# Guard Dashboard Flow - Complete Implementation Guide

## Overview
This document outlines the complete implementation of the pixel-perfect guard dashboard flow matching the provided UI designs.

## ✅ COMPLETED: Backend Implementation

### 1. Database Schema Updates
**File**: `backend/prisma/schema.prisma`

Enhanced the `Shift` model with:
- `locationId`, `locationName`, `locationAddress` - Full location details
- `breakStartTime`, `breakEndTime` - Break time tracking
- `checkInTime`, `checkOutTime` - Actual check-in/out times
- `actualDuration` - Calculated shift duration in minutes
- `description` - Shift instructions

Added new `ShiftReport` model:
- `shiftId` - Reference to shift
- `guardId` - Guard who created the report
- `reportType` - SHIFT, INCIDENT, or EMERGENCY
- `content` - Report text
- `submittedAt` - Timestamp

### 2. Backend Services Created

#### ShiftService (`backend/src/services/shiftService.ts`)
Complete shift management with methods for:
- `createShift()` - Create new shifts
- `getShiftById()` - Get shift details
- `getGuardTodayShifts()` - Today's shifts
- `getGuardUpcomingShifts()` - Future shifts
- `getGuardPastShifts()` - Historical shifts
- `getGuardWeeklyShiftSummary()` - Week view
- `getGuardMonthlyStats()` - Statistics (completed, missed, sites, incidents)
- `checkIn()` - Clock in to shift with location tracking
- `checkOut()` - Clock out from shift
- `getActiveShift()` - Current in-progress shift
- `getNextUpcomingShift()` - Next scheduled shift

#### ShiftReportService (`backend/src/services/shiftReportService.ts`)
Report management with methods for:
- `createShiftReport()` - Submit shift/incident reports
- `getGuardReports()` - All reports for guard
- `getShiftReports()` - Reports for specific shift
- `getGuardReportsByType()` - Filter by report type
- `updateShiftReport()` - Edit report
- `deleteShiftReport()` - Remove report

### 3. API Controllers Created

#### ShiftController (`backend/src/controllers/shiftController.ts`)
HTTP endpoints:
- `GET /api/shifts/stats` - Monthly statistics
- `GET /api/shifts/today` - Today's shifts
- `GET /api/shifts/upcoming` - Upcoming shifts
- `GET /api/shifts/past` - Past shifts
- `GET /api/shifts/weekly-summary` - Weekly summary
- `GET /api/shifts/active` - Active shift
- `GET /api/shifts/next` - Next upcoming shift
- `GET /api/shifts/:id` - Shift details
- `POST /api/shifts/check-in` - Check in
- `POST /api/shifts/check-out` - Check out
- `POST /api/shifts` - Create shift (admin)

#### ShiftReportController (`backend/src/controllers/shiftReportController.ts`)
HTTP endpoints:
- `POST /api/shift-reports` - Create report
- `GET /api/shift-reports` - Get all guard reports
- `GET /api/shift-reports/:id` - Get report by ID
- `GET /api/shift-reports/shift/:shiftId` - Get shift reports
- `PUT /api/shift-reports/:id` - Update report
- `DELETE /api/shift-reports/:id` - Delete report

### 4. API Routes Registered
- `backend/src/routes/shifts.ts` - Shift routes
- `backend/src/routes/shiftReports.ts` - Report routes
- Routes registered in `backend/src/routes/index.ts`

### 5. Seed Data Script
**File**: `backend/prisma/seed-shifts.ts`
- Creates sample shifts (today, upcoming, past, missed)
- Creates sample shift reports
- Run with: `npx ts-node prisma/seed-shifts.ts`

---

## 🚧 IN PROGRESS: Frontend Implementation

### UI Design Analysis (from provided images)

#### Image 1: Reports Screen
- Header with menu, title "My Reports", notification bell
- Active shift card with:
  - Location icon + name + address
  - Green "Active" badge
  - Shift description
  - Shift time display
  - Multi-line text input for report
  - Blue "Submit" button
  - "Add Incident Report" button (light blue)
  - "Emergency Alert" button (light red)
- Submitted Reports section with:
  - Location cards
  - Report text
  - "Incident report" badge with dropdown
  - Timestamp

#### Image 2: My Shifts Screen
- Header with menu, title "My Shifts", notification bell
- Tab navigation: Today | Upcoming | Past
- Shift cards with:
  - Location icon + name + address
  - Status badge (Active/Upcoming)
  - Shift description
  - Shift time display
  - Timer display (HH:MM:SS) for active shifts
  - "Clocked In at" timestamp
  - "Add Incident Report" and "Emergency Alert" buttons
  - "Clock In" button for upcoming shifts
  - "Shift Start In" countdown

#### Image 3: Home/Check-In Screen
- Header with trac50pro logo, notification bell
- "Today's Shifts" section with:
  - Location card
  - "View Location" link
  - Shift description
  - Shift Duration, Break Time, Shift Start In
  - Large timer (00:00:00)
  - Blue "Check In" button
- "Today's Notifications" section with:
  - User avatar circles
  - User name
  - Action description
  - Site name
  - Green "Active" status dot

#### Image 4 & 5: Home Screen with Stats
- trac50pro logo header
- "This Month Shifts" stats cards (2x2 grid):
  - Completed Shifts: 21 (green)
  - Missed Shifts: 1 (red)
  - Total Sites: 5 (blue)
  - Incident Reported: 2 (gray)
- "Today's Shifts" card (same as Image 3)
- "Upcoming Shifts" section
- "This Week's Shifts Summary" table with:
  - DATE | SITE | SHIFT TIME | STATUS | CHECK IN | CHECK OUT
  - Color-coded status (green=Completed, red=Missed)

### Design System Constants
```typescript
COLORS:
- Primary Blue: #1C6CA9 (or #2196F3)
- Success Green: #4CAF50
- Error Red: #D32F2F / #F44336
- Info Blue: #2196F3
- Background: #FFFFFF
- Secondary Background: #F5F5F5
- Text Primary: #212121
- Text Secondary: #757575

SPACING:
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px

BORDER_RADIUS:
- sm: 4px
- md: 8px
- lg: 12px
- xl: 20px
```

---

## 📋 TODO: Frontend Implementation Steps

### Step 1: Create Redux Slices
**Files to create**:
- `GuardTrackingApp/src/store/slices/shiftSlice.ts`
- `GuardTrackingApp/src/store/slices/shiftReportSlice.ts`

**Features**:
- Async thunks for all API calls
- State management for shifts, reports, loading, errors
- Selectors for filtered data

### Step 2: Create API Service Layer
**Files to create**:
- `GuardTrackingApp/src/services/shiftService.ts`
- `GuardTrackingApp/src/services/shiftReportService.ts`

**Features**:
- Axios-based API calls
- Type-safe request/response handling
- Error handling

### Step 3: Create TypeScript Types
**File**: `GuardTrackingApp/src/types/shift.types.ts`
```typescript
export interface Shift {
  id: string;
  guardId: string;
  locationId?: string;
  locationName: string;
  locationAddress: string;
  startTime: string;
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'CANCELLED';
  description?: string;
  notes?: string;
  checkInTime?: string;
  checkOutTime?: string;
  actualDuration?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftReport {
  id: string;
  shiftId: string;
  guardId: string;
  reportType: 'SHIFT' | 'INCIDENT' | 'EMERGENCY';
  content: string;
  submittedAt: string;
}

export interface ShiftStats {
  completedShifts: number;
  missedShifts: number;
  totalSites: number;
  incidentReports: number;
}
```

### Step 4: Rebuild GuardHomeScreen
**File**: `GuardTrackingApp/src/screens/dashboard/GuardHomeScreen.tsx`

**Features**:
- Fetch and display monthly stats
- Show today's active shift with timer
- Display upcoming shift
- Show today's notifications
- Implement "Check In" functionality
- Add "View Location" map integration
- "Add Incident Report" and "Emergency Alert" buttons

### Step 5: Create CheckInScreen (New)
**File**: `GuardTrackingApp/src/screens/dashboard/CheckInScreen.tsx`

**Features**:
- Display shift details
- Show countdown timer to shift start
- Large "Check In" button
- Location verification
- GPS tracking on check-in

### Step 6: Rebuild MyShiftsScreen
**File**: `GuardTrackingApp/src/screens/dashboard/MyShiftsScreen.tsx`

**Features**:
- Tab navigation (Today/Upcoming/Past)
- Shift cards with proper status badges
- Active shift timer
- Clock In/Out buttons
- Weekly shift summary table
- Filter and sort capabilities

### Step 7: Rebuild ReportsScreen
**File**: `GuardTrackingApp/src/screens/dashboard/ReportsScreen.tsx`

**Features**:
- Active shift report form
- Text input for report content
- Submit button
- "Add Incident Report" modal
- "Emergency Alert" confirmation
- Submitted reports list
- Report type badges
- Timestamps

### Step 8: Create Shared UI Components
**Files to create**:
- `GuardTrackingApp/src/components/shifts/ShiftCard.tsx`
- `GuardTrackingApp/src/components/shifts/ShiftTimer.tsx`
- `GuardTrackingApp/src/components/shifts/ShiftStatsCard.tsx`
- `GuardTrackingApp/src/components/shifts/WeeklyShiftTable.tsx`
- `GuardTrackingApp/src/components/reports/ReportCard.tsx`
- `GuardTrackingApp/src/components/reports/ReportForm.tsx`

### Step 9: Update Navigation
**File**: `GuardTrackingApp/src/navigation/DashboardNavigator.tsx`

**Features**:
- Add CheckIn screen to stack
- Update tab icons
- Configure deep linking

### Step 10: Integration & Testing
- Connect all screens to Redux store
- Test check-in/check-out flow
- Test report submission
- Verify data persistence
- Test offline capabilities
- Performance optimization

---

## 🎨 UI Implementation Checklist

### GuardHomeScreen
- [ ] Header with logo and notification bell
- [ ] Stats cards (2x2 grid)
- [ ] Today's shift card with timer
- [ ] Check In button
- [ ] View Location button
- [ ] Upcoming shifts section
- [ ] Weekly shift summary table
- [ ] Today's notifications list
- [ ] Pull-to-refresh
- [ ] Loading states
- [ ] Error handling

### CheckInScreen
- [ ] Shift details card
- [ ] Location display
- [ ] Countdown timer
- [ ] Large Check In button
- [ ] GPS location capture
- [ ] Success/error feedback

### MyShiftsScreen
- [ ] Tab navigation (Today/Upcoming/Past)
- [ ] Shift cards with status badges
- [ ] Active shift timer
- [ ] Clock In/Out buttons
- [ ] Incident Report button
- [ ] Emergency Alert button
- [ ] Shift details modal
- [ ] Loading states
- [ ] Empty states

### ReportsScreen
- [ ] Active shift card
- [ ] Report text input
- [ ] Submit button
- [ ] Incident Report button
- [ ] Emergency Alert button
- [ ] Submitted reports list
- [ ] Report type badges
- [ ] Timestamps
- [ ] Edit/delete reports
- [ ] Loading states

---

## 🔧 Technical Implementation Notes

### State Management Flow
```
User Action → Dispatch Thunk → API Call → Update State → UI Re-render
```

### Check-In Flow
```
1. User taps "Check In" button
2. Request location permission
3. Get current GPS coordinates
4. Call POST /api/shifts/check-in with shiftId and location
5. Update shift status to IN_PROGRESS
6. Start timer
7. Show success message
```

### Timer Implementation
```typescript
// Use setInterval to update every second
// Calculate elapsed time from checkInTime
// Display in HH:MM:SS format
// Persist timer state in Redux
```

### Offline Support
- Cache shift data in AsyncStorage
- Queue check-in/out actions when offline
- Sync when connection restored
- Show offline indicator

---

## 📱 Screen Flow Diagram

```
Login → Dashboard (GuardHomeScreen)
         ├─ Home Tab
         │  ├─ Check In → CheckInScreen
         │  ├─ View Location → MapScreen
         │  └─ Notifications → NotificationScreen
         ├─ My Shifts Tab (MyShiftsScreen)
         │  ├─ Today
         │  ├─ Upcoming
         │  └─ Past
         ├─ Reports Tab (ReportsScreen)
         │  ├─ Submit Shift Report
         │  ├─ Add Incident Report
         │  └─ Emergency Alert
         └─ Jobs Tab (JobsScreen)
```

---

## 🚀 Next Steps

1. **Run seed script** to populate test data:
   ```bash
   cd backend
   npx ts-node prisma/seed-shifts.ts
   ```

2. **Test backend APIs** using Swagger UI:
   ```
   http://localhost:3000/api-docs
   ```

3. **Implement Redux slices** for state management

4. **Build UI components** matching the designs pixel-perfect

5. **Integrate with backend APIs**

6. **Test end-to-end flow**

---

## 📚 API Documentation

All APIs are documented in Swagger UI at `http://localhost:3000/api-docs`

### Key Endpoints:
- **GET /api/shifts/stats** - Get monthly statistics
- **GET /api/shifts/today** - Get today's shifts
- **POST /api/shifts/check-in** - Check in to shift
- **POST /api/shifts/check-out** - Check out from shift
- **POST /api/shift-reports** - Submit shift report
- **GET /api/shift-reports** - Get all reports

---

## ✅ Success Criteria

- [ ] Pixel-perfect UI matching provided designs
- [ ] Complete check-in/check-out flow
- [ ] Real-time shift timer
- [ ] Shift report submission
- [ ] Weekly shift summary table
- [ ] Monthly statistics display
- [ ] Offline support
- [ ] Error handling
- [ ] Loading states
- [ ] Pull-to-refresh
- [ ] Smooth animations
- [ ] Type-safe implementation
- [ ] Redux state management
- [ ] End-to-end testing

---

**Status**: Backend Complete ✅ | Frontend In Progress 🚧
**Last Updated**: 2025-01-29
