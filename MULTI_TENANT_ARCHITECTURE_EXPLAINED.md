# Multi-Tenant Architecture Explained
## How Guards, Clients, and Admins are Linked

---

## 🏗️ CURRENT ARCHITECTURE

### Multi-Tenant Structure

```
┌─────────────────────────────────────────────────────────┐
│              PLATFORM LEVEL (Super Admin)              │
│  - Manages all SecurityCompanies                       │
│  - Platform-wide settings                              │
└─────────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
│ Security     │ │ Security     │ │ Security     │
│ Company A    │ │ Company B    │ │ Company C    │
│              │ │              │ │              │
│ - Guards     │ │ - Guards     │ │ - Guards     │
│ - Clients    │ │ - Clients    │ │ - Clients    │
│ - Sites      │ │ - Sites      │ │ - Sites      │
│ - Admins     │ │ - Admins     │ │ - Admins     │
└──────────────┘ └──────────────┘ └──────────────┘
```

---

## 📊 DATABASE RELATIONSHIPS

### Core Models

#### 1. User (Platform-Level)
```prisma
model User {
  id        String   @id
  email     String   @unique
  role      Role     // GUARD, CLIENT, ADMIN, SUPER_ADMIN
  // ... other fields
  
  guard         Guard?        // 1:1 if role = GUARD
  client        Client?       // 1:1 if role = CLIENT
  companyUsers  CompanyUser[]  // Many-to-many with SecurityCompanies
}
```

**Key Point:** User exists at platform level, NOT tied to any company initially.

#### 2. Guard (Platform-Level)
```prisma
model Guard {
  id         String   @id
  userId     String   @unique
  employeeId String   @unique
  // ... guard-specific fields
  
  user          User            @relation(...)
  companyGuards CompanyGuard[]  // Links to SecurityCompanies
  shifts        Shift[]
}
```

**Key Point:** Guard profile exists independently, linked to companies via `CompanyGuard`.

#### 3. Client (Platform-Level)
```prisma
model Client {
  id          String   @id
  userId      String   @unique
  accountType AccountType
  // ... client-specific fields
  
  user           User             @relation(...)
  companyClients CompanyClient[]  // Links to SecurityCompanies
  sites          Site[]
  shifts         Shift[]
}
```

**Key Point:** Client profile exists independently, linked to companies via `CompanyClient`.

#### 4. SecurityCompany (Tenant)
```prisma
model SecurityCompany {
  id                String   @id
  name              String
  email             String   @unique
  // ... company info
  
  users    CompanyUser[]     // Admins/managers in this company
  guards   CompanyGuard[]    // Guards assigned to this company
  clients  CompanyClient[]   // Clients assigned to this company
  sites    CompanySite[]     // Sites managed by this company
}
```

#### 5. Junction Tables (The Links)

**CompanyGuard** - Links Guard to SecurityCompany
```prisma
model CompanyGuard {
  id              String   @id
  securityCompanyId String  // Which company
  guardId         String     // Which guard
  employeeNumber  String?   // Company-specific employee ID
  department      String?   // Company-specific department
  hourlyRate      Float?    // Company-specific rate
  isActive        Boolean   @default(true)
  
  securityCompany SecurityCompany @relation(...)
  guard           Guard          @relation(...)
  
  @@unique([securityCompanyId, guardId])  // One guard can be in multiple companies
}
```

**CompanyClient** - Links Client to SecurityCompany
```prisma
model CompanyClient {
  id              String   @id
  securityCompanyId String  // Which company
  clientId        String     // Which client
  contractStartDate DateTime?
  contractEndDate DateTime?
  contractValue   Float?
  isActive        Boolean   @default(true)
  
  securityCompany SecurityCompany @relation(...)
  client          Client          @relation(...)
  
  @@unique([securityCompanyId, clientId])  // One client can work with multiple companies
}
```

**CompanyUser** - Links Admin/Manager to SecurityCompany
```prisma
model CompanyUser {
  id              String   @id
  securityCompanyId String  // Which company
  userId          String     // Which user (ADMIN role)
  role            CompanyRole  // OWNER, ADMIN, MANAGER, SUPERVISOR
  isActive        Boolean   @default(true)
  
  securityCompany SecurityCompany @relation(...)
  user            User            @relation(...)
  
  @@unique([securityCompanyId, userId])
}
```

