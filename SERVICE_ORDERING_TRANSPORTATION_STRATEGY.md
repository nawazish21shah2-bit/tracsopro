# 🚗 Service Ordering & Transportation Feature - Integration Strategy

## 📋 Executive Summary

This document outlines the comprehensive strategy for integrating a service ordering system with transportation features into tracSOpro, transforming it into an "Uber for Security" platform. The system will allow clients to order various security services (including transportation) while maintaining full administrative control over guard assignment.

**Status**: Strategy Draft - Awaiting Review  
**Date**: November 2025

---

## 🎯 Core Requirements

### Client Requirements
1. ✅ Order services directly via the app
2. ✅ Choose from service types:
   - Armed Guard
   - Unarmed Guard
   - Body Guard
   - Body Guard with Vehicle (Transportation)
3. ✅ Select date & time → Request goes directly to email
4. ✅ Track assigned guard/driver live through tracSOpro (Uber-like experience)

### System Requirements
- ✅ Clients cannot directly assign guards (admin-controlled)
- ✅ Integration with existing ordering/booking section
- ✅ Simplified Uber-like experience for transportation
- ✅ Full control on Company/Admin side for guard assignment

---

## 🏗️ System Architecture

### Database Schema Extensions

#### 1. **ServiceOrder Model** (New)
```prisma
model ServiceOrder {
  id                String          @id @default(uuid())
  clientId          String
  serviceType       ServiceType
  status            OrderStatus     @default(PENDING)
  
  // Service Details
  startDateTime     DateTime
  endDateTime       DateTime?
  duration          Int?            // in minutes
  pickupLocation    Json?           // { address, latitude, longitude }
  dropoffLocation   Json?            // { address, latitude, longitude }
  serviceLocation   Json?            // For non-transportation services
  
  // Requirements
  guardRequirements String?
  specialInstructions String?
  numberOfGuards    Int             @default(1)
  
  // Assignment (Admin-controlled)
  assignedGuardId   String?
  assignedVehicleId String?
  assignedAt        DateTime?
  
  // Tracking
  estimatedCost     Float?
  actualCost        Float?
  
  // Metadata
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt
  cancelledAt       DateTime?
  cancellationReason String?
  
  // Relations
  client            Client          @relation(fields: [clientId], references: [id], onDelete: Cascade)
  assignedGuard     Guard?          @relation(fields: [assignedGuardId], references: [id], onDelete: SetNull)
  assignedVehicle   Vehicle?        @relation(fields: [assignedVehicleId], references: [id], onDelete: SetNull)
  trackingRecords   VehicleTrackingRecord[]
  orderUpdates      OrderUpdate[]
  
  @@index([clientId])
  @@index([serviceType])
  @@index([status])
  @@index([startDateTime])
  @@index([assignedGuardId])
}

enum ServiceType {
  ARMED_GUARD
  UNARMED_GUARD
  BODY_GUARD
  BODY_GUARD_WITH_VEHICLE
  GENERAL_SECURITY
  TRANSPORTATION
}

enum OrderStatus {
  PENDING           // Client submitted, awaiting admin assignment
  CONFIRMED         // Admin confirmed order
  ASSIGNED          // Guard/vehicle assigned
  IN_PROGRESS       // Service started
  COMPLETED         // Service completed
  CANCELLED         // Order cancelled
  NO_SHOW           // Guard didn't show up
}
```

#### 2. **Vehicle Model** (New)
```prisma
model Vehicle {
  id                    String          @id @default(uuid())
  make                  String
  model                 String
  year                  Int?
  licensePlate          String          @unique
  registrationNumber    String?
  color                 String?
  vehicleType           VehicleType     @default(SEDAN)
  
  // Assignment
  assignedGuardId       String?         // Current assigned guard/driver
  isActive              Boolean         @default(true)
  isAvailable           Boolean         @default(true)
  
  // Tracking
  currentLocation       Json?           // { latitude, longitude, timestamp }
  lastLocationUpdate    DateTime?
  
  // Metadata
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt
  
  // Relations
  assignedGuard         Guard?          @relation(fields: [assignedGuardId], references: [id], onDelete: SetNull)
  serviceOrders         ServiceOrder[]
  trackingRecords       VehicleTrackingRecord[]
  
  @@index([assignedGuardId])
  @@index([isActive])
  @@index([isAvailable])
}

enum VehicleType {
  SEDAN
  SUV
  VAN
  ARMORED
  MOTORCYCLE
}
```

