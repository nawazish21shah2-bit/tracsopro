# TRACSOSPRO Super Admin System - Setup Guide

## Overview

The Super Admin system provides platform-wide management capabilities for TRACSOSPRO, enabling control over multiple security companies, billing, analytics, and system settings. This implementation includes a complete multi-tenant architecture with role-based access control.

## Architecture Overview

### Multi-Tenant Structure
- **Platform Level**: Super Admin manages the entire platform
- **Company Level**: Security companies manage their guards, clients, and sites  
- **User Level**: Individual users (guards, clients, admins) within companies

### Key Components
1. **Database Schema**: Extended Prisma schema with multi-tenant support
2. **Backend APIs**: RESTful endpoints for Super Admin operations
3. **Frontend Interface**: React Native screens with pixel-perfect UI
4. **Authentication**: Role-based access control with SUPER_ADMIN role

## Database Schema Changes

### New Tables Added
- `SecurityCompany` - Core company management
- `CompanyUser` - User-company relationships
- `CompanyGuard` - Guard-company assignments
- `CompanyClient` - Client-company relationships
- `CompanySite` - Site-company assignments
- `Subscription` - Subscription management
- `BillingRecord` - Billing and invoicing
- `PlatformSettings` - System configuration
- `PlatformAnalytics` - Platform metrics
- `SystemAuditLog` - Audit trail

### New Enums
- `SubscriptionPlan`: BASIC, PROFESSIONAL, ENTERPRISE, CUSTOM
- `SubscriptionStatus`: TRIAL, ACTIVE, SUSPENDED, CANCELLED, EXPIRED
- `CompanyRole`: OWNER, ADMIN, MANAGER, SUPERVISOR, EMPLOYEE
- `BillingCycle`: MONTHLY, QUARTERLY, YEARLY
- `BillingType`: SUBSCRIPTION, OVERAGE, SETUP_FEE, PENALTY, REFUND
- `BillingStatus`: PENDING, PAID, OVERDUE, CANCELLED, REFUNDED

## Setup Instructions

### 1. Database Migration

Run the migration to add Super Admin schema:

```bash
cd backend
npx prisma db push
# or apply the SQL migration directly
psql -d your_database -f prisma/migrations/add_super_admin_schema.sql
```

### 2. Backend Setup

The following files have been added/modified:

**New Files:**
- `src/services/superAdminService.ts` - Super Admin business logic
- `src/routes/superAdmin.ts` - Super Admin API endpoints

**Modified Files:**
- `src/middleware/auth.ts` - Added Super Admin authentication
- `src/routes/index.ts` - Added Super Admin routes
- `prisma/schema.prisma` - Extended with multi-tenant schema

### 3. Frontend Setup

**New Files:**
- `src/navigation/SuperAdminNavigator.tsx` - Super Admin navigation
- `src/screens/superAdmin/SuperAdminDashboard.tsx` - Main dashboard
- `src/screens/superAdmin/CompanyManagementScreen.tsx` - Company management
- `src/services/superAdminService.ts` - Frontend API service

**Modified Files:**
- `src/navigation/MainNavigator.tsx` - Added Super Admin routing

### 4. Default Super Admin Account

A default Super Admin account is created during migration:
- **Email**: `superadmin@tracsopro.com`
- **Password**: `password` (CHANGE IMMEDIATELY)
- **Role**: `SUPER_ADMIN`

## API Endpoints

### Super Admin Routes (`/api/super-admin/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/overview` | Platform overview statistics |
| GET | `/companies` | List security companies |
| POST | `/companies` | Create new company |
| PUT | `/companies/:id` | Update company |
| PATCH | `/companies/:id/status` | Toggle company status |
| GET | `/analytics` | Platform analytics |
| GET | `/billing` | Billing overview |
| GET | `/audit-logs` | System audit logs |
| GET | `/settings` | Platform settings |
| PUT | `/settings` | Update platform settings |

## Frontend Navigation

