# Architecture Summary - Current vs Recommended

## 🔴 CURRENT STATE (PROBLEMATIC)

### Role System
```
User.role: GUARD | ADMIN | CLIENT | SUPER_ADMIN
CompanyUser.role: OWNER | ADMIN | MANAGER | SUPERVISOR | EMPLOYEE

❌ No clear relationship between these
❌ Frontend expects lowercase, backend uses uppercase
❌ SUPER_ADMIN missing from frontend mapping
```

### User Registration
```
┌─────────────────────────────────────┐
│  TWO SEPARATE FLOWS                 │
├─────────────────────────────────────┤
│ 1. POST /api/auth/register          │
│    - Anyone can register            │
│    - Creates User + Guard/Client    │
│    - Email verification required    │
│                                     │
│ 2. POST /api/admin/users            │
│    - Admin only                     │
│    - Creates User + any role        │
│    - Email verification?            │
└─────────────────────────────────────┘

❌ No clear policy on who can create users
❌ Admin can self-register (security issue)
```

### Shift Creation (TRIPLE REDUNDANCY)
```
┌─────────────────────────────────────────────┐
│  THREE DIFFERENT SYSTEMS                    │
├─────────────────────────────────────────────┤
│ 1. Job Board Model                          │
│    Client → ShiftPosting → Application      │
│    → ShiftAssignment                        │
│    Models: ShiftPosting, ShiftApplication,  │
│            ShiftAssignment                  │
│                                             │
│ 2. Direct Assignment                        │
│    Admin → Shift (direct)                   │
│    Model: Shift                             │
│                                             │
│ 3. Generic Creation                         │
│    POST /api/shifts (unclear auth)         │
│    Model: Shift                             │
└─────────────────────────────────────────────┘

❌ Three different models for same concept
❌ No relationship between systems
❌ Guard sees conflicting data
❌ Client may not see admin-created shifts
```

### Database Schema Issues
```
ShiftPosting (Job Board)
  ├─ clientId
  ├─ siteId
  └─ applications → ShiftApplication → ShiftAssignment

Shift (Direct Assignment)
  ├─ guardId
  ├─ siteId? (optional)
  ├─ clientId? (optional)
  └─ (no relationship to ShiftPosting)

❌ No connection between ShiftPosting and Shift
❌ Admin can create Shift without client knowing
❌ Guard may have shifts from both systems
```

---

## ✅ RECOMMENDED STATE (CLEAN)

### Role System
```
User.role: GUARD | ADMIN | CLIENT | SUPER_ADMIN
  └─ Consistent enum (uppercase in backend)
  └─ Mapped to lowercase in frontend
  └─ All roles handled in frontend

CompanyUser.role: OWNER | ADMIN | MANAGER | SUPERVISOR | EMPLOYEE
  └─ Only used for multi-tenant companies
  └─ Clear separation from User.role
```

### User Registration (UNIFIED)
```
┌─────────────────────────────────────┐
│  SINGLE CLEAR POLICY                │
├─────────────────────────────────────┤
│ Public Registration:                │
│   POST /api/auth/register           │
│   - GUARD ✅                        │
│   - CLIENT ✅                       │
│   - ADMIN ❌ (rejected)            │
│   - SUPER_ADMIN ❌ (rejected)      │
│                                     │
│ Admin Creation:                     │
│   POST /api/admin/users             │
│   - Any role ✅                     │
│   - Skip email verification ✅      │
└─────────────────────────────────────┘
```

### Shift Creation (SINGLE MODEL - Job Board)
```
┌─────────────────────────────────────────────┐
│  UNIFIED JOB BOARD MODEL                  │
├─────────────────────────────────────────────┤
│ Client or Admin creates:                   │
│   POST /api/sites/:id/shift-postings       │
│   POST /api/admin/shift-postings          │
│                                             │
│ Creates: ShiftPosting                      │
│   ├─ clientId (required)                  │
│   ├─ siteId (required)                     │
│   ├─ createdBy (admin userId if admin)     │
│   └─ applications → ShiftApplication       │
│                                             │
│ Guard applies:                             │
│   POST /api/shift-postings/:id/apply       │
│   Creates: ShiftApplication                │
│                                             │
│ Client/Admin approves:                    │
│   POST /api/applications/:id/approve       │
│   Creates: ShiftAssignment                 │
│                                             │
│ Guard checks in:                           │
│   POST /api/shifts/:id/check-in           │
│   (Uses ShiftAssignment.id as shiftId)    │
└─────────────────────────────────────────────┘

✅ Single source of truth
✅ All parties see same data
✅ Clear workflow
```