#### 3. **VehicleTrackingRecord Model** (New)
```prisma
model VehicleTrackingRecord {
  id              String        @id @default(uuid())
  vehicleId       String
  serviceOrderId  String?
  guardId         String?
  latitude        Float
  longitude       Float
  accuracy        Float?
  speed           Float?        // km/h
  heading         Float?        // degrees
  timestamp       DateTime      @default(now())
  
  // Relations
  vehicle         Vehicle       @relation(fields: [vehicleId], references: [id], onDelete: Cascade)
  serviceOrder    ServiceOrder? @relation(fields: [serviceOrderId], references: [id], onDelete: SetNull)
  guard           Guard?        @relation(fields: [guardId], references: [id], onDelete: SetNull)
  
  @@index([vehicleId])
  @@index([serviceOrderId])
  @@index([timestamp])
  @@index([guardId])
}
```

#### 4. **OrderUpdate Model** (New - for order status history)
```prisma
model OrderUpdate {
  id            String        @id @default(uuid())
  serviceOrderId String
  status        OrderStatus
  message       String?
  updatedBy     String        // User ID (admin/guard)
  createdAt     DateTime      @default(now())
  
  serviceOrder  ServiceOrder  @relation(fields: [serviceOrderId], references: [id], onDelete: Cascade)
  
  @@index([serviceOrderId])
  @@index([createdAt])
}
```

#### 5. **Guard Model Extension**
```prisma
model Guard {
  // ... existing fields ...
  vehicleAssignments Vehicle[]
  serviceOrders      ServiceOrder[]  // Orders assigned to this guard
  vehicleTracking    VehicleTrackingRecord[]
}
```

---

## 🔄 User Flow Architecture

### **CLIENT FLOW: Service Ordering**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CLIENT DASHBOARD / SITES & SHIFTS TAB                     │
│    → "Request Service" Button (New)                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. SERVICE SELECTION SCREEN                                  │
│    → Service Type Dropdown:                                  │
│      • Armed Guard                                           │
│      • Unarmed Guard                                         │
│      • Body Guard                                            │
│      • Body Guard with Vehicle ⭐                            │
│      • General Security                                      │
│      • Transportation                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. SERVICE DETAILS SCREEN                                    │
│    → Date & Time Picker                                     │
│    → Location Selection:                                     │
│       • For Transportation: Pickup + Dropoff                │
│       • For Others: Service Location                         │
│    → Number of Guards                                        │
│    → Special Requirements/Instructions                       │
│    → Estimated Duration                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. ORDER REVIEW & CONFIRMATION                               │
│    → Summary of all details                                  │
│    → Estimated cost (if applicable)                         │
│    → "Submit Order" Button                                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. ORDER SUBMITTED                                           │
│    → Success message                                         │
│    → Order ID displayed                                      │
│    → "Track Order" / "View Orders" options                  │
│                                                              │
│    ⚡ IF "Body Guard with Vehicle":                           │
│       → Email sent to admin email                            │
│       → Email includes:                                      │
│         • Service type                                       │
│         • Dates & times                                      │
│         • Pickup/dropoff locations                           │
│         • Client details                                     │
│         • Order ID                                           │
└─────────────────────────────────────────────────────────────┘
```

### **ADMIN FLOW: Order Management & Assignment**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ADMIN DASHBOARD                                          │
│    → "Service Orders" Section                                │
│    → Pending Orders Count Badge                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. SERVICE ORDERS LIST SCREEN                                │
│    → Tabs: Pending | Assigned | In Progress | Completed     │
│    → Filter by Service Type                                 │
│    → Sort by Date/Status                                     │
│    → Each order card shows:                                  │
│       • Service type & status                                │
│       • Client name                                          │
│       • Date/time                                            │
│       • Location(s)                                         │
│       • "Assign Guard" button                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. ORDER DETAILS SCREEN                                      │
│    → Full order information                                  │
│    → Client contact details                                  │
│    → "Assign Guard" Button                                   │
│    → "Assign Vehicle" Button (if transportation)             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. GUARD ASSIGNMENT SCREEN                                   │
│    → Available guards list (filtered by:                    │
│       • Service type requirements                            │
│       • Availability at requested time                       │
│       • Location proximity)                                 │
│    → Guard cards with:                                       │
│       • Name, photo, rating                                  │
│       • Current location                                     │
│       • Availability status                                  │
│    → "Assign" button per guard                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. VEHICLE ASSIGNMENT SCREEN (if transportation)            │
│    → Available vehicles list                                 │
│    → Vehicle cards with:                                     │
│       • Make, model, license plate                          │
│       • Current location                                     │
│       • Assigned driver (if any)                            │
│    → "Assign Vehicle" button                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. ASSIGNMENT CONFIRMED                                      │
│    → Guard & vehicle assigned                               │
│    → Client notified (push notification)                     │
│    → Guard notified (push notification)                      │
│    → Order status: ASSIGNED → IN_PROGRESS                    │
└─────────────────────────────────────────────────────────────┘
```

