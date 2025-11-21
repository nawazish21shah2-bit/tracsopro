# Admin Subscription Payment System - Implementation Complete

## Overview
The payment system has been updated to focus on **subscription payments from Admins (security companies/individuals) to Super Admin (platform)**. This replaces the previous client-to-company payment flow.

## Key Changes

### 1. Backend Updates

#### Authentication Middleware (`backend/src/middleware/auth.ts`)
- Added `securityCompanyId` to `AuthRequest` interface
- Updated authentication to automatically extract `securityCompanyId` from `CompanyUser` relationship for ADMIN users
- This allows payment controllers to access the admin's security company without requiring it in the request body

#### New Admin Routes (`backend/src/routes/admin.ts`)
- **GET `/api/admin/company`**: Get admin's security company information
- **GET `/api/admin/subscription`**: Get admin's current subscription details

#### Payment Controller Updates (`backend/src/controllers/paymentController.ts`)
- `createSubscriptionCheckout`: Now uses `req.securityCompanyId` from auth middleware
- `getBillingPortal`: Now uses `req.securityCompanyId` from auth middleware
- Both methods automatically get the security company ID from the authenticated admin user

### 2. Frontend Updates

#### New Admin Subscription Screen (`GuardTrackingApp/src/screens/admin/AdminSubscriptionScreen.tsx`)
- Complete subscription management interface for admins
- Features:
  - View current subscription status and plan
  - Browse available subscription plans (monthly/yearly)
  - Subscribe to new plans via Stripe Checkout
  - Access Stripe Billing Portal for payment method management
  - Display subscription renewal dates and status

#### Admin Settings Screen Update (`GuardTrackingApp/src/screens/admin/AdminSettingsScreen.tsx`)
- Added "Subscription & Billing" option that navigates to `AdminSubscriptionScreen`

#### Admin Navigator Update (`GuardTrackingApp/src/navigation/AdminNavigator.tsx`)
- Added `AdminSubscription` screen to the stack navigator
- Updated type definitions to include the new screen

#### API Service Update (`GuardTrackingApp/src/services/api.ts`)
- Added public methods: `get()`, `post()`, `put()`, `patch()`, `delete()`
- These methods wrap the internal axios instance and include authentication headers

### 3. Payment Flow

#### Subscription Checkout Flow
1. Admin navigates to Settings → Subscription & Billing
2. Admin views current subscription and available plans
3. Admin selects a plan and billing cycle (monthly/yearly)
4. Admin clicks "Subscribe" → Creates Stripe Checkout Session
5. Admin is redirected to Stripe Checkout (web browser)
6. Admin completes payment on Stripe
7. Stripe webhook notifies backend of subscription creation
8. Backend updates `SecurityCompany` subscription status

#### Billing Portal Flow
1. Admin clicks "Manage Billing" button
2. Frontend calls `/api/payments/portal` (securityCompanyId from auth)
3. Backend creates Stripe Billing Portal session
4. Admin is redirected to Stripe Billing Portal (web browser)
5. Admin can:
   - Update payment methods
   - View invoices
   - Update billing information
   - Cancel subscription

## API Endpoints

### Admin Endpoints
- `GET /api/admin/company` - Get admin's security company
- `GET /api/admin/subscription` - Get admin's subscription

### Payment Endpoints (Admin Access)
- `GET /api/payments/plans` - Get available subscription plans
- `POST /api/payments/subscriptions/checkout` - Create subscription checkout session
- `GET /api/payments/portal` - Get billing portal session URL

## Database Schema

The system uses the existing `SecurityCompany` model with:
- `subscriptionPlan`: BASIC, PROFESSIONAL, ENTERPRISE, CUSTOM
- `subscriptionStatus`: TRIAL, ACTIVE, SUSPENDED, CANCELLED, EXPIRED
- `subscriptionStartDate`: When subscription started
- `subscriptionEndDate`: When subscription expires
- Related `Subscription` model for Stripe subscription details

## Security Considerations

1. **Authentication**: All endpoints require JWT authentication
2. **Authorization**: Subscription endpoints require ADMIN or SUPER_ADMIN role
3. **Company Association**: `securityCompanyId` is automatically extracted from the authenticated user's `CompanyUser` relationship
4. **No Manual ID Passing**: Admins cannot specify a different company ID - it's always their own company

## Testing Checklist

- [ ] Admin can view their current subscription
- [ ] Admin can view available plans
- [ ] Admin can create subscription checkout session
- [ ] Stripe Checkout redirects correctly
- [ ] Admin can access billing portal
- [ ] Subscription status updates after payment
- [ ] Error handling for missing company association
- [ ] Error handling for invalid plans

## Next Steps

1. **Stripe Configuration**: Ensure Stripe API keys and webhook endpoints are configured
2. **Webhook Implementation**: Complete webhook handler to update subscription status
3. **Plan Configuration**: Configure Stripe Price IDs for each plan in environment variables
4. **Testing**: Test end-to-end subscription flow with Stripe test mode
5. **UI Polish**: Add loading states and error messages
6. **Documentation**: Update API documentation with new endpoints

## Files Modified

### Backend
- `backend/src/middleware/auth.ts` - Added securityCompanyId extraction
- `backend/src/routes/admin.ts` - New admin routes
- `backend/src/routes/index.ts` - Added admin routes
- `backend/src/controllers/paymentController.ts` - Updated to use req.securityCompanyId

### Frontend
- `GuardTrackingApp/src/screens/admin/AdminSubscriptionScreen.tsx` - New screen
- `GuardTrackingApp/src/screens/admin/AdminSettingsScreen.tsx` - Added subscription link
- `GuardTrackingApp/src/navigation/AdminNavigator.tsx` - Added subscription screen
- `GuardTrackingApp/src/services/api.ts` - Added public HTTP methods

## Notes

- The payment system is now focused exclusively on platform subscriptions (Admin → Super Admin)
- Client-to-company payments are no longer the primary focus
- All subscription management is done through Stripe's hosted pages (Checkout and Billing Portal)
- The system automatically associates admins with their security company through the `CompanyUser` relationship