---

## ⚠️ THE PROBLEM: Self-Registration Gap

### Current Flow (Self-Registration)

```
1. Guard/Client registers
   ↓
2. User created (platform-level)
   ↓
3. Guard/Client profile created
   ↓
4. ❌ NO LINK TO ANY SECURITY COMPANY
   ↓
5. Guard/Client exists but is "orphaned"
   ↓
6. Admin must manually assign to company
```

### What Happens Now:

**When Guard Self-Registers:**
```typescript
// backend/src/services/authService.ts:28-131
async register(data: RegisterData) {
  // Creates User
  const user = await prisma.user.create({...});
  
  // Creates Guard profile
  if (user.role === 'GUARD') {
    await prisma.guard.create({
      userId: user.id,
      employeeId: `EMP${Date.now()}`,
    });
  }
  
  // ❌ NO CompanyGuard created!
  // Guard is NOT linked to any SecurityCompany
}
```

**Result:**
- Guard can login ✅
- Guard has profile ✅
- Guard is NOT assigned to any company ❌
- Guard cannot see company-specific data ❌
- Admin must manually assign guard to company

---

## 🔧 SOLUTIONS

### Solution 1: Invitation-Based Registration (Recommended)

**Flow:**
```
1. Admin creates invitation with company code
   ↓
2. Guard/Client registers with invitation code
   ↓
3. Automatically linked to SecurityCompany
```

**Implementation:**
```typescript
// Add Invitation model
model Invitation {
  id              String   @id
  securityCompanyId String
  email           String
  role            Role     // GUARD or CLIENT
  invitationCode  String   @unique
  expiresAt       DateTime
  usedAt          DateTime?
  createdAt       DateTime @default(now())
  
  securityCompany SecurityCompany @relation(...)
}

// Update registration
async register(data: RegisterData & { invitationCode?: string }) {
  // ... create user and profile ...
  
  // If invitation code provided
  if (data.invitationCode) {
    const invitation = await prisma.invitation.findUnique({
      where: { invitationCode: data.invitationCode }
    });
    
    if (invitation && !invitation.usedAt) {
      // Link to company
      if (user.role === 'GUARD') {
        await prisma.companyGuard.create({
          securityCompanyId: invitation.securityCompanyId,
          guardId: guard.id,
        });
      } else if (user.role === 'CLIENT') {
        await prisma.companyClient.create({
          securityCompanyId: invitation.securityCompanyId,
          clientId: client.id,
        });
      }
      
      // Mark invitation as used
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() }
      });
    }
  }
}
```

---

### Solution 2: Admin Assignment After Registration

**Flow:**
```
1. Guard/Client self-registers (orphaned)
   ↓
2. Admin sees unassigned guards/clients
   ↓
3. Admin assigns to SecurityCompany
   ↓
4. CompanyGuard/CompanyClient created
```

**Implementation:**
```typescript
// Admin endpoint to assign guard to company
POST /api/admin/companies/:companyId/guards
{
  "guardId": "guard-uuid",
  "employeeNumber": "EMP001",
  "department": "Patrol",
  "hourlyRate": 25.00
}

// Creates CompanyGuard record
await prisma.companyGuard.create({
  securityCompanyId: companyId,
  guardId: guardId,
  employeeNumber: employeeNumber,
  department: department,
  hourlyRate: hourlyRate,
});
```

**Current Status:** This likely exists but needs verification.

---

### Solution 3: Company Code During Registration

**Flow:**
```
1. Admin provides company code to guards/clients
   ↓
2. Guard/Client enters company code during registration
   ↓
3. Automatically linked
```

**Implementation:**
```typescript
// Add companyCode to SecurityCompany
model SecurityCompany {
  // ... existing fields
  companyCode String @unique  // e.g., "SEC-ABC123"
}

// Update registration
async register(data: RegisterData & { companyCode?: string }) {
  // ... create user and profile ...
  
  if (data.companyCode) {
    const company = await prisma.securityCompany.findUnique({
      where: { companyCode: data.companyCode }
    });
    
    if (company) {
      // Link to company
      if (user.role === 'GUARD') {
        await prisma.companyGuard.create({
          securityCompanyId: company.id,
          guardId: guard.id,
        });
      }
      // ... similar for client
    }
  }
}
```

---

### Solution 4: Email Domain Matching