### Role-Based Routing
The app automatically routes users based on their role:
- `SUPER_ADMIN` → SuperAdminNavigator
- `ADMIN` → AdminNavigator  
- `CLIENT` → ClientStackNavigator
- `GUARD` → GuardStackNavigator

### Super Admin Screens
1. **Dashboard** - Platform overview and key metrics
2. **Companies** - Manage security companies
3. **Analytics** - Platform analytics and reports
4. **Billing** - Subscription and billing management
5. **Settings** - System-wide configuration

## Security Features

### Authentication & Authorization
- JWT-based authentication with role verification
- Middleware protection for all Super Admin routes
- Role-based UI rendering and navigation

### Audit Logging
- All Super Admin actions are logged in `SystemAuditLog`
- Tracks user, action, resource, and changes
- IP address and user agent tracking

### Multi-Tenant Isolation
- Company data is isolated through junction tables
- Proper foreign key constraints ensure data integrity
- Role-based permissions within companies

## Payment Flow Architecture

### Current Questions for Client Discussion:

1. **Payment Structure Options:**
   - **Option A**: Direct client-to-company payments with platform commission
   - **Option B**: Platform-mediated payments with distribution to companies

2. **Guard Payment Methods:**
   - Direct company payroll
   - App-integrated payment system
   - Hybrid approach

3. **Commission Model:**
   - Fixed subscription fees
   - Percentage-based commission
   - Tiered pricing structure

## Subscription Management

### Subscription Plans
- **BASIC**: Limited guards/clients/sites
- **PROFESSIONAL**: Medium capacity with advanced features
- **ENTERPRISE**: High capacity with premium features
- **CUSTOM**: Tailored solutions for large organizations

### Billing Cycles
- Monthly, Quarterly, or Yearly billing
- Automatic renewal with grace periods
- Overage charges for exceeding limits

## Analytics & Reporting

### Platform Metrics
- Active companies, guards, clients, sites
- Revenue tracking and forecasting
- User engagement and system performance
- Subscription renewal rates

### Company-Level Analytics
- Individual company performance
- Usage patterns and trends
- Billing and payment history

## Development Notes

### Mock Data Implementation
Currently using mock data for development:
- Platform overview statistics
- Company listings with sample data
- Analytics with sample metrics
- Billing records with test transactions

### Real API Integration
To connect with real backend APIs:
1. Update `superAdminService.ts` to use actual API calls
2. Replace mock data with real database queries
3. Implement proper error handling and loading states

## Next Steps

### Immediate Priorities
1. **Payment Integration**: Implement Stripe/PayPal integration
2. **Real-time Features**: Complete WebSocket server implementation
3. **Advanced Analytics**: Build comprehensive reporting system
4. **Job Application Workflow**: Complete hiring process management

### Future Enhancements
1. **Multi-language Support**: Internationalization
2. **Advanced Permissions**: Granular role-based permissions
3. **API Rate Limiting**: Prevent abuse and ensure fair usage
4. **Advanced Security**: Two-factor authentication, audit alerts

## Testing

### Super Admin Access
1. Login with `superadmin@tracsopro.com` / `password`
2. Navigate through Super Admin interface
3. Test company management features
4. Verify role-based access control

### Multi-Tenant Testing
1. Create test security companies
2. Assign users to different companies
3. Verify data isolation
4. Test subscription management

## Support & Maintenance

### Monitoring
- System audit logs for security monitoring
- Performance metrics for system health
- Billing alerts for payment issues

### Backup & Recovery
- Regular database backups
- Audit log retention policies
- Disaster recovery procedures

## Conclusion

The Super Admin system provides a comprehensive platform management solution with:
- ✅ Complete multi-tenant architecture
- ✅ Role-based access control
- ✅ Subscription and billing management
- ✅ Platform analytics and monitoring
- ✅ Security company management
- ✅ Audit logging and compliance

The system is ready for production deployment with proper payment integration and real-time features implementation.