### **CLIENT FLOW: Live Tracking (Uber-like)**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CLIENT VIEWS ACTIVE ORDER                                │
│    → "Sites & Shifts" tab → "My Orders" section             │
│    → Active order card with "Track" button                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. LIVE TRACKING SCREEN                                      │
│    → Interactive Map (react-native-maps)                     │
│    → Guard/Vehicle marker (real-time updates)               │
│    → Client location marker                                 │
│    → Route line (if applicable)                             │
│    → Guard info card:                                        │
│       • Name, photo                                          │
│       • Vehicle info (if applicable)                         │
│       • ETA                                                  │
│       • Contact button                                       │
│    → Order status indicator                                  │
│    → Auto-refresh location every 5-10 seconds              │
└─────────────────────────────────────────────────────────────┘
```

### **GUARD FLOW: Service Execution**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. GUARD RECEIVES ASSIGNMENT                                 │
│    → Push notification: "New service order assigned"          │
│    → Guard Dashboard → "My Orders" section                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. ORDER DETAILS SCREEN                                      │
│    → Service type & requirements                             │
│    → Client contact info                                     │
│    → Pickup/dropoff locations                                │
│    → "Start Service" button                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. SERVICE IN PROGRESS                                       │
│    → Location tracking active (automatic)                    │
│    → "Arrived" button (for transportation)                   │
│    → "Complete Service" button                               │
│    → Emergency contact button                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 📱 Screen Flow & Navigation

### **Client Navigation Updates**

#### Updated Client Tab Navigator
```typescript
export type ClientTabParamList = {
  Dashboard: undefined;
  'Sites & Shifts': undefined;  // Enhanced with service ordering
  'My Orders': undefined;        // NEW - Service orders list
  Reports: undefined;
  Guards: undefined;
  Settings: undefined;
};
```

#### New Client Stack Screens
```typescript
export type ClientStackParamList = {
  // ... existing screens ...
  
  // NEW SERVICE ORDERING SCREENS
  RequestService: undefined;                    // Service type selection
  ServiceDetails: { serviceType: ServiceType }; // Date/time/location form
  OrderReview: { orderData: ServiceOrderData }; // Review & confirm
  OrderDetails: { orderId: string };            // View order details
  LiveTracking: { orderId: string };            // Real-time tracking map
  MyOrders: undefined;                           // Orders list screen
};
```

### **Screen Hierarchy**

```
ClientNavigator (Tabs)
├── Dashboard
├── Sites & Shifts
│   └── [Enhanced with "Request Service" button]
├── My Orders ⭐ NEW
│   ├── Active Orders List
│   ├── Past Orders List
│   └── Order Details
│       └── Live Tracking
├── Reports
├── Guards
└── Settings

ClientStackNavigator (Stack)
├── RequestService ⭐ NEW
├── ServiceDetails ⭐ NEW
├── OrderReview ⭐ NEW
├── OrderDetails ⭐ NEW
├── LiveTracking ⭐ NEW
├── MyOrders ⭐ NEW
└── [Existing screens...]
```

---

## 🔧 Backend Implementation

### **New Services**

#### 1. **ServiceOrderService.ts**
```typescript
class ServiceOrderService {
  // Create new service order
  async createServiceOrder(clientId: string, orderData: CreateOrderDto): Promise<ServiceOrder>
  