**Flow:**
```
1. SecurityCompany has email domain (e.g., "@securitycorp.com")
   ↓
2. Guard/Client registers with email from that domain
   ↓
3. Automatically linked to matching company
```

**Implementation:**
```typescript
// Add emailDomain to SecurityCompany
model SecurityCompany {
  // ... existing fields
  emailDomain String?  // e.g., "securitycorp.com"
}

// Update registration
async register(data: RegisterData) {
  // ... create user and profile ...
  
  // Extract domain from email
  const emailDomain = data.email.split('@')[1];
  
  // Find company with matching domain
  const company = await prisma.securityCompany.findFirst({
    where: { emailDomain: emailDomain }
  });
  
  if (company) {
    // Auto-link
    if (user.role === 'GUARD') {
      await prisma.companyGuard.create({
        securityCompanyId: company.id,
        guardId: guard.id,
      });
    }
  }
}
```

---

## 🎯 RECOMMENDED APPROACH

### Hybrid: Invitation + Manual Assignment

**For Guards:**
- **Option A:** Admin creates invitation → Guard registers with code → Auto-linked
- **Option B:** Guard self-registers → Admin assigns to company manually

**For Clients:**
- **Option A:** Admin creates invitation → Client registers with code → Auto-linked
- **Option B:** Client self-registers → Admin assigns to company manually

**Why:**
- ✅ Flexible (supports both flows)
- ✅ Secure (admin controls assignments)
- ✅ Scalable (works for any number of companies)

---

## 📝 CURRENT STATE ANALYSIS

### What Works:
- ✅ Multi-tenant architecture exists
- ✅ Junction tables (CompanyGuard, CompanyClient) exist
- ✅ Guards/Clients can self-register
- ✅ User and profile creation works

### What's Missing:
- ❌ Auto-linking during self-registration
- ❌ Invitation system
- ❌ Company code system
- ❌ Admin UI to assign guards/clients to companies
- ❌ View of unassigned guards/clients

---

## 🔨 IMPLEMENTATION PRIORITY

### Phase 1: Quick Fix (2 hours)
1. Add admin endpoint to assign guards/clients to companies
2. Add admin UI to view unassigned guards/clients
3. Add admin UI to assign them

### Phase 2: Better UX (4 hours)
1. Add Invitation model
2. Add invitation creation endpoint
3. Update registration to accept invitation code
4. Add invitation UI for admins

### Phase 3: Advanced (Optional)
1. Company code system
2. Email domain matching
3. Bulk assignment

---

## 🚨 CRITICAL QUESTIONS TO ANSWER

1. **Who creates SecurityCompanies?**
   - Super Admin? Or first admin user?

2. **Can guards/clients work for multiple companies?**
   - Current schema allows it (unique constraint is per company)
   - But is this the business model?

3. **What happens to shifts when guard is assigned?**
   - Should existing shifts be linked to company?
   - Or only new shifts after assignment?

4. **Client-Company relationship:**
   - Can one client work with multiple security companies?
   - Or exclusive relationship?

---

## 📊 RELATIONSHIP DIAGRAM

```
User (Platform)
  ├── Guard (Platform)
  │     └── CompanyGuard (Junction)
  │           └── SecurityCompany A
  │           └── SecurityCompany B (if multi-company)
  │
  ├── Client (Platform)
  │     └── CompanyClient (Junction)
  │           └── SecurityCompany A
  │
  └── CompanyUser (Junction) - Admin/Manager
        └── SecurityCompany A

SecurityCompany A
  ├── CompanyUser[] (Admins)
  ├── CompanyGuard[] (Guards)
  ├── CompanyClient[] (Clients)
  └── CompanySite[] (Sites)

Shift
  ├── guardId → Guard
  ├── clientId → Client
  ├── siteId → Site
  └── (No direct link to SecurityCompany)
      But can be inferred from Guard/Client → CompanyGuard/CompanyClient
```

---

## ✅ NEXT STEPS

1. **Decide on assignment flow** (invitation vs manual vs both)
2. **Implement admin assignment endpoints** (if not exists)
3. **Add admin UI** for viewing/assigning guards/clients
4. **Update registration** to support invitation codes (if chosen)
5. **Test multi-tenant isolation** (guards only see their company's data)

---

**This architecture supports multiple companies, but the linking mechanism needs to be implemented based on your business requirements.**