### Database Schema (CLEAN)
```
ShiftPosting (Single Model)
  ├─ clientId (required)
  ├─ siteId (required)
  ├─ createdBy (userId, nullable - admin if set)
  ├─ applications → ShiftApplication
  └─ assignments → ShiftAssignment

ShiftAssignment (Result of Approval)
  ├─ shiftPostingId (required)
  ├─ guardId (required)
  ├─ siteId (required)
  ├─ status: ASSIGNED | IN_PROGRESS | COMPLETED
  └─ checkInTime, checkOutTime

Shift (Legacy - Remove or repurpose)
  └─ Consider removing if not needed
  └─ OR use only for direct admin assignments
  └─ But ensure visibility to client
```

---

## 📊 COMPARISON TABLE

| Aspect | Current (❌) | Recommended (✅) |
|--------|-------------|------------------|
| **Shift Models** | 3 different models | 1 unified model |
| **User Registration** | 2 separate flows | 1 clear policy |
| **Role System** | Inconsistent mapping | Consistent everywhere |
| **Admin Shift Creation** | Creates Shift directly | Creates ShiftPosting |
| **Client Visibility** | May not see admin shifts | Sees all shifts for sites |
| **Guard View** | Conflicting data sources | Single source of truth |
| **Data Consistency** | Low (isolated systems) | High (unified model) |

---

## 🎯 KEY CHANGES NEEDED

### 1. Remove Redundant Shift Creation
```typescript
// REMOVE:
POST /api/admin/shifts (direct Shift creation)

// KEEP:
POST /api/sites/:id/shift-postings (client creates)
POST /api/admin/shift-postings (admin creates for client)
```

### 2. Unify User Registration
```typescript
// Public registration - REJECT admin roles
if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
  throw new ValidationError('Admin roles must be created by administrator');
}

// Admin creation - ALLOW all roles
// (no restriction)
```

### 3. Add createdBy Tracking
```prisma
model ShiftPosting {
  createdBy String?  // Admin userId if admin created
  creator   User?    @relation(...)
}
```

### 4. Fix Role Mapping
```typescript
// Frontend - Add SUPER_ADMIN
const roleMap = {
  ADMIN: 'admin',
  GUARD: 'guard',
  CLIENT: 'client',
  SUPER_ADMIN: 'super_admin', // ADD THIS
};
```

---

## 🔄 MIGRATION PATH

### Step 1: Choose Model
- ✅ Keep Job Board (ShiftPosting → ShiftAssignment)
- ❌ Remove Direct Assignment (Shift creation)

### Step 2: Update Admin Shift Creation
- Change admin to create ShiftPosting instead of Shift
- Ensure clientId is set (admin creates on behalf of client)

### Step 3: Migrate Existing Data
- If any direct Shifts exist, convert to ShiftPosting → ShiftAssignment
- Or mark as legacy and handle separately

### Step 4: Update Frontend
- Remove calls to `/api/admin/shifts`
- Use shift posting endpoints instead
- Update UI to show job board flow

---

## 📈 BENEFITS OF RECOMMENDED STATE

1. **Single Source of Truth**
   - One model for shifts
   - No data conflicts
   - Easier to query and report

2. **Clear Workflow**
   - Client posts → Guard applies → Approval → Assignment
   - Everyone understands the flow
   - Predictable behavior

3. **Better Visibility**
   - Clients see all shifts for their sites
   - Admins see all shifts they created
   - Guards see all their applications and assignments

4. **Easier Maintenance**
   - Less code to maintain
   - Fewer edge cases
   - Clearer business logic

5. **Scalability**
   - Easy to add features (notifications, analytics)
   - Clear data model for reporting
   - Better for multi-tenant future

---

## ⚠️ RISKS OF CURRENT STATE

1. **Data Inconsistency**
   - Guards may have shifts from multiple systems
   - Clients may not see all shifts
   - Reports may be inaccurate

2. **User Confusion**
   - Unclear which system to use
   - Different UIs for same concept
   - Inconsistent behavior

3. **Maintenance Burden**
   - Three systems to maintain
   - More bugs to fix
   - Harder to add features

4. **Security Issues**
   - Admin can create shifts without client approval
   - Role confusion may allow unauthorized access
   - Self-registration of admin roles

---

## ✅ FINAL RECOMMENDATION

**Adopt the Job Board Model (ShiftPosting → ShiftAssignment)**

**Reasons:**
1. More flexible for B2B model
2. Client has control and visibility
3. Guards can choose shifts
4. Better audit trail
5. Easier to add features (notifications, matching, etc.)

**Action:**
- Remove direct Shift creation endpoints
- Update admin to create ShiftPosting
- Ensure all shifts go through application → approval flow
- Migrate existing direct Shifts if any

---

**This architecture is cleaner, more maintainable, and better suited for a guard tracking B2B platform.**