  // Get client's orders
  async getClientOrders(clientId: string, filters?: OrderFilters): Promise<ServiceOrder[]>
  
  // Get order details
  async getOrderById(orderId: string, userId: string, role: Role): Promise<ServiceOrder>
  
  // Admin: Get all pending orders
  async getPendingOrders(adminId: string): Promise<ServiceOrder[]>
  
  // Admin: Assign guard to order
  async assignGuard(orderId: string, guardId: string, adminId: string): Promise<ServiceOrder>
  
  // Admin: Assign vehicle to order
  async assignVehicle(orderId: string, vehicleId: string, adminId: string): Promise<ServiceOrder>
  
  // Update order status
  async updateOrderStatus(orderId: string, status: OrderStatus, updatedBy: string): Promise<ServiceOrder>
  
  // Cancel order
  async cancelOrder(orderId: string, reason: string, cancelledBy: string): Promise<ServiceOrder>
  
  // Get order tracking data (for live tracking)
  async getOrderTracking(orderId: string): Promise<TrackingData>
}
```

#### 2. **VehicleService.ts**
```typescript
class VehicleService {
  // Register new vehicle
  async registerVehicle(vehicleData: CreateVehicleDto, adminId: string): Promise<Vehicle>
  
  // Get available vehicles
  async getAvailableVehicles(filters?: VehicleFilters): Promise<Vehicle[]>
  
  // Assign vehicle to guard
  async assignVehicleToGuard(vehicleId: string, guardId: string): Promise<Vehicle>
  
  // Update vehicle location (for tracking)
  async updateVehicleLocation(vehicleId: string, location: LocationData): Promise<Vehicle>
  
  // Get vehicle tracking history
  async getVehicleTrackingHistory(vehicleId: string, startTime: Date, endTime: Date): Promise<VehicleTrackingRecord[]>
}
```

#### 3. **EmailNotificationService.ts** (Extend existing)
```typescript
class EmailNotificationService {
  // Send service order notification email
  async sendServiceOrderEmail(order: ServiceOrder, recipientEmail: string): Promise<void>
  
  // Email template for "Body Guard with Vehicle" orders
  private formatServiceOrderEmail(order: ServiceOrder): EmailTemplate
}
```

### **New API Endpoints**

#### Service Orders
```
POST   /api/service-orders              - Create new service order (CLIENT)
GET    /api/service-orders              - Get client's orders (CLIENT)
GET    /api/service-orders/:id          - Get order details (CLIENT/ADMIN)
PUT    /api/service-orders/:id          - Update order (CLIENT - before assignment)
DELETE /api/service-orders/:id          - Cancel order (CLIENT - before assignment)

// Admin endpoints
GET    /api/admin/service-orders        - Get all orders with filters (ADMIN)
POST   /api/admin/service-orders/:id/assign-guard    - Assign guard (ADMIN)
POST   /api/admin/service-orders/:id/assign-vehicle  - Assign vehicle (ADMIN)
PUT    /api/admin/service-orders/:id/status          - Update status (ADMIN)
GET    /api/admin/service-orders/pending             - Get pending orders (ADMIN)

// Tracking
GET    /api/service-orders/:id/tracking - Get live tracking data (CLIENT/ADMIN)
```

#### Vehicles
```
POST   /api/admin/vehicles              - Register vehicle (ADMIN)
GET    /api/admin/vehicles               - List vehicles (ADMIN)
GET    /api/admin/vehicles/:id           - Get vehicle details (ADMIN)
PUT    /api/admin/vehicles/:id           - Update vehicle (ADMIN)
DELETE /api/admin/vehicles/:id           - Deactivate vehicle (ADMIN)
POST   /api/admin/vehicles/:id/assign    - Assign to guard (ADMIN)
GET    /api/admin/vehicles/:id/tracking  - Get tracking history (ADMIN)
```

---

## 📧 Email Notification System

### **Email Trigger**
- **When**: Client submits order with `ServiceType.BODY_GUARD_WITH_VEHICLE`
- **Recipient**: Admin email (configurable via environment variable)
- **Template**: Professional HTML email with order details

### **Email Content Structure**
```html
Subject: New Service Order - Body Guard with Vehicle

