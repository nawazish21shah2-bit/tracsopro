# Test Users - Guard Tracking App

## 🔑 Test User Credentials

All test users use the password: **`password`** (unless otherwise specified)

---

## 👤 **GUARD Users**

### 1. Guard 1
- **Email:** `guard1@example.com`
- **Password:** `Passw0rd!`
- **Name:** John Doe
- **Phone:** +1234567890
- **Role:** GUARD
- **Employee ID:** EMP001
- **Status:** ACTIVE

### 2. Guard 2
- **Email:** `guard2@example.com`
- **Password:** `Passw0rd!`
- **Name:** Jane Smith
- **Phone:** +1234567891
- **Role:** GUARD
- **Employee ID:** EMP003
- **Status:** ACTIVE

### 3. Test Guard
- **Email:** `guard@test.com`
- **Password:** `password`
- **Name:** Test Guard
- **Phone:** +1234567896
- **Role:** GUARD
- **Employee ID:** EMP-TEST-{timestamp}
- **Status:** ACTIVE
- **Linked to:** Test Security Company

### 4. Michael Anderson (from test@roles.com seed)
- **Email:** `michael.guard@test.com`
- **Password:** `password`
- **Name:** Michael Anderson
- **Role:** GUARD
- **Department:** Security Operations

### 5. Emily Martinez
- **Email:** `emily.guard@test.com`
- **Password:** `password`
- **Name:** Emily Martinez
- **Role:** GUARD
- **Department:** Patrol Division

### 6. Robert Taylor
- **Email:** `robert.guard@test.com`
- **Password:** `password`
- **Name:** Robert Taylor
- **Role:** GUARD
- **Department:** Access Control

### 7. Jessica Thomas
- **Email:** `jessica.guard@test.com`
- **Password:** `password`
- **Name:** Jessica Thomas
- **Role:** GUARD
- **Department:** Emergency Response

### 8. Daniel Jackson
- **Email:** `daniel.guard@test.com`
- **Password:** `password`
- **Name:** Daniel Jackson
- **Role:** GUARD
- **Department:** Site Security

---

## 👔 **ADMIN Users**

### 1. Admin User
- **Email:** `admin@example.com`
- **Password:** `Passw0rd!`
- **Name:** Admin User
- **Phone:** +1234567893
- **Role:** ADMIN
- **Linked to:** Test Security Company (OWNER)

### 2. Supervisor 1
- **Email:** `supervisor1@example.com`
- **Password:** `Passw0rd!`
- **Name:** Sarah Johnson
- **Phone:** +1234567892
- **Role:** ADMIN

---

## 👑 **SUPER_ADMIN Users**

### 1. Super Admin
- **Email:** `superadmin@test.com`
- **Password:** `password`
- **Name:** Super Admin
- **Phone:** +1234567894
- **Role:** SUPER_ADMIN
- **Account Type:** COMPANY
- **Access:** Platform-level (no company restrictions)

---

## 🏢 **CLIENT Users**

### 1. Test Client (Individual)
- **Email:** `client@test.com`
- **Password:** `password`
- **Name:** Client User
- **Phone:** +1234567895
- **Role:** CLIENT
- **Account Type:** INDIVIDUAL
- **Linked to:** Test Security Company

### 2. Test Roles Client (Company)
- **Email:** `test@roles.com`
- **Password:** `password`
- **Name:** Test Client
- **Phone:** +1-555-0100
- **Role:** CLIENT
- **Account Type:** COMPANY
- **Company Name:** Test Security Solutions Inc.
- **Registration Number:** TS123456789
- **Tax ID:** TAX-TS-2024
- **Address:** 100 Test Business Plaza, New York, NY 10001
- **Website:** https://testsecurity.com

**Sites for test@roles.com:**
1. **Ocean View Vila** - 1321 Baker Street, NY
2. **Central Business District** - 500 Corporate Plaza, New York, NY 10002
3. **Riverside Shopping Center** - 789 Commerce Blvd, New York, NY 10003

**Guards assigned:**
- Michael Anderson, Emily Martinez, Robert Taylor, Jessica Thomas, Daniel Jackson

**Shift Postings:**
- Multiple shifts created for each site (morning, afternoon, tomorrow)
- Some shifts are IN_PROGRESS, some are ASSIGNED, some are COMPLETED

---

## 📋 **Quick Reference**

### Most Common Test Users:

| Role | Email | Password | Use Case |
|------|-------|----------|----------|
| **GUARD** | `guard@test.com` | `password` | Guard testing |
| **ADMIN** | `admin@example.com` | `Passw0rd!` | Admin testing |
| **CLIENT** | `client@test.com` | `password` | Individual client |
| **CLIENT** | `test@roles.com` | `password` | Company client with sites/shifts |
| **SUPER_ADMIN** | `superadmin@test.com` | `password` | Platform admin |

---

## 🗄️ **Database Seed Files**

1. **`prisma/seed.ts`** - Main seed file
   - Creates: guard1@example.com, guard2@example.com, admin@example.com, supervisor1@example.com, superadmin@test.com, client@test.com, guard@test.com
   - Creates: Security Company, locations, checkpoints, incidents

2. **`scripts/seed-test-roles-client.js`** - Test roles client seed
   - Creates: test@roles.com (company client)
   - Creates: 5 guards (michael, emily, robert, jessica, daniel)
   - Creates: 3 sites with shift postings and assignments

3. **`prisma/seed-shifts.ts`** - Additional shift data

4. **`prisma/seed-notifications.ts`** - Notification data

---

## 🚀 **Running Seeds**

```bash
# Main seed (creates basic users and company)
npm run db:seed

# Test roles client seed (creates test@roles.com with sites/shifts)
npm run db:seed-test-roles

# Seed shifts
npm run db:seed-shifts

# Seed notifications
npm run db:seed-notifications
```

---

## ⚠️ **Notes**

- All passwords are hashed using bcrypt
- Most test users use `password` as password
- Some users from seed.ts use `Passw0rd!` as password
- Guards are linked to "Test Security Company"
- Client `test@roles.com` has complete setup with sites, guards, and shifts
- Super Admin has platform-level access (no company restrictions)

---

**Last Updated:** $(date)
**Backend Running:** ✅ Port 3000