Body:
- Order ID
- Service Type: Body Guard with Vehicle
- Client Information:
  • Name
  • Email
  • Phone
- Service Details:
  • Start Date & Time
  • End Date & Time (if specified)
  • Duration
- Location Details:
  • Pickup Address
  • Dropoff Address
- Additional Requirements:
  • Number of Guards
  • Special Instructions
- Action Links:
  • View Order in Admin Dashboard
  • Assign Guard
  • Assign Vehicle
```

### **Implementation**
- Extend existing `otpService.ts` email infrastructure
- Create new `sendServiceOrderEmail()` function
- Use same nodemailer transporter
- Add email template with tracSOpro branding

---

## 🗺️ Live Tracking Implementation

### **Real-time Location Updates**

#### Backend Tracking
- Use existing `TrackingRecord` model for guard location
- Create `VehicleTrackingRecord` for vehicle-specific tracking
- WebSocket service for real-time updates (already exists)
- Location update frequency: Every 5-10 seconds when service is active

#### Frontend Tracking
- Use existing `LocationService` infrastructure
- Extend `InteractiveMapView` component for order tracking
- Real-time map updates via WebSocket
- Show guard/vehicle marker with movement animation
- Display ETA calculation based on current location

### **Tracking Flow**
```
1. Guard starts service → Location tracking begins
2. Backend receives location updates every 5-10 seconds
3. WebSocket broadcasts to:
   - Client (order owner)
   - Admin dashboard
4. Frontend map updates in real-time
5. ETA recalculated based on current position
```

---

## 🔗 Integration with Existing Systems

### **1. Site & Shift System Integration**
- Service orders are **separate** from shift postings
- Service orders = On-demand, immediate services
- Shift postings = Scheduled, recurring security assignments
- Both accessible from "Sites & Shifts" tab (with clear separation)

### **2. Location Tracking Integration**
- Reuse existing `LocationService` and `TrackingRecord` infrastructure
- Extend for vehicle-specific tracking
- Use same WebSocket service for real-time updates

### **3. Payment Integration**
- Service orders can link to payment system (future enhancement)
- Estimated costs displayed during order creation
- Actual costs calculated after service completion

### **4. Notification System**
- Use existing push notification infrastructure
- Notify client when guard assigned
- Notify guard when order assigned
- Notify admin when new order received

---

## 📊 Data Flow Diagrams

### **Order Creation Flow**
```
Client App
    │
    ├─> Select Service Type
    ├─> Enter Details (date, time, location)
    ├─> Submit Order
    │
    ▼
Backend API
    │
    ├─> Validate Order Data
    ├─> Create ServiceOrder Record
    ├─> Set Status: PENDING
    │
    ├─> IF ServiceType = BODY_GUARD_WITH_VEHICLE:
    │   └─> Send Email to Admin
    │
    ├─> Send Push Notification to Admin
    │
    └─> Return Order ID to Client
```

### **Guard Assignment Flow**
```
Admin Dashboard
    │
    ├─> View Pending Orders
    ├─> Select Order
    ├─> View Available Guards
    ├─> Assign Guard
    │
    ▼
Backend API
    │
    ├─> Validate Assignment
    ├─> Update ServiceOrder:
    │   ├─> assignedGuardId
    │   ├─> status: ASSIGNED
    │   └─> assignedAt timestamp
    │
    ├─> Send Push Notification to:
    │   ├─> Client (Order assigned)
    │   └─> Guard (New assignment)
    │
    └─> Return Updated Order
```

### **Live Tracking Flow**
```
Guard App (Active Service)
    │
    ├─> Location Service Active
    ├─> Send Location Every 5-10s
    │
    ▼
Backend API
    │
    ├─> Receive Location Update
    ├─> Store in VehicleTrackingRecord
    ├─> Broadcast via WebSocket:
    │   ├─> Client App (Live Tracking Screen)
    │   └─> Admin Dashboard
    │
    └─> Calculate ETA
```

---

## 🎨 UI/UX Design Considerations

### **Service Selection Screen**
- Large, clear service type cards
- Icons for each service type
- "Body Guard with Vehicle" highlighted/prominent
- Smooth animations

### **Order Details Form**
- Step-by-step wizard (optional)
- Date/time picker with validation
- Map integration for location selection
- Clear visual feedback

### **Live Tracking Screen**
- Full-screen map view
- Smooth marker animations
- Real-time ETA updates
- Contact guard button
- Order status indicator

### **Admin Order Management**
- Dashboard widget showing pending orders count
- Quick filters (by service type, date, status)
- Drag-and-drop assignment (future enhancement)
- Bulk actions (future enhancement)

---

## 🔒 Security & Permissions

### **Access Control**
- **Clients**: Can create orders, view their own orders, track their orders
- **Guards**: Can view assigned orders, update order status (start/complete)
- **Admins**: Full access - view all orders, assign guards/vehicles, update status
- **Super Admins**: Full access + vehicle management

### **Data Validation**
- Validate service dates (not in past)
- Validate location coordinates
- Validate guard availability before assignment
- Validate vehicle availability before assignment

---

## 📈 Future Enhancements (Out of Scope for Now)

1. **Automated Guard Matching**
   - AI-based guard selection based on:
     - Proximity to pickup location
     - Guard ratings
     - Service type expertise
     - Availability

2. **Pricing Engine**
   - Dynamic pricing based on:
     - Service type
     - Duration
     - Distance (for transportation)
     - Time of day
     - Demand

3. **Rating System**
   - Client rates guard after service
   - Guard rates client
   - Display ratings in assignment screen

4. **Recurring Orders**
   - Schedule recurring services
   - Weekly/monthly subscriptions

5. **Multi-stop Transportation**
   - Multiple pickup/dropoff points
   - Route optimization

---

## ✅ Implementation Checklist

### **Phase 1: Database & Backend Foundation**
- [ ] Add ServiceOrder model to Prisma schema
- [ ] Add Vehicle model to Prisma schema
- [ ] Add VehicleTrackingRecord model
- [ ] Add OrderUpdate model
- [ ] Run database migrations
- [ ] Create ServiceOrderService
- [ ] Create VehicleService
- [ ] Extend EmailNotificationService
- [ ] Create API endpoints
- [ ] Add Swagger documentation

### **Phase 2: Email Integration**
- [ ] Create email template for service orders
- [ ] Implement email sending for "Body Guard with Vehicle"
- [ ] Test email delivery
- [ ] Configure admin email in environment variables

### **Phase 3: Frontend - Client Side**
- [ ] Create RequestServiceScreen
- [ ] Create ServiceDetailsScreen
- [ ] Create OrderReviewScreen
- [ ] Create MyOrdersScreen
- [ ] Create OrderDetailsScreen
- [ ] Create LiveTrackingScreen
- [ ] Update ClientNavigator (add "My Orders" tab)
- [ ] Update ClientStackNavigator (add new screens)
- [ ] Create service order Redux slice
- [ ] Create API service functions
- [ ] Integrate with existing location services

### **Phase 4: Frontend - Admin Side**
- [ ] Create AdminServiceOrdersScreen
- [ ] Create OrderAssignmentScreen
- [ ] Create VehicleManagementScreen
- [ ] Update AdminNavigator
- [ ] Add order management to admin dashboard
- [ ] Create admin Redux slices

### **Phase 5: Real-time Tracking**
- [ ] Extend WebSocket service for order tracking
- [ ] Implement vehicle location updates
- [ ] Create live tracking map component
- [ ] Add ETA calculations
- [ ] Test real-time updates

### **Phase 6: Testing & Polish**
- [ ] Unit tests for services
- [ ] Integration tests for API endpoints
- [ ] E2E tests for order flow
- [ ] Performance testing for tracking
- [ ] UI/UX polish
- [ ] Error handling improvements

---

## 🚀 Next Steps

1. **Review this strategy document**
2. **Confirm requirements and flow**
3. **Approve database schema changes**
4. **Begin Phase 1 implementation**

---

## 📝 Notes

- This strategy maintains backward compatibility with existing shift posting system
- Service orders are separate from shift postings (different use cases)
- Email notifications are specifically for "Body Guard with Vehicle" orders
- Live tracking uses existing infrastructure (minimal new code needed)
- Admin maintains full control over guard/vehicle assignment

---

**Document Version**: 1.0  
**Last Updated**: November 2025  
**Status**: Awaiting Review & Approval





